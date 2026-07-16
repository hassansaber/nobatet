/**
 * CRM + باشگاه مشتریان + گزارش‌ها
 */
import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  customerProfiles,
  loyaltySettings,
  loyaltyLedger,
  discountCodes,
} from '@/db/schema/crm';
import { bookings } from '@/db/schema/bookings';
import { services } from '@/db/schema/services';
import { businessMembers } from '@/db/schema/businesses';
import { users } from '@/db/schema/users';
import { normalizeIranPhone } from '@/lib/utils';

// ─── Profiles ───────────────────────────────────────────

export async function upsertCustomerProfile(businessId, phoneRaw, patch = {}) {
  const phone = normalizeIranPhone(phoneRaw);
  if (!phone) return { ok: false, error: 'شماره موبایل معتبر نیست' };

  const [existing] = await db
    .select()
    .from(customerProfiles)
    .where(
      and(
        eq(customerProfiles.businessId, businessId),
        eq(customerProfiles.phone, phone),
      ),
    )
    .limit(1);

  if (existing) {
    const [row] = await db
      .update(customerProfiles)
      .set({
        ...(patch.displayName !== undefined
          ? { displayName: patch.displayName }
          : {}),
        ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
        ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
        ...(patch.tier !== undefined ? { tier: patch.tier } : {}),
        ...(patch.userId !== undefined ? { userId: patch.userId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(customerProfiles.id, existing.id))
      .returning();
    return { ok: true, profile: row, created: false };
  }

  const [row] = await db
    .insert(customerProfiles)
    .values({
      businessId,
      phone,
      displayName: patch.displayName || null,
      notes: patch.notes || null,
      tags: patch.tags || [],
      tier: patch.tier || 'normal',
      userId: patch.userId || null,
      referralCode: makeReferralCode(),
    })
    .returning();

  // welcome points
  const settings = await getLoyaltySettings(businessId);
  if (settings.enabled && settings.welcomePoints > 0) {
    await adjustLoyaltyPoints({
      businessId,
      profileId: row.id,
      points: settings.welcomePoints,
      type: 'welcome',
      note: 'امتیاز خوش‌آمدگویی',
    });
  }

  const [fresh] = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.id, row.id))
    .limit(1);

  return { ok: true, profile: fresh, created: true };
}

export async function getCustomerProfile(businessId, phoneRaw) {
  const phone = normalizeIranPhone(phoneRaw);
  if (!phone) return null;
  const [row] = await db
    .select()
    .from(customerProfiles)
    .where(
      and(
        eq(customerProfiles.businessId, businessId),
        eq(customerProfiles.phone, phone),
      ),
    )
    .limit(1);
  return row || null;
}

/**
 * لیست CRM غنی‌شده با آمار رزرو
 */
export async function listCrmCustomers(businessId, { tier, q } = {}) {
  const profiles = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.businessId, businessId))
    .orderBy(desc(customerProfiles.updatedAt));

  // booking stats by phone
  const bookingRows = await db
    .select({
      customerPhone: bookings.customerPhone,
      customerName: bookings.customerName,
      status: bookings.status,
      totalAmount: bookings.totalAmount,
      startsAt: bookings.startsAt,
    })
    .from(bookings)
    .where(eq(bookings.businessId, businessId));

  const stats = new Map();
  for (const r of bookingRows) {
    const cur = stats.get(r.customerPhone) || {
      visits: 0,
      totalSpent: 0,
      lastVisit: null,
      name: r.customerName,
      cancelled: 0,
      confirmed: 0,
    };
    cur.visits += 1;
    if (['confirmed', 'completed'].includes(r.status)) {
      cur.totalSpent += r.totalAmount || 0;
      cur.confirmed += 1;
    }
    if (r.status === 'cancelled') cur.cancelled += 1;
    if (!cur.lastVisit || new Date(r.startsAt) > new Date(cur.lastVisit)) {
      cur.lastVisit = r.startsAt;
      cur.name = r.customerName || cur.name;
    }
    stats.set(r.customerPhone, cur);
  }

  // merge phones that only exist in bookings
  const profileByPhone = new Map(profiles.map((p) => [p.phone, p]));
  for (const [phone, st] of stats) {
    if (!profileByPhone.has(phone)) {
      profileByPhone.set(phone, {
        id: null,
        businessId,
        phone,
        displayName: st.name,
        notes: null,
        tags: [],
        tier: 'normal',
        loyaltyPoints: 0,
        referralCode: null,
      });
    }
  }

  let list = Array.from(profileByPhone.values()).map((p) => {
    const st = stats.get(p.phone) || {
      visits: 0,
      totalSpent: 0,
      lastVisit: null,
      cancelled: 0,
      confirmed: 0,
    };
    return {
      ...p,
      displayName: p.displayName || st.name || '—',
      visits: st.visits,
      totalSpent: st.totalSpent,
      lastVisit: st.lastVisit,
      cancelRate:
        st.visits > 0 ? Math.round((st.cancelled / st.visits) * 100) : 0,
    };
  });

  if (tier) list = list.filter((c) => c.tier === tier);
  if (q) {
    const qq = q.trim().toLowerCase();
    list = list.filter(
      (c) =>
        (c.displayName || '').toLowerCase().includes(qq) ||
        (c.phone || '').includes(qq) ||
        (c.tags || []).some((t) => String(t).toLowerCase().includes(qq)),
    );
  }

  list.sort((a, b) => {
    const ta = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
    const tb = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
    return tb - ta;
  });

  return list;
}

