/**
 * SaaS: پلن‌ها، اشتراک، فاکتور، کمیسیون ویزیتور، پنل super admin
 */
import { and, asc, desc, eq, gte, lte, sql, count } from 'drizzle-orm';
import { db } from '@/db';
import {
  plans,
  subscriptions,
  subscriptionInvoices,
  visitorCommissions,
  platformSettings,
} from '@/db/schema/saas';
import { businesses, visitors, businessMembers } from '@/db/schema/businesses';
import { users } from '@/db/schema/users';
import { bookings } from '@/db/schema/bookings';
import { slugify } from '@/lib/utils';

// ─── Plans ──────────────────────────────────────────────

export async function listPlans({ publicOnly = false } = {}) {
  const conditions = [eq(plans.isActive, true)];
  if (publicOnly) conditions.push(eq(plans.isPublic, true));
  return db
    .select()
    .from(plans)
    .where(and(...conditions))
    .orderBy(asc(plans.sortOrder));
}

export async function listAllPlans() {
  return db.select().from(plans).orderBy(asc(plans.sortOrder));
}

export async function getPlanById(id) {
  const [row] = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
  return row || null;
}

export async function getPlanByCode(code) {
  const [row] = await db
    .select()
    .from(plans)
    .where(eq(plans.code, code))
    .limit(1);
  return row || null;
}

export async function upsertPlan(data) {
  if (data.id) {
    const [row] = await db
      .update(plans)
      .set({
        ...(data.name != null ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.longDescription !== undefined ? { longDescription: data.longDescription } : {}),
        ...(data.priceMonthly != null ? { priceMonthly: Number(data.priceMonthly) } : {}),
        ...(data.price3Months !== undefined ? { price3Months: data.price3Months != null ? Number(data.price3Months) : null } : {}),
        ...(data.priceYearly !== undefined ? { priceYearly: data.priceYearly != null ? Number(data.priceYearly) : null } : {}),
        ...(data.maxStaff != null ? { maxStaff: Number(data.maxStaff) } : {}),
        ...(data.maxServices != null ? { maxServices: Number(data.maxServices) } : {}),
        ...(data.maxBookingsPerMonth !== undefined ? { maxBookingsPerMonth: data.maxBookingsPerMonth != null ? Number(data.maxBookingsPerMonth) : null } : {}),
        ...(data.maxSmsPerMonth !== undefined ? { maxSmsPerMonth: data.maxSmsPerMonth != null ? Number(data.maxSmsPerMonth) : null } : {}),
        ...(data.features ? { features: data.features } : {}),
        ...(data.trialDays != null ? { trialDays: Number(data.trialDays) } : {}),
        ...(data.sortOrder != null ? { sortOrder: Number(data.sortOrder) } : {}),
        ...(data.isActive != null ? { isActive: Boolean(data.isActive) } : {}),
        ...(data.isPublic != null ? { isPublic: Boolean(data.isPublic) } : {}),
        ...(data.tier ? { tier: data.tier } : {}),
      })
      .where(eq(plans.id, data.id))
      .returning();
    return { ok: true, plan: row };
  }

  const code = data.code || slugify(data.name || 'plan') || `plan-${Date.now().toString(36)}`;

  const [row] = await db
    .insert(plans)
    .values({
      code,
      name: data.name,
      description: data.description || null,
      longDescription: data.longDescription || null,
      priceMonthly: Number(data.priceMonthly || 0),
      price3Months: data.price3Months != null ? Number(data.price3Months) : null,
      priceYearly: data.priceYearly != null ? Number(data.priceYearly) : null,
      maxStaff: Number(data.maxStaff ?? 1),
      maxServices: Number(data.maxServices ?? 10),
      maxBookingsPerMonth: data.maxBookingsPerMonth != null ? Number(data.maxBookingsPerMonth) : null,
      maxSmsPerMonth: data.maxSmsPerMonth != null ? Number(data.maxSmsPerMonth) : null,
      features: data.features || {},
      trialDays: Number(data.trialDays ?? 14),
      sortOrder: Number(data.sortOrder ?? 0),
      isActive: data.isActive !== false,
      isPublic: data.isPublic !== false,
      tier: data.tier || 'base',
    })
    .returning();
  return { ok: true, plan: row };
}

// ─── Subscriptions ──────────────────────────────────────

