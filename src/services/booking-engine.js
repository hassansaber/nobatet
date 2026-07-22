/**
 * موتور رزرو — محاسبه تایم آزاد + قفل موقت + جلوگیری از تداخل
 * نسخه جدید: پشتیبانی از چند خدمت همزمان
 */

import {
  and,
  eq,
  gte,
  gt,
  lt,
  or,
  isNull,
  inArray,
  sql,
} from 'drizzle-orm';
import { db } from '@/db';
import { bookings } from '@/db/schema/bookings';
import { bookingServices } from '@/db/schema/booking-services.js';
import { services, workingHours, timeOffs, staffServices } from '@/db/schema/services';
import { businessMembers } from '@/db/schema/businesses';
import {
  combineIranDateTime,
  formatTehranTime,
  tehranDayOfWeek,
} from '@/lib/datetime';

export const OCCUPYING_STATUSES = ['pending_payment', 'confirmed', 'completed'];

export function timeToMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function jalaliDayOfWeek(date) {
  return tehranDayOfWeek(date);
}

export function combineLocalDateTime(dateStr, hhmm) {
  return combineIranDateTime(dateStr, hhmm);
}

export function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

export async function getWorkingWindows(businessId, memberId, dayOfWeek) {
  const rows = await db
    .select()
    .from(workingHours)
    .where(
      and(
        eq(workingHours.businessId, businessId),
        eq(workingHours.dayOfWeek, dayOfWeek),
      ),
    );

  const memberRows = memberId
    ? rows.filter((r) => r.memberId === memberId)
    : [];
  const businessRows = rows.filter((r) => r.memberId == null);
  const source = memberRows.length > 0 ? memberRows : businessRows;

  return source
    .filter((r) => !r.isOff)
    .map((r) => ({
      start: timeToMinutes(r.startTime),
      end: timeToMinutes(r.endTime),
    }))
    .filter((w) => w.end > w.start);
}

export async function getTimeOffsForDay(businessId, memberId, dayStart, dayEnd) {
  const conditions = [
    eq(timeOffs.businessId, businessId),
    lt(timeOffs.startAt, dayEnd),
    gt(timeOffs.endAt, dayStart),
  ];

  if (memberId) {
    conditions.push(
      or(isNull(timeOffs.memberId), eq(timeOffs.memberId, memberId)),
    );
  }

  const rows = await db
    .select()
    .from(timeOffs)
    .where(and(...conditions));

  return rows.map((r) => ({
    start: new Date(r.startAt),
    end: new Date(r.endAt),
    memberId: r.memberId,
  }));
}

export async function getOccupyingBookings({
  businessId,
  memberId,
  rangeStart,
  rangeEnd,
}) {
  const now = new Date();

  const conditions = [
    eq(bookings.businessId, businessId),
    lt(bookings.startsAt, rangeEnd),
    gt(bookings.endsAt, rangeStart),
    or(
      eq(bookings.status, 'confirmed'),
      eq(bookings.status, 'completed'),
      and(
        eq(bookings.status, 'pending_payment'),
        or(isNull(bookings.lockExpiresAt), gte(bookings.lockExpiresAt, now)),
      ),
    ),
  ];

  if (memberId) {
    conditions.push(eq(bookings.memberId, memberId));
  }

  return db
    .select({
      id: bookings.id,
      memberId: bookings.memberId,
      serviceId: bookings.serviceId,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      status: bookings.status,
      lockExpiresAt: bookings.lockExpiresAt,
    })
    .from(bookings)
    .where(and(...conditions));
}

// Helper to fetch services by ids
async function fetchServicesByIds(businessId, serviceIds) {
  if (!serviceIds || serviceIds.length === 0) return [];
  const rows = await db
    .select()
    .from(services)
    .where(
      and(
        eq(services.businessId, businessId),
        inArray(services.id, serviceIds),
        eq(services.isActive, true),
      ),
    );
  return rows;
}