export async function updateCustomerCrm(businessId, profileIdOrPhone, data) {
  const key = String(profileIdOrPhone || '');
  const looksLikeUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      key,
    );

  let profile = null;
  if (looksLikeUuid) {
    const [row] = await db
      .select()
      .from(customerProfiles)
      .where(
        and(
          eq(customerProfiles.businessId, businessId),
          eq(customerProfiles.id, key),
        ),
      )
      .limit(1);
    profile = row || null;
  }

  if (!profile) {
    // treat as phone (create or update)
    return upsertCustomerProfile(businessId, key, data);
  }

  return upsertCustomerProfile(businessId, profile.phone, data);
}

// ─── Loyalty ────────────────────────────────────────────

export async function getLoyaltySettings(businessId) {
  const [row] = await db
    .select()
    .from(loyaltySettings)
    .where(eq(loyaltySettings.businessId, businessId))
    .limit(1);

  if (row) return row;

  const [created] = await db
    .insert(loyaltySettings)
    .values({ businessId })
    .returning();
  return created;
}

export async function updateLoyaltySettings(businessId, data) {
  await getLoyaltySettings(businessId);
  const [row] = await db
    .update(loyaltySettings)
    .set({
      ...(data.enabled != null ? { enabled: Boolean(data.enabled) } : {}),
      ...(data.pointsPerThousand != null
        ? { pointsPerThousand: Number(data.pointsPerThousand) }
        : {}),
      ...(data.minRedeemPoints != null
        ? { minRedeemPoints: Number(data.minRedeemPoints) }
        : {}),
      ...(data.pointValueToman != null
        ? { pointValueToman: Number(data.pointValueToman) }
        : {}),
      ...(data.welcomePoints != null
        ? { welcomePoints: Number(data.welcomePoints) }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(loyaltySettings.businessId, businessId))
    .returning();
  return row;
}

export async function adjustLoyaltyPoints({
  businessId,
  profileId,
  points,
  type,
  note,
  bookingId,
}) {
  const delta = Number(points);
  if (!delta) return { ok: false, error: 'امتیاز نامعتبر' };

  const [profile] = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.id, profileId))
    .limit(1);
  if (!profile) return { ok: false, error: 'پروفایل یافت نشد' };

  const next = Math.max(0, (profile.loyaltyPoints || 0) + delta);
  const [updated] = await db
    .update(customerProfiles)
    .set({ loyaltyPoints: next, updatedAt: new Date() })
    .where(eq(customerProfiles.id, profileId))
    .returning();

  await db.insert(loyaltyLedger).values({
    businessId,
    profileId,
    type: type || (delta > 0 ? 'earn' : 'adjust'),
    points: delta,
    note: note || null,
    bookingId: bookingId || null,
  });

  return { ok: true, profile: updated };
}

/**
 * بعد از تأیید رزرو — امتیاز بده
 */
export async function awardPointsForBooking(booking) {
  try {
    const settings = await getLoyaltySettings(booking.businessId);
    if (!settings.enabled) return;

    const amount = booking.depositAmount || booking.totalAmount || 0;
    const points = Math.floor(
      (amount / 1000) * (settings.pointsPerThousand || 1),
    );
    if (points <= 0) return;

    const up = await upsertCustomerProfile(
      booking.businessId,
      booking.customerPhone,
      { displayName: booking.customerName, userId: booking.customerId },
    );
    if (!up.ok) return;

    await adjustLoyaltyPoints({
      businessId: booking.businessId,
      profileId: up.profile.id,
      points,
      type: 'earn',
      note: `امتیاز رزرو ${booking.id.slice(0, 8)}`,
      bookingId: booking.id,
    });
  } catch (err) {
    console.error('[crm] awardPointsForBooking', err);
  }
}