export async function getActiveSubscription(businessId) {
  const [row] = await db
    .select({
      subscription: subscriptions,
      plan: plans,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(plans.id, subscriptions.planId))
    .where(eq(subscriptions.businessId, businessId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!row) return null;
  return { ...row.subscription, plan: row.plan };
}

export async function startTrial(businessId, planId, visitorId = null) {
  const plan = await getPlanById(planId);
  if (!plan) return { ok: false, error: 'پلن یافت نشد' };

  const trialDays = plan.trialDays || 14;
  const startsAt = new Date();
  const trialEndsAt = new Date(
    startsAt.getTime() + trialDays * 24 * 60 * 60 * 1000,
  );

  const [row] = await db
    .insert(subscriptions)
    .values({
      businessId,
      planId,
      status: 'trial',
      visitorId: visitorId || null,
      startsAt,
      endsAt: trialEndsAt,
      trialEndsAt,
      billingCycle: 'monthly',
    })
    .returning();

  return { ok: true, subscription: row, plan };
}

/**
 * ایجاد فاکتور و لینک پرداخت sandbox برای ارتقا/تمدید
 */
export async function createSubscriptionInvoice({
  businessId,
  planId,
  billingCycle = 'monthly',
  visitorId = null,
}) {
  const plan = await getPlanById(planId);
  if (!plan) return { ok: false, error: 'پلن یافت نشد' };

  const amount =
    billingCycle === 'yearly' && plan.priceYearly != null
      ? plan.priceYearly
      : plan.priceMonthly;

  let sub = await getActiveSubscription(businessId);
  if (!sub || sub.planId !== planId) {
    // new subscription pending payment
    const [created] = await db
      .insert(subscriptions)
      .values({
        businessId,
        planId,
        status: 'past_due',
        visitorId: visitorId || sub?.visitorId || null,
        startsAt: new Date(),
        endsAt: null,
        billingCycle,
      })
      .returning();
    sub = { ...created, plan };
  }

  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  if (billingCycle === 'yearly') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  const authority = `SUB-${Date.now()}-${businessId.slice(0, 8)}`;
  const [invoice] = await db
    .insert(subscriptionInvoices)
    .values({
      subscriptionId: sub.id,
      businessId,
      amount,
      status: 'pending',
      gatewayRef: authority,
      periodStart,
      periodEnd,
      note: `اشتراک ${plan.name} (${billingCycle})`,
    })
    .returning();

  return {
    ok: true,
    invoice,
    plan,
    subscription: sub,
    amount,
    authority,
  };
}

/**
 * تأیید پرداخت اشتراک (sandbox callback)
 */
export async function markInvoicePaid(invoiceId, { gatewayRef } = {}) {
  const [invoice] = await db
    .select()
    .from(subscriptionInvoices)
    .where(eq(subscriptionInvoices.id, invoiceId))
    .limit(1);

  if (!invoice) return { ok: false, error: 'فاکتور یافت نشد' };
  if (invoice.status === 'paid') {
    return { ok: true, invoice, alreadyPaid: true };
  }

  const [updated] = await db
    .update(subscriptionInvoices)
    .set({
      status: 'paid',
      paidAt: new Date(),
      gatewayRef: gatewayRef || invoice.gatewayRef,
    })
    .where(eq(subscriptionInvoices.id, invoiceId))
    .returning();

  // activate subscription
  const [sub] = await db
    .update(subscriptions)
    .set({
      status: 'active',
      startsAt: invoice.periodStart || new Date(),
      endsAt: invoice.periodEnd,
      trialEndsAt: null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, invoice.subscriptionId))
    .returning();

  // commission for visitor
  if (sub?.visitorId && invoice.amount > 0) {
    await createVisitorCommission({
      visitorId: sub.visitorId,
      businessId: invoice.businessId,
      invoiceId: invoice.id,
      invoiceAmount: invoice.amount,
    });
  }

  return { ok: true, invoice: updated, subscription: sub };
}

export async function listBusinessInvoices(businessId) {
  return db
    .select()
    .from(subscriptionInvoices)
    .where(eq(subscriptionInvoices.businessId, businessId))
    .orderBy(desc(subscriptionInvoices.createdAt))
    .limit(50);
}

// ─── Visitor ────────────────────────────────────────────

export async function getVisitorByUserId(userId) {
  const [row] = await db
    .select()
    .from(visitors)
    .where(eq(visitors.userId, userId))
    .limit(1);
  return row || null;
}

export async function getVisitorBySlug(slug) {
  const [row] = await db
    .select({
      visitor: visitors,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
    })
    .from(visitors)
    .innerJoin(users, eq(users.id, visitors.userId))
    .where(and(eq(visitors.slug, slug), eq(visitors.isActive, true)))
    .limit(1);
  if (!row) return null;
  return {
    ...row.visitor,
    name: [row.firstName, row.lastName].filter(Boolean).join(' ') || 'ویزیتور',
    phone: row.phone,
  };
}

export async function getVisitorByReferralCode(code) {
  if (!code) return null;
  const [row] = await db
    .select()
    .from(visitors)
    .where(
      and(
        eq(visitors.referralCode, String(code).toUpperCase()),
        eq(visitors.isActive, true),
      ),
    )
    .limit(1);
  return row || null;
}

export async function ensureVisitorProfile(userId, data = {}) {
  const existing = await getVisitorByUserId(userId);
  if (existing) return { ok: true, visitor: existing };

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return { ok: false, error: 'کاربر یافت نشد' };

  let slug =
    slugify(data.slug || `${user.firstName || ''}-${user.lastName || ''}`) ||
    `v-${user.phone.slice(-4)}`;
  const clash = await getVisitorBySlug(slug);
  if (clash) slug = `${slug}-${Date.now().toString(36).slice(-3)}`;

  const referralCode =
    data.referralCode ||
    Math.random().toString(36).slice(2, 8).toUpperCase();

  const [row] = await db
    .insert(visitors)
    .values({
      userId,
      slug,
      referralCode,
      bio: data.bio || null,
      commissionPercent: Number(data.commissionPercent ?? 20),
    })
    .returning();

  // ensure role
  if (user.role !== 'visitor' && user.role !== 'super_admin') {
    await db
      .update(users)
      .set({ role: 'visitor', updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  return { ok: true, visitor: row };
}

export async function updateVisitorProfile(userId, data) {
  const v = await getVisitorByUserId(userId);
  if (!v) return { ok: false, error: 'پروفایل ویزیتور یافت نشد' };

  const patch = {};
  if (data.bio !== undefined) patch.bio = data.bio;
  if (data.slug) {
    const s = slugify(data.slug);
    if (s) {
      const clash = await getVisitorBySlug(s);
      if (clash && clash.id !== v.id) {
        return { ok: false, error: 'این اسلاگ گرفته شده' };
      }
      patch.slug = s;
    }
  }

  const [row] = await db
    .update(visitors)
    .set(patch)
    .where(eq(visitors.id, v.id))
    .returning();
  return { ok: true, visitor: row };
}

export async function listVisitorBusinesses(visitorId) {
  const subs = await db
    .select({
      subscriptionId: subscriptions.id,
      status: subscriptions.status,
      startsAt: subscriptions.startsAt,
      endsAt: subscriptions.endsAt,
      businessId: businesses.id,
      businessName: businesses.name,
      businessSlug: businesses.slug,
      planName: plans.name,
      planCode: plans.code,
    })
    .from(subscriptions)
    .innerJoin(businesses, eq(businesses.id, subscriptions.businessId))
    .innerJoin(plans, eq(plans.id, subscriptions.planId))
    .where(eq(subscriptions.visitorId, visitorId))
    .orderBy(desc(subscriptions.createdAt));

  return subs;
}

export async function listVisitorCommissions(visitorId) {
  return db
    .select({
      id: visitorCommissions.id,
      amount: visitorCommissions.amount,
      percent: visitorCommissions.percent,
      status: visitorCommissions.status,
      createdAt: visitorCommissions.createdAt,
      businessName: businesses.name,
      businessSlug: businesses.slug,
    })
    .from(visitorCommissions)
    .leftJoin(businesses, eq(businesses.id, visitorCommissions.businessId))
    .where(eq(visitorCommissions.visitorId, visitorId))
    .orderBy(desc(visitorCommissions.createdAt));
}

export async function getVisitorStats(visitorId) {
  const businessesList = await listVisitorBusinesses(visitorId);
  const commissions = await listVisitorCommissions(visitorId);
  const totalCommission = commissions.reduce((s, c) => s + (c.amount || 0), 0);
  const pendingCommission = commissions
    .filter((c) => c.status === 'pending')
    .reduce((s, c) => s + (c.amount || 0), 0);
  const paidCommission = commissions
    .filter((c) => c.status === 'paid' || c.status === 'approved')
    .reduce((s, c) => s + (c.amount || 0), 0);

  return {
    businessCount: businessesList.length,
    activeBusinesses: businessesList.filter((b) =>
      ['trial', 'active'].includes(b.status),
    ).length,
    totalCommission,
    pendingCommission,
    paidCommission,
    commissions,
    businesses: businessesList,
  };
}

async function createVisitorCommission({
  visitorId,
  businessId,
  invoiceId,
  invoiceAmount,
}) {
  const [v] = await db
    .select()
    .from(visitors)
    .where(eq(visitors.id, visitorId))
    .limit(1);
  if (!v) return;

  const percent = v.commissionPercent || 20;
  const amount = Math.round((invoiceAmount * percent) / 100);
  if (amount <= 0) return;

  await db.insert(visitorCommissions).values({
    visitorId,
    businessId,
    invoiceId,
    amount,
    percent,
    status: 'pending',
    note: `کمیسیون ${percent}٪ از فاکتور اشتراک`,
  });
}

// ─── Super Admin ────────────────────────────────────────

export async function getPlatformOverview() {
  const [bizCount] = await db.select({ c: sql`count(*)::int` }).from(businesses);
  const [userCount] = await db.select({ c: sql`count(*)::int` }).from(users);
  const [visitorCount] = await db.select({ c: sql`count(*)::int` }).from(visitors);
  const [bookingCount] = await db.select({ c: sql`count(*)::int` }).from(bookings);
  const [activeSubs] = await db.select({ c: sql`count(*)::int` }).from(subscriptions).where(sql`${subscriptions.status} in ('trial','active')`);
  const [rev] = await db.select({ total: sql`coalesce(sum(${subscriptionInvoices.amount}),0)::int` }).from(subscriptionInvoices).where(eq(subscriptionInvoices.status, 'paid'));

  // SMS counts - new
  let smsCount = 0;
  try {
    const { smsLogs } = await import('@/db/schema/saas');
    const [sms] = await db.select({ c: sql`count(*)::int` }).from(smsLogs);
    smsCount = sms?.c || 0;
  } catch {}

  const recentBusinesses = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      city: businesses.city,
      isActive: businesses.isActive,
      createdAt: businesses.createdAt,
      ownerPhone: users.phone,
      ownerName: sql`trim(coalesce(${users.firstName},'') || ' ' || coalesce(${users.lastName},''))`,
    })
    .from(businesses)
    .leftJoin(users, eq(users.id, businesses.ownerId))
    .orderBy(desc(businesses.createdAt))
    .limit(10);

  // enrich with sms per business
  let enriched = recentBusinesses;
  try {
    const { smsLogs } = await import('@/db/schema/saas');
    enriched = await Promise.all(recentBusinesses.map(async (b) => {
      try {
        const [s] = await db.select({ c: sql`count(*)::int` }).from(smsLogs).where(eq(smsLogs.businessId, b.id));
        return { ...b, smsCount: s?.c || 0 };
      } catch { return b; }
    }));
  } catch {}

  return {
    counts: { businesses: bizCount?.c || 0, users: userCount?.c || 0, visitors: visitorCount?.c || 0, bookings: bookingCount?.c || 0, activeSubscriptions: activeSubs?.c || 0, smsLogs: smsCount },
    subscriptionRevenue: rev?.total || 0,
    smsCount,
    recentBusinesses: enriched,
  };
}

export async function adminListBusinesses() {
  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      city: businesses.city,
      phone: businesses.phone,
      isActive: businesses.isActive,
      createdAt: businesses.createdAt,
      ownerPhone: users.phone,
      ownerFirstName: users.firstName,
      ownerLastName: users.lastName,
    })
    .from(businesses)
    .leftJoin(users, eq(users.id, businesses.ownerId))
    .orderBy(desc(businesses.createdAt))
    .limit(100);

  const result = [];
  for (const r of rows) {
    const sub = await getActiveSubscription(r.id);
    result.push({
      ...r,
      ownerName: [r.ownerFirstName, r.ownerLastName]
        .filter(Boolean)
        .join(' '),
      subscription: sub
        ? {
            status: sub.status,
            planName: sub.plan?.name,
            endsAt: sub.endsAt,
          }
        : null,
    });
  }
  return result;
}

export async function adminListUsers() {
  return db
    .select({
      id: users.id,
      phone: users.phone,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      isActive: users.isActive,
      isPhoneVerified: users.isPhoneVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(200);
}

export async function adminUpdateUser(userId, data) {
  const [row] = await db
    .update(users)
    .set({
      ...(data.role
        ? {
            role: data.role,
          }
        : {}),
      ...(data.isActive != null ? { isActive: Boolean(data.isActive) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
  return row || null;
}

export async function adminToggleBusiness(businessId, isActive) {
  const [row] = await db
    .update(businesses)
    .set({ isActive: Boolean(isActive), updatedAt: new Date() })
    .where(eq(businesses.id, businessId))
    .returning();
  return row || null;
}

export async function adminListVisitors() {
  const rows = await db
    .select({
      id: visitors.id,
      slug: visitors.slug,
      referralCode: visitors.referralCode,
      commissionPercent: visitors.commissionPercent,
      isActive: visitors.isActive,
      createdAt: visitors.createdAt,
      phone: users.phone,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(visitors)
    .innerJoin(users, eq(users.id, visitors.userId))
    .orderBy(desc(visitors.createdAt));

  const result = [];
  for (const r of rows) {
    const stats = await getVisitorStats(r.id);
    result.push({
      ...r,
      name: [r.firstName, r.lastName].filter(Boolean).join(' '),
      businessCount: stats.businessCount,
      totalCommission: stats.totalCommission,
    });
  }
  return result;
}

export async function adminApproveCommission(id, status = 'approved') {
  const [row] = await db
    .update(visitorCommissions)
    .set({ status })
    .where(eq(visitorCommissions.id, id))
    .returning();
  return row || null;
}

// ─── Seed defaults ──────────────────────────────────────

export async function seedDefaultPlans() {
  const existing = await listAllPlans();
  if (existing.length > 0) return existing;

  // Task 8: base, pro, enterprise - 1m, 3m, 12m
  const defaults = [
    {
      code: 'base',
      name: 'پلن پایه',
      tier: 'base',
      description: 'شروع هوشمند برای کسب‌وکارهای کوچک',
      longDescription: 'شامل ۲ کارمند، ۲۰۰ پیامک در ماه، رزرو نامحدود، و گزارش پایه. مناسب سالن‌های تازه‌تاسیس.',
      priceMonthly: 290000,
      price3Months: 790000,
      priceYearly: 2900000,
      maxStaff: 2,
      maxServices: 10,
      maxBookingsPerMonth: null,
      maxSmsPerMonth: 200,
      trialDays: 14,
      sortOrder: 1,
      features: {
        crm: true,
        loyalty: false,
        reports: true,
        customTheme: false,
        cardToCard: true,
        gateway: true,
        smsReminders: true,
        expenses: false,
        qrCode: true,
        advancedCharts: false,
      },
    },
    {
      code: 'pro',
      name: 'پلن حرفه‌ای',
      tier: 'pro',
      description: 'محبوب‌ترین — CRM، باشگاه، گزارش پیشرفته',
      longDescription: '۵ کارمند، ۱۰۰۰ پیامک، باشگاه مشتریان، CRM کامل، حسابداری کوچک و نمودارهای حرفه‌ای. مناسب کلینیک و سالن‌های فعال.',
      priceMonthly: 590000,
      price3Months: 1590000,
      priceYearly: 5900000,
      maxStaff: 5,
      maxServices: 50,
      maxBookingsPerMonth: null,
      maxSmsPerMonth: 1000,
      trialDays: 14,
      sortOrder: 2,
      features: {
        crm: true,
        loyalty: true,
        reports: true,
        customTheme: true,
        cardToCard: true,
        gateway: true,
        smsReminders: true,
        expenses: true,
        qrCode: true,
        advancedCharts: true,
      },
    },
    {
      code: 'enterprise',
      name: 'پلن سازمانی',
      tier: 'enterprise',
      description: 'نامحدود + پشتیبانی اختصاصی + دامنه اختصاصی',
      longDescription: '۲۰ کارمند، ۵۰۰۰ پیامک، دامنه اختصاصی، API دسترسی، گزارشات پیشرفته و اولویت پشتیبانی. برای مجموعه‌های بزرگ.',
      priceMonthly: 1290000,
      price3Months: 3490000,
      priceYearly: 12900000,
      maxStaff: 20,
      maxServices: 500,
      maxBookingsPerMonth: null,
      maxSmsPerMonth: 5000,
      trialDays: 14,
      sortOrder: 3,
      features: {
        crm: true,
        loyalty: true,
        reports: true,
        customTheme: true,
        cardToCard: true,
        gateway: true,
        smsReminders: true,
        customDomain: true,
        expenses: true,
        qrCode: true,
        advancedCharts: true,
      },
    },
  ];

  const created = [];
  for (const p of defaults) {
    const r = await upsertPlan(p);
    created.push(r.plan);
  }
  return created;
}

/**
 * بعد از ساخت بیزنس — trial روی پلن base + لینک ویزیتور
 */
export async function provisionBusinessSubscription(businessId, referralCode = null) {
  await seedDefaultPlans();
  let plan = await getPlanByCode('base');
  if (!plan) plan = await getPlanByCode('starter'); // backward compat
  if (!plan) {
    const all = await listAllPlans();
    plan = all[0];
  }
  if (!plan) return { ok: false, error: 'پلن یافت نشد' };

  let visitorId = null;
  if (referralCode) {
    const v = await getVisitorByReferralCode(referralCode);
    if (v) visitorId = v.id;
  }
  return startTrial(businessId, plan.id, visitorId);
}