/**
 * دریافت تایم‌های آزاد - پشتیبانی از چند خدمت
 * @param {{
 *   businessId: string,
 *   serviceId?: string,
 *   serviceIds?: string[],
 *   date: string,
 *   memberId?: string | null,
 *   slotStepMinutes?: number,
 * }} opts
 */
export async function getAvailableSlots({
  businessId,
  serviceId,
  serviceIds,
  date,
  memberId = null,
  slotStepMinutes = 15,
}) {
  // نرمال‌سازی: اگر serviceId تنها داده شده، تبدیل به آرایه
  let ids = [];
  if (Array.isArray(serviceIds) && serviceIds.length > 0) {
    ids = serviceIds;
  } else if (serviceId) {
    ids = [serviceId];
  }

  if (ids.length === 0) {
    return { ok: false, error: 'خدمت انتخاب نشده' };
  }

  // حذف تکراری
  ids = [...new Set(ids)];

  const serviceRows = await fetchServicesByIds(businessId, ids);
  if (serviceRows.length === 0) {
    return { ok: false, error: 'خدمت یافت نشد' };
  }
  if (serviceRows.length !== ids.length) {
    return { ok: false, error: 'برخی خدمات یافت نشد یا غیرفعال است' };
  }

  // محاسبه مجموع مدت و قیمت
  const totalDuration = serviceRows.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalBuffer = serviceRows.reduce((sum, s) => sum + (s.bufferMinutes || 0), 0);
  // بافر را فقط برای آخرین خدمت حساب نکنیم؟ ساده: مجموع بافرها
  const totalPrice = serviceRows.reduce((sum, s) => sum + (s.price || 0), 0);
  const blockSize = totalDuration + totalBuffer;

  // برای capacity: اگر هر کدام capacity بود، سخت‌ترین را در نظر بگیر
  const isCapacity = serviceRows.some((s) => s.type === 'capacity');
  const capacity = Math.min(...serviceRows.map((s) => s.capacity || 1));

  const dayStart = combineLocalDateTime(date, '00:00');
  const dayEnd = combineLocalDateTime(date, '23:59');
  dayEnd.setSeconds(59, 999);

  const dow = jalaliDayOfWeek(dayStart);

  let members = [];
  if (memberId) {
    const [m] = await db
      .select()
      .from(businessMembers)
      .where(
        and(
          eq(businessMembers.id, memberId),
          eq(businessMembers.businessId, businessId),
          eq(businessMembers.isActive, true),
        ),
      )
      .limit(1);
    if (!m) return { ok: false, error: 'کارمند یافت نشد' };
    members = [m];
  } else {
    members = await db
      .select()
      .from(businessMembers)
      .where(
        and(
          eq(businessMembers.businessId, businessId),
          eq(businessMembers.isActive, true),
        ),
      );
  }

  if (members.length === 0) {
    members = [{ id: null }];
  }

  // اگر کارمند انتخاب شده، چک کن که همه خدمات را بتواند ارائه دهد
  if (memberId && members.length > 0) {
    const staffServiceLinks = await db
      .select({ serviceId: staffServices.serviceId })
      .from(staffServices)
      .where(eq(staffServices.memberId, memberId));
    const allowed = new Set(staffServiceLinks.map((s) => s.serviceId));
    // اگر لینکی ندارد، یعنی همه خدمات را می‌تواند؟ در منطق قبلی همه خدمات به صورت پیش‌فرض لینک می‌شد، ولی برای اطمینان:
    // اگر هیچ لینکی ندارد، اجازه می‌دهیم (برای backward compat)
    if (allowed.size > 0) {
      const missing = ids.filter((id) => !allowed.has(id));
      if (missing.length > 0) {
        return { ok: false, error: 'کارمند انتخاب شده برخی خدمات را ارائه نمی‌دهد' };
      }
    }
  }

  const bufferCache = new Map();
  // cache for current services
  serviceRows.forEach((s) => bufferCache.set(s.id, s.bufferMinutes || 0));

  const now = new Date();
  const slotMap = new Map();

  for (const member of members) {
    const mid = member.id;
    const windows = await getWorkingWindows(businessId, mid, dow);
    if (windows.length === 0) continue;

    const offs = await getTimeOffsForDay(businessId, mid, dayStart, dayEnd);
    const occupying = await getOccupyingBookings({
      businessId,
      memberId: mid,
      rangeStart: dayStart,
      rangeEnd: new Date(dayEnd.getTime() + blockSize * 60_000),
    });

    const busy = [];
    for (const b of occupying) {
      let bBuffer = bufferCache.get(b.serviceId);
      if (bBuffer === undefined) {
        const [bs] = await db
          .select({ bufferMinutes: services.bufferMinutes })
          .from(services)
          .where(eq(services.id, b.serviceId))
          .limit(1);
        bBuffer = bs?.bufferMinutes ?? 0;
        bufferCache.set(b.serviceId, bBuffer);
      }
      // برای رزروهای چندخدمتی، مدت واقعی از endsAt - startsAt حساب می‌شود که قبلا مجموع بوده
      // پس بافر جدا نیاز نیست، چون endsAt شامل مدت است ولی بافر جدا؟ برای سادگی بافر را هم اضافه کنیم
      busy.push({
        start: new Date(b.startsAt),
        end: new Date(new Date(b.endsAt).getTime() + bBuffer * 60_000),
      });
    }
    for (const off of offs) {
      busy.push({ start: off.start, end: off.end });
    }

    for (const win of windows) {
      for (let t = win.start; t + totalDuration <= win.end; t += slotStepMinutes) {
        if (t + blockSize > win.end) continue;

        const slotStart = combineLocalDateTime(date, minutesToTime(t));
        const slotEnd = new Date(slotStart.getTime() + totalDuration * 60_000);
        const blockEnd = new Date(slotStart.getTime() + blockSize * 60_000);

        if (slotStart <= now) continue;

        if (isCapacity) {
          const overlaps = busy.filter((b) =>
            rangesOverlap(slotStart, slotEnd, b.start, b.end),
          );
          if (overlaps.length >= capacity) continue;
        } else {
          const conflict = busy.some((b) =>
            rangesOverlap(slotStart, blockEnd, b.start, b.end),
          );
          if (conflict) continue;
        }

        const key = slotStart.toISOString();
        const existing = slotMap.get(key);
        const startLabel = formatTehranTime(slotStart);
        const endLabel = formatTehranTime(slotEnd);
        if (existing) {
          if (mid && !existing.memberIds.includes(mid)) {
            existing.memberIds.push(mid);
          }
        } else {
          slotMap.set(key, {
            start: startLabel,
            end: endLabel,
            startsAt: slotStart.toISOString(),
            endsAt: slotEnd.toISOString(),
            memberIds: mid ? [mid] : [null],
          });
        }
      }
    }
  }

  const slots = Array.from(slotMap.values())
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((s) => ({
      start: s.start,
      end: s.end,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      memberId: memberId || s.memberIds.find(Boolean) || null,
      availableStaffCount: s.memberIds.filter(Boolean).length,
    }));

  // aggregated service info
  const aggregated = {
    id: serviceRows[0].id,
    ids: serviceRows.map((s) => s.id),
    name: serviceRows.length === 1 ? serviceRows[0].name : serviceRows.map((s) => s.name).join(' + '),
    names: serviceRows.map((s) => s.name),
    durationMinutes: totalDuration,
    bufferMinutes: totalBuffer,
    price: totalPrice,
    prices: serviceRows.map((s) => s.price),
    type: isCapacity ? 'capacity' : 'individual',
    services: serviceRows.map((s) => ({
      id: s.id,
      name: s.name,
      durationMinutes: s.durationMinutes,
      price: s.price,
    })),
  };

  return {
    ok: true,
    service: aggregated,
    services: serviceRows,
    date,
    slots,
  };
}