export async function listLoyaltyLedger(businessId, profileId) {
  return db
    .select()
    .from(loyaltyLedger)
    .where(
      and(
        eq(loyaltyLedger.businessId, businessId),
        eq(loyaltyLedger.profileId, profileId),
      ),
    )
    .orderBy(desc(loyaltyLedger.createdAt))
    .limit(50);
}

// ─── Discount codes ─────────────────────────────────────

export async function listDiscountCodes(businessId) {
  return db
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.businessId, businessId))
    .orderBy(desc(discountCodes.createdAt));
}

export async function createDiscountCode(businessId, data) {
  const code = String(data.code || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  if (!code || code.length < 3) {
    return { ok: false, error: 'کد حداقل ۳ کاراکتر باشد' };
  }
  try {
    const [row] = await db
      .insert(discountCodes)
      .values({
        businessId,
        code,
        type: data.type === 'fixed' ? 'fixed' : 'percent',
        value: Number(data.value),
        maxUses: data.maxUses != null ? Number(data.maxUses) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        note: data.note || null,
        isActive: data.isActive !== false,
      })
      .returning();
    return { ok: true, code: row };
  } catch {
    return { ok: false, error: 'این کد قبلاً وجود دارد' };
  }
}

export async function toggleDiscountCode(businessId, id, isActive) {
  const [row] = await db
    .update(discountCodes)
    .set({ isActive: Boolean(isActive) })
    .where(
      and(eq(discountCodes.id, id), eq(discountCodes.businessId, businessId)),
    )
    .returning();
  return row || null;
}

// ─── Reports ────────────────────────────────────────────

/**
 * گزارش آماری برای داشبورد
 * @param {string} businessId
 * @param {{ from?: Date, to?: Date }} range
 */
export async function getBusinessReports(businessId, range = {}) {
  // پیش‌فرض: از N روز قبل تا ۶۰ روز بعد (رزروهای آینده هم در آمار بیایند)
  const now = new Date();
  const to =
    range.to ||
    (() => {
      const d = new Date(now);
      d.setDate(d.getDate() + 60);
      d.setHours(23, 59, 59, 999);
      return d;
    })();
  const from =
    range.from ||
    (() => {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      d.setHours(0, 0, 0, 0);
      return d;
    })();

  const rows = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      startsAt: bookings.startsAt,
      totalAmount: bookings.totalAmount,
      depositAmount: bookings.depositAmount,
      serviceId: bookings.serviceId,
      memberId: bookings.memberId,
      serviceName: services.name,
    })
    .from(bookings)
    .leftJoin(services, eq(services.id, bookings.serviceId))
    .where(
      and(
        eq(bookings.businessId, businessId),
        gte(bookings.startsAt, from),
        lte(bookings.startsAt, to),
      ),
    );

  const paidStatuses = new Set(['confirmed', 'completed']);
  let revenue = 0;
  let confirmed = 0;
  let cancelled = 0;
  let completed = 0;
  let noShow = 0;
  let pending = 0;

  /** @type {Map<string, number>} */
  const dailyRevenue = new Map();
  /** @type {Map<string, { name: string, count: number, revenue: number }>} */
  const byService = new Map();
  /** @type {Map<string, { count: number, revenue: number }>} */
  const byMember = new Map();

  for (const r of rows) {
    if (r.status === 'cancelled') cancelled += 1;
    if (r.status === 'completed') completed += 1;
    if (r.status === 'no_show') noShow += 1;
    if (r.status === 'pending_payment') pending += 1;

    if (paidStatuses.has(r.status)) {
      confirmed += 1;
      const amt = r.totalAmount || 0;
      revenue += amt;

      const dayKey = new Date(r.startsAt).toISOString().slice(0, 10);
      dailyRevenue.set(dayKey, (dailyRevenue.get(dayKey) || 0) + amt);

      const sn = r.serviceName || 'نامشخص';
      const sid = r.serviceId || sn;
      const sc = byService.get(sid) || { name: sn, count: 0, revenue: 0 };
      sc.count += 1;
      sc.revenue += amt;
      byService.set(sid, sc);

      if (r.memberId) {
        const mc = byMember.get(r.memberId) || { count: 0, revenue: 0 };
        mc.count += 1;
        mc.revenue += amt;
        byMember.set(r.memberId, mc);
      }
    }
  }

  // fill missing days
  const days = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    days.push({
      date: key,
      label: cursor.toLocaleDateString('fa-IR', {
        month: 'short',
        day: 'numeric',
      }),
      revenue: dailyRevenue.get(key) || 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  // staff names
  const memberIds = Array.from(byMember.keys());
  const staffMap = new Map();
  if (memberIds.length) {
    const staffRows = await db
      .select({
        id: businessMembers.id,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(businessMembers)
      .leftJoin(users, eq(users.id, businessMembers.userId))
      .where(eq(businessMembers.businessId, businessId));
    for (const s of staffRows) {
      staffMap.set(
        s.id,
        [s.firstName, s.lastName].filter(Boolean).join(' ') || 'کارمند',
      );
    }
  }

  const topServices = Array.from(byService.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const topStaff = Array.from(byMember.entries())
    .map(([id, v]) => ({
      memberId: id,
      name: staffMap.get(id) || '—',
      count: v.count,
      revenue: v.revenue,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const total = rows.length;
  const cancelRate = total ? Math.round((cancelled / total) * 100) : 0;

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    summary: {
      totalBookings: total,
      confirmed,
      completed,
      cancelled,
      noShow,
      pending,
      revenue,
      cancelRate,
      avgTicket: confirmed ? Math.round(revenue / confirmed) : 0,
    },
    dailyRevenue: days,
    topServices,
    topStaff,
  };
}

// ─── Export helpers ─────────────────────────────────────

/**
 * ساخت CSV از آرایه آبجکت
 * @param {Record<string, unknown>[]} rows
 * @param {string[]} columns
 */
export function toCsv(rows, columns) {
  const escape = (v) => {
    const s = v == null ? '' : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.map((c) => escape(c)).join(',');
  const body = rows
    .map((r) => columns.map((c) => escape(r[c])).join(','))
    .join('\n');
  // BOM for Excel UTF-8
  return `\uFEFF${header}\n${body}`;
}

export async function exportBookingsCsv(businessId, range = {}) {
  const to = range.to || new Date();
  const from =
    range.from ||
    (() => {
      const d = new Date(to);
      d.setMonth(d.getMonth() - 1);
      return d;
    })();

  const rows = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      customerName: bookings.customerName,
      customerPhone: bookings.customerPhone,
      totalAmount: bookings.totalAmount,
      depositAmount: bookings.depositAmount,
      serviceName: services.name,
    })
    .from(bookings)
    .leftJoin(services, eq(services.id, bookings.serviceId))
    .where(
      and(
        eq(bookings.businessId, businessId),
        gte(bookings.startsAt, from),
        lte(bookings.startsAt, to),
      ),
    )
    .orderBy(desc(bookings.startsAt));

  const flat = rows.map((r) => ({
    id: r.id,
    status: r.status,
    startsAt: new Date(r.startsAt).toLocaleString('fa-IR'),
    endsAt: new Date(r.endsAt).toLocaleString('fa-IR'),
    customerName: r.customerName,
    customerPhone: r.customerPhone,
    serviceName: r.serviceName,
    totalAmount: r.totalAmount,
    depositAmount: r.depositAmount,
  }));

  return toCsv(flat, [
    'id',
    'status',
    'startsAt',
    'endsAt',
    'customerName',
    'customerPhone',
    'serviceName',
    'totalAmount',
    'depositAmount',
  ]);
}

export async function exportCustomersCsv(businessId) {
  const list = await listCrmCustomers(businessId);
  const flat = list.map((c) => ({
    phone: c.phone,
    name: c.displayName,
    tier: c.tier,
    tags: (c.tags || []).join('|'),
    visits: c.visits,
    totalSpent: c.totalSpent,
    loyaltyPoints: c.loyaltyPoints,
    lastVisit: c.lastVisit
      ? new Date(c.lastVisit).toLocaleString('fa-IR')
      : '',
    notes: c.notes || '',
  }));
  return toCsv(flat, [
    'phone',
    'name',
    'tier',
    'tags',
    'visits',
    'totalSpent',
    'loyaltyPoints',
    'lastVisit',
    'notes',
  ]);
}

function makeReferralCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
