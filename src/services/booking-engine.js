/**
 * موتور رزرو — محاسبه تایم آزاد + قفل موقت + جلوگیری از تداخل
 *
 * قوانین:
 * 1. Slot locking با lockExpiresAt
 * 2. رزرو قطعی فقط پس از پرداخت / تأیید
 * 3. جلوگیری از double-book برای staff (مگر capacity)
 * 4. Buffer time بعد از هر خدمت
 * 5. ساعات کاری + مرخصی + تعطیلات
 */

import {
  and,
  eq,
  gte,
  gt,
  lt,
  or,
  isNull,
} from 'drizzle-orm';
import { db } from '@/db';
import { bookings } from '@/db/schema/bookings';
import { services, workingHours, timeOffs } from '@/db/schema/services';
import { businessMembers } from '@/db/schema/businesses';
import {
  combineIranDateTime,
  formatTehranTime,
  tehranDayOfWeek,
} from '@/lib/datetime';

/** وضعیت‌هایی که slot را اشغال می‌کنند */
export const OCCUPYING_STATUSES = ['pending_payment', 'confirmed', 'completed'];

/**
 * @param {string} hhmm
 */
export function timeToMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * @param {number} minutes
 */
export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * dayOfWeek: 0=شنبه ... 6=جمعه (بر اساس Asia/Tehran)
 * @param {Date} date
 */
export function jalaliDayOfWeek(date) {
  return tehranDayOfWeek(date);
}

/**
 * YYYY-MM-DD + HH:mm به وقت تهران (نه TZ سرور)
 * @param {string} dateStr
 * @param {string} hhmm
 */
export function combineLocalDateTime(dateStr, hhmm) {
  return combineIranDateTime(dateStr, hhmm);
}

/**
 * [startA, endA) ∩ [startB, endB)
 */
export function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

/**
 * @param {string} businessId
 * @param {string | null} memberId
 * @param {number} dayOfWeek
 */
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

/**
 * @param {string} businessId
 * @param {string | null} memberId
 * @param {Date} dayStart
 * @param {Date} dayEnd
 */
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

/**
 * @param {{ businessId: string, memberId?: string | null, rangeStart: Date, rangeEnd: Date }} opts
 */
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

/**
 * @param {{
 *   businessId: string,
 *   serviceId: string,
 *   date: string,
 *   memberId?: string | null,
 *   slotStepMinutes?: number,
 * }} opts
 */
export async function getAvailableSlots({
  businessId,
  serviceId,
  date,
  memberId = null,
  slotStepMinutes = 15,
}) {
  const [service] = await db
    .select()
    .from(services)
    .where(
      and(
        eq(services.id, serviceId),
        eq(services.businessId, businessId),
        eq(services.isActive, true),
      ),
    )
    .limit(1);

  if (!service) {
    return { ok: false, error: 'خدمت یافت نشد' };
  }

  const duration = service.durationMinutes;
  const buffer = service.bufferMinutes || 0;
  const blockSize = duration + buffer;
  const isCapacity = service.type === 'capacity';
  const capacity = service.capacity || 1;

  const dayStart = combineLocalDateTime(date, '00:00');
  const dayEnd = combineLocalDateTime(date, '23:59');
  dayEnd.setSeconds(59, 999);

  const dow = jalaliDayOfWeek(dayStart);

  /** @type {Array<{ id: string | null }>} */
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

  // پیش‌بارگذاری buffer همه سرویس‌های درگیر
  const bufferCache = new Map([[serviceId, buffer]]);

  const now = new Date();
  /** @type {Map<string, { start: string, end: string, startsAt: string, endsAt: string, memberIds: (string|null)[] }>} */
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
      busy.push({
        start: new Date(b.startsAt),
        end: new Date(new Date(b.endsAt).getTime() + bBuffer * 60_000),
      });
    }
    for (const off of offs) {
      busy.push({ start: off.start, end: off.end });
    }

    for (const win of windows) {
      for (let t = win.start; t + duration <= win.end; t += slotStepMinutes) {
        if (t + blockSize > win.end) continue;

        const slotStart = combineLocalDateTime(date, minutesToTime(t));
        const slotEnd = new Date(slotStart.getTime() + duration * 60_000);
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
        // برچسب دکمه = ساعت دیوارساعت تهران (نه UTC)
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

  return {
    ok: true,
    service: {
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      bufferMinutes: service.bufferMinutes,
      price: service.price,
      type: service.type,
    },
    date,
    slots,
  };
}

/**
 * @param {{ businessId: string, serviceId: string, memberId?: string | null, startsAt: string | Date }} opts
 */
export async function isSlotAvailable({
  businessId,
  serviceId,
  memberId,
  startsAt,
}) {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) {
    return { ok: false, error: 'زمان نامعتبر است' };
  }

  // تاریخ روز را به وقت تهران استخراج کن (نه TZ سرور)
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

  return { ok: true, slot: match, service: result.service };
}

/**
 * ایجاد رزرو pending + قفل موقت
 */
export async function createPendingBooking({
  businessId,
  serviceId,
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

  const availability = await isSlotAvailable({
    businessId,
    serviceId,
    memberId,
    startsAt,
  });
  if (!availability.ok) return availability;

  // re-check برای race condition ساده
  const recheck = await isSlotAvailable({
    businessId,
    serviceId,
    memberId: availability.slot.memberId,
    startsAt,
  });
  if (!recheck.ok) return recheck;

  const service = availability.service;
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + service.durationMinutes * 60_000);
  const lockMins = lockMinutes ?? Number(process.env.SLOT_LOCK_MINUTES || 10);
  const lockExpiresAt = new Date(Date.now() + lockMins * 60_000);
  const totalAmount = service.price;
  const depositAmount = Math.round((totalAmount * depositPercent) / 100);

  const [row] = await db
    .insert(bookings)
    .values({
      businessId,
      serviceId,
      memberId: availability.slot.memberId,
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

  return {
    ok: true,
    booking: row,
    service,
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

  // اگر قفل منقضی شده
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