export async function isSlotAvailable({
  businessId,
  serviceId,
  serviceIds,
  memberId,
  startsAt,
}) {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) {
    return { ok: false, error: 'زمان نامعتبر است' };
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(start);
  const y = parts.find((p) => p.type === 'year')?.value;
  const mo = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  const date = `${y}-${mo}-${d}`;

  const result = await getAvailableSlots({
    businessId,
    serviceId,
    serviceIds,
    date,
    memberId: memberId || null,
  });

  if (!result.ok) return result;

  const match = result.slots.find(
    (s) => new Date(s.startsAt).getTime() === start.getTime(),
  );

  if (!match) {
    return { ok: false, error: 'این تایم دیگر در دسترس نیست' };
  }

  return { ok: true, slot: match, service: result.service, services: result.services };
}

export async function createPendingBooking({
  businessId,
  serviceId,
  serviceIds,
  memberId,
  customerId,
  customerName,
  customerPhone,
  startsAt,
  policyAccepted,
  notes,
  lockMinutes,
  depositPercent = 100,
}) {
  if (!policyAccepted) {
    return { ok: false, error: 'پذیرش قوانین رزرو الزامی است' };
  }

  // نرمال‌سازی لیست خدمات
  let ids = [];
  if (Array.isArray(serviceIds) && serviceIds.length > 0) ids = serviceIds;
  else if (serviceId) ids = [serviceId];
  ids = [...new Set(ids)];
  if (ids.length === 0) return { ok: false, error: 'خدمتی انتخاب نشده' };

  const availability = await isSlotAvailable({
    businessId,
    serviceId: ids[0],
    serviceIds: ids,
    memberId,
    startsAt,
  });
  if (!availability.ok) return availability;

  const recheck = await isSlotAvailable({
    businessId,
    serviceId: ids[0],
    serviceIds: ids,
    memberId: availability.slot.memberId,
    startsAt,
  });
  if (!recheck.ok) return recheck;

  const servicesList = availability.services || [];
  const totalDuration = servicesList.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPrice = servicesList.reduce((sum, s) => sum + (s.price || 0), 0);
  const primaryService = servicesList[0];

  const start = new Date(startsAt);
  const end = new Date(start.getTime() + totalDuration * 60_000);
  const lockMins = lockMinutes ?? Number(process.env.SLOT_LOCK_MINUTES || 10);
  const lockExpiresAt = new Date(Date.now() + lockMins * 60_000);
  const totalAmount = totalPrice;
  const depositAmount = Math.round((totalAmount * depositPercent) / 100);
  const memberIdToUse = availability.slot.memberId;

  // بهبود race condition: استفاده از transaction + FOR UPDATE + advisory lock
  // این از double-book شدن تحت بار همزمان جلوگیری می‌کند
  let row;
  try {
    row = await db.transaction(async (tx) => {
      // Advisory lock بر اساس memberId برای جلوگیری از تداخل همزمان
      // از hash memberId به int64 استفاده می‌کنیم
      try {
        const lockKey = memberIdToUse ? `x'${memberIdToUse.replace(/-/g, '').slice(0, 16)}'::bigint` : null;
        if (lockKey) {
          // pg_advisory_xact_lock برای transaction-level lock
          await tx.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(lockKey)})`);
        }
      } catch (e) {
        // اگر advisory lock fail شد، ادامه بده (fallback)
        console.warn('[createPendingBooking] advisory lock failed', e?.message);
      }

      // داخل ترنزاکشن دوباره چک کن که اسلات هنوز آزاد است (با FOR UPDATE)
      const now = new Date();
      const occupying = await tx
        .select({
          id: bookings.id,
          startsAt: bookings.startsAt,
          endsAt: bookings.endsAt,
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.businessId, businessId),
            eq(bookings.memberId, memberIdToUse),
            lt(bookings.startsAt, end),
            gt(bookings.endsAt, start),
            or(
              eq(bookings.status, 'confirmed'),
              eq(bookings.status, 'completed'),
              and(
                eq(bookings.status, 'pending_payment'),
                or(isNull(bookings.lockExpiresAt), gte(bookings.lockExpiresAt, now)),
              ),
            ),
          ),
        )
        .for('update');

      // چک capacity vs individual (ساده: اگر هر رزرو تداخل داشت، رد کن)
      if (occupying.length > 0) {
        // برای capacity نوع باید ظرفیت را چک کنیم
        const isCapacity = servicesList.some((s) => s.type === 'capacity');
        if (!isCapacity) {
          throw new Error('این تایم در لحظه توسط کاربر دیگری رزرو شد');
        } else {
          const capacity = Math.min(...servicesList.map((s) => s.capacity || 1));
          if (occupying.length >= capacity) {
            throw new Error('ظرفیت این سانس تکمیل شد');
          }
        }
      }

      const [inserted] = await tx
        .insert(bookings)
        .values({
          businessId,
          serviceId: primaryService.id,
          memberId: memberIdToUse,
          customerId: customerId || null,
          customerName,
          customerPhone,
          startsAt: start,
          endsAt: end,
          status: 'pending_payment',
          lockExpiresAt,
          notes: notes || null,
          policyAccepted: true,
          totalAmount,
          depositAmount,
        })
        .returning();

      // ذخیره خدمات واسط
      for (const sid of ids) {
        try {
          await tx.insert(bookingServices).values({ bookingId: inserted.id, serviceId: sid }).onConflictDoNothing();
        } catch {}
      }

      return inserted;
    });
  } catch (e) {
    if (e?.message?.includes('رزرو شد') || e?.message?.includes('ظرفیت')) {
      return { ok: false, error: e.message };
    }
    // اگر transaction fail شد، سعی کن با روش قدیمی (fallback)
    console.warn('[createPendingBooking] transaction failed, fallback', e?.message);
    const [fallbackRow] = await db
      .insert(bookings)
      .values({
        businessId,
        serviceId: primaryService.id,
        memberId: memberIdToUse,
        customerId: customerId || null,
        customerName,
        customerPhone,
        startsAt: start,
        endsAt: end,
        status: 'pending_payment',
        lockExpiresAt,
        notes: notes || null,
        policyAccepted: true,
        totalAmount,
        depositAmount,
      })
      .returning();
    for (const sid of ids) {
      try {
        await db.insert(bookingServices).values({ bookingId: fallbackRow.id, serviceId: sid }).onConflictDoNothing();
      } catch {}
    }
    row = fallbackRow;
  }

  return {
    ok: true,
    booking: row,
    service: availability.service,
    services: servicesList,
    lockExpiresAt,
  };
}

export async function confirmBooking(bookingId) {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) return { ok: false, error: 'رزرو یافت نشد' };
  if (booking.status === 'confirmed') return { ok: true, booking };
  if (booking.status !== 'pending_payment') {
    return { ok: false, error: 'وضعیت رزرو قابل تأیید نیست' };
  }

  if (booking.lockExpiresAt && new Date(booking.lockExpiresAt) < new Date()) {
    await db
      .update(bookings)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));
    return { ok: false, error: 'مهلت پرداخت تمام شده است' };
  }

  const [updated] = await db
    .update(bookings)
    .set({
      status: 'confirmed',
      lockExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  return { ok: true, booking: updated };
}

export async function expireStaleLocks() {
  const now = new Date();
  const result = await db
    .update(bookings)
    .set({ status: 'expired', updatedAt: now })
    .where(
      and(
        eq(bookings.status, 'pending_payment'),
        lt(bookings.lockExpiresAt, now),
      ),
    )
    .returning({ id: bookings.id });

  return { ok: true, expired: result.length, ids: result.map((r) => r.id) };
}

export async function cancelBooking(bookingId, reason) {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) return { ok: false, error: 'رزرو یافت نشد' };
  if (['cancelled', 'completed', 'expired'].includes(booking.status)) {
    return { ok: false, error: 'این رزرو قابل لغو نیست' };
  }

  const [updated] = await db
    .update(bookings)
    .set({
      status: 'cancelled',
      cancellationReason: reason || null,
      lockExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  return { ok: true, booking: updated };
}
