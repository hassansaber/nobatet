import { and, asc, desc, eq, gte, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { businesses, businessMembers } from '@/db/schema/businesses';
import {
  services,
  staffServices,
  workingHours,
  timeOffs,
} from '@/db/schema/services';
import { users } from '@/db/schema/users';
import { bookings } from '@/db/schema/bookings';
import { hashPassword } from '@/lib/auth';
import { normalizeIranPhone, slugify } from '@/lib/utils';

export async function getBusinessBySlug(slug) {
  const [biz] = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.slug, slug), eq(businesses.isActive, true)))
    .limit(1);
  return biz || null;
}

export async function getBusinessById(id) {
  const [biz] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, id))
    .limit(1);
  return biz || null;
}

export async function getPublicBusinessLanding(slug) {
  const biz = await getBusinessBySlug(slug);
  if (!biz) return null;

  const serviceList = await db
    .select({
      id: services.id,
      name: services.name,
      description: services.description,
      durationMinutes: services.durationMinutes,
      bufferMinutes: services.bufferMinutes,
      price: services.price,
      type: services.type,
      capacity: services.capacity,
    })
    .from(services)
    .where(and(eq(services.businessId, biz.id), eq(services.isActive, true)))
    .orderBy(asc(services.sortOrder));

  const members = await db
    .select({
      id: businessMembers.id,
      role: businessMembers.role,
      jobTitle: businessMembers.jobTitle,
      avatarUrl: businessMembers.avatarUrl,
      firstName: users.firstName,
      lastName: users.lastName,
      userAvatarUrl: users.avatarUrl,
    })
    .from(businessMembers)
    .innerJoin(users, eq(users.id, businessMembers.userId))
    .where(
      and(
        eq(businessMembers.businessId, biz.id),
        eq(businessMembers.isActive, true),
      ),
    );

  return {
    id: biz.id,
    name: biz.name,
    slug: biz.slug,
    description: biz.description,
    logoUrl: biz.logoUrl,
    bannerUrl: biz.bannerUrl,
    galleryUrls: biz.galleryUrls || [],
    latitude: biz.latitude || null,
    longitude: biz.longitude || null,
    phone: biz.phone,
    address: biz.address,
    city: biz.city,
    theme: biz.theme,
    landingFeatures: biz.landingFeatures,
    cancellationPolicy: biz.cancellationPolicy,
    depositPercent: biz.depositPercent,
    cardNumber: biz.cardNumber,
    cardHolderName: biz.cardHolderName,
    services: serviceList,
    staff: members.map((m) => ({
      id: m.id,
      name: [m.firstName, m.lastName].filter(Boolean).join(' ') || 'کارمند',
      jobTitle: m.jobTitle,
      role: m.role,
      avatarUrl: m.avatarUrl || m.userAvatarUrl || null,
    })),
  };
}

export async function createBusiness({
  ownerId,
  name,
  slug: rawSlug,
  description,
  phone,
  city,
  referralCode = null,
}) {
  let slug = slugify(rawSlug || name);
  if (!slug) slug = `biz-${Date.now().toString(36)}`;

  const existing = await getBusinessBySlug(slug);
  if (existing) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const [biz] = await db
    .insert(businesses)
    .values({
      ownerId,
      name,
      slug,
      description: description || null,
      phone: phone || null,
      city: city || null,
      referralCode: referralCode || null,
      cancellationPolicy:
        'لغو تا ۲۴ ساعت قبل از نوبت رایگان است. پس از آن بیعانه قابل بازگشت نیست.',
    })
    .returning();

  await db.insert(businessMembers).values({
    businessId: biz.id,
    userId: ownerId,
    role: 'owner',
    jobTitle: 'مدیر',
  });

  const hours = [];
  for (let day = 0; day <= 5; day++) {
    hours.push({
      businessId: biz.id,
      memberId: null,
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '18:00',
      isOff: false,
    });
  }
  hours.push({
    businessId: biz.id,
    memberId: null,
    dayOfWeek: 6,
    startTime: '00:00',
    endTime: '00:00',
    isOff: true,
  });
  await db.insert(workingHours).values(hours);

  // trial subscription + visitor link
  let subscription = null;
  try {
    const { provisionBusinessSubscription } = await import(
      '@/services/saas-service'
    );
    const prov = await provisionBusinessSubscription(biz.id, referralCode);
    subscription = prov.subscription || null;
  } catch (e) {
    console.warn('[createBusiness] provision sub', e?.message);
  }

  return { ok: true, business: biz, subscription };
}

export async function getBusinessesForUser(userId) {
  return db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      role: businessMembers.role,
      memberId: businessMembers.id,
      isActive: businesses.isActive,
    })
    .from(businessMembers)
    .innerJoin(businesses, eq(businesses.id, businessMembers.businessId))
    .where(
      and(
        eq(businessMembers.userId, userId),
        eq(businessMembers.isActive, true),
      ),
    );
}

export async function assertBusinessAccess(businessId, userId, roles = null) {
  const [row] = await db
    .select()
    .from(businessMembers)
    .where(
      and(
        eq(businessMembers.businessId, businessId),
        eq(businessMembers.userId, userId),
        eq(businessMembers.isActive, true),
      ),
    )
    .limit(1);

  if (!row) return null;
  if (roles && !roles.includes(row.role)) return null;
  return row;
}

/** resolve businessId for current user (first membership) */
export async function resolveBusinessId(userId, preferredId) {
  if (preferredId) return preferredId;
  const list = await getBusinessesForUser(userId);
  return list[0]?.id || null;
}

// ─── Services ───────────────────────────────────────────

export async function listServices(businessId) {
  return db
    .select()
    .from(services)
    .where(eq(services.businessId, businessId))
    .orderBy(asc(services.sortOrder));
}

export async function createService(businessId, data) {
  const [row] = await db
    .insert(services)
    .values({
      businessId,
      name: data.name,
      description: data.description || null,
      durationMinutes: Number(data.durationMinutes),
      bufferMinutes: Number(data.bufferMinutes || 0),
      price: Number(data.price || 0),
      type: data.type === 'capacity' ? 'capacity' : 'individual',
      capacity: Number(data.capacity || 1),
      sortOrder: Number(data.sortOrder || 0),
    })
    .returning();
  return row;
}

export async function updateService(serviceId, businessId, data) {
  const [row] = await db
    .update(services)
    .set({
      ...(data.name != null ? { name: data.name } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.durationMinutes != null
        ? { durationMinutes: Number(data.durationMinutes) }
        : {}),
      ...(data.bufferMinutes != null
        ? { bufferMinutes: Number(data.bufferMinutes) }
        : {}),
      ...(data.price != null ? { price: Number(data.price) } : {}),
      ...(data.type != null
        ? { type: data.type === 'capacity' ? 'capacity' : 'individual' }
        : {}),
      ...(data.capacity != null ? { capacity: Number(data.capacity) } : {}),
      ...(data.isActive != null ? { isActive: Boolean(data.isActive) } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)))
    .returning();
  return row || null;
}

// ─── Staff ──────────────────────────────────────────────

export async function listStaff(businessId) {
  const rows = await db
    .select({
      id: businessMembers.id,
      userId: businessMembers.userId,
      role: businessMembers.role,
      jobTitle: businessMembers.jobTitle,
      avatarUrl: businessMembers.avatarUrl,
      isActive: businessMembers.isActive,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      userAvatarUrl: users.avatarUrl,
    })
    .from(businessMembers)
    .innerJoin(users, eq(users.id, businessMembers.userId))
    .where(eq(businessMembers.businessId, businessId));

  // attach service ids
  const result = [];
  for (const r of rows) {
    const links = await db
      .select({ serviceId: staffServices.serviceId })
      .from(staffServices)
      .where(eq(staffServices.memberId, r.id));
    result.push({
      ...r,
      serviceIds: links.map((l) => l.serviceId),
    });
  }
  return result;
}

/**
 * افزودن کارمند با شماره موبایل — اگر کاربر نباشد ساخته می‌شود
 */
export async function addStaffMember(businessId, data) {
  const phone = normalizeIranPhone(data.phone);
  if (!phone) return { ok: false, error: 'شماره موبایل معتبر نیست' };

  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);

  if (!user) {
    const passwordHash = await hashPassword(data.password || '123456');
    [user] = await db
      .insert(users)
      .values({
        phone,
        firstName: data.firstName || 'کارمند',
        lastName: data.lastName || '',
        passwordHash,
        role: 'staff',
        isPhoneVerified: true,
      })
      .returning();
  } else if (data.firstName || data.lastName) {
    await db
      .update(users)
      .set({
        ...(data.firstName ? { firstName: data.firstName } : {}),
        ...(data.lastName ? { lastName: data.lastName } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  }

  const existing = await db
    .select()
    .from(businessMembers)
    .where(
      and(
        eq(businessMembers.businessId, businessId),
        eq(businessMembers.userId, user.id),
      ),
    )
    .limit(1);

  if (existing[0]) {
    if (!existing[0].isActive) {
      const [reactivated] = await db
        .update(businessMembers)
        .set({
          isActive: true,
          role: data.role === 'manager' ? 'manager' : 'staff',
          jobTitle: data.jobTitle || existing[0].jobTitle,
        })
        .where(eq(businessMembers.id, existing[0].id))
        .returning();
      return { ok: true, member: reactivated, user };
    }
    return { ok: false, error: 'این شماره قبلاً در تیم است' };
  }

  const [member] = await db
    .insert(businessMembers)
    .values({
      businessId,
      userId: user.id,
      role: data.role === 'manager' ? 'manager' : 'staff',
      jobTitle: data.jobTitle || null,
    })
    .returning();

  // link all active services by default
  if (data.serviceIds?.length) {
    for (const sid of data.serviceIds) {
      await linkStaffService(member.id, sid);
    }
  } else {
    const all = await listServices(businessId);
    for (const s of all.filter((x) => x.isActive)) {
      await linkStaffService(member.id, s.id);
    }
  }

  return { ok: true, member, user };
}

export async function updateStaffMember(memberId, businessId, data) {
  const [row] = await db
    .update(businessMembers)
    .set({
      ...(data.jobTitle !== undefined ? { jobTitle: data.jobTitle } : {}),
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      ...(data.role && ['staff', 'manager'].includes(data.role)
        ? { role: data.role }
        : {}),
      ...(data.isActive != null ? { isActive: Boolean(data.isActive) } : {}),
    })
    .where(
      and(
        eq(businessMembers.id, memberId),
        eq(businessMembers.businessId, businessId),
      ),
    )
    .returning();

  if (!row) return null;

  if (Array.isArray(data.serviceIds)) {
    // replace links
    await db
      .delete(staffServices)
      .where(eq(staffServices.memberId, memberId));
    for (const sid of data.serviceIds) {
      await linkStaffService(memberId, sid);
    }
  }

  return row;
}

export async function linkStaffService(memberId, serviceId) {
  try {
    const [row] = await db
      .insert(staffServices)
      .values({ memberId, serviceId })
      .returning();
    return row;
  } catch {
    return null;
  }
}

// ─── Working hours ──────────────────────────────────────

export async function listWorkingHours(businessId, memberId = null) {
  if (memberId) {
    return db
      .select()
      .from(workingHours)
      .where(
        and(
          eq(workingHours.businessId, businessId),
          eq(workingHours.memberId, memberId),
        ),
      )
      .orderBy(asc(workingHours.dayOfWeek));
  }
  return db
    .select()
    .from(workingHours)
    .where(
      and(
        eq(workingHours.businessId, businessId),
        isNull(workingHours.memberId),
      ),
    )
    .orderBy(asc(workingHours.dayOfWeek));
}

/**
 * جایگزینی کامل ساعات یک هفته برای بیزنس یا عضو
 * @param {Array<{ dayOfWeek: number, startTime: string, endTime: string, isOff?: boolean }>} hours
 */
export async function setWorkingHours(businessId, hours, memberId = null) {
  // delete existing
  if (memberId) {
    await db
      .delete(workingHours)
      .where(
        and(
          eq(workingHours.businessId, businessId),
          eq(workingHours.memberId, memberId),
        ),
      );
  } else {
    await db
      .delete(workingHours)
      .where(
        and(
          eq(workingHours.businessId, businessId),
          isNull(workingHours.memberId),
        ),
      );
  }

  if (!hours?.length) return [];

  const values = hours.map((h) => ({
    businessId,
    memberId: memberId || null,
    dayOfWeek: Number(h.dayOfWeek),
    startTime: h.startTime || '09:00',
    endTime: h.endTime || '18:00',
    isOff: Boolean(h.isOff),
  }));

  return db.insert(workingHours).values(values).returning();
}

// ─── Time offs ──────────────────────────────────────────

export async function listTimeOffs(businessId) {
  return db
    .select()
    .from(timeOffs)
    .where(eq(timeOffs.businessId, businessId))
    .orderBy(desc(timeOffs.startAt));
}

export async function createTimeOff(businessId, data) {
  const [row] = await db
    .insert(timeOffs)
    .values({
      businessId,
      memberId: data.memberId || null,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
      reason: data.reason || null,
    })
    .returning();
  return row;
}

export async function deleteTimeOff(id, businessId) {
  const [row] = await db
    .delete(timeOffs)
    .where(and(eq(timeOffs.id, id), eq(timeOffs.businessId, businessId)))
    .returning();
  return row || null;
}

// ─── Settings ───────────────────────────────────────────

export async function updateBusinessSettings(businessId, data) {
  const patch = { updatedAt: new Date() };

  const scalar = [
    'name',
    'description',
    'phone',
    'address',
    'city',
    'logoUrl',
    'bannerUrl',
    'cancellationPolicy',
    'cardNumber',
    'cardHolderName',
    'latitude',
    'longitude',
  ];
  for (const k of scalar) {
    if (data[k] !== undefined) patch[k] = data[k];
  }
  if (data.galleryUrls !== undefined) {
    patch.galleryUrls = Array.isArray(data.galleryUrls) ? data.galleryUrls : [];
  }
  if (data.depositPercent != null) {
    patch.depositPercent = Math.min(100, Math.max(0, Number(data.depositPercent)));
  }
  if (data.theme && typeof data.theme === 'object') {
    patch.theme = data.theme;
  }
  if (data.landingFeatures && typeof data.landingFeatures === 'object') {
    patch.landingFeatures = data.landingFeatures;
  }
  if (data.slug) {
    const s = slugify(data.slug);
    if (s) {
      const clash = await getBusinessBySlug(s);
      if (clash && clash.id !== businessId) {
        return { ok: false, error: 'این اسلاگ قبلاً گرفته شده' };
      }
      patch.slug = s;
    }
  }

  const [row] = await db
    .update(businesses)
    .set(patch)
    .where(eq(businesses.id, businessId))
    .returning();

  return { ok: true, business: row };
}

// ─── Customers (CRM light) ──────────────────────────────

export async function listCustomers(businessId) {
  // aggregation without max(uuid) — postgres rejects max on uuid
  const rows = await db
    .select({
      customerPhone: bookings.customerPhone,
      customerName: bookings.customerName,
      customerId: bookings.customerId,
      status: bookings.status,
      totalAmount: bookings.totalAmount,
      startsAt: bookings.startsAt,
    })
    .from(bookings)
    .where(eq(bookings.businessId, businessId))
    .orderBy(desc(bookings.startsAt));

  /** @type {Map<string, { customerPhone: string, customerName: string, customerId: string | null, visits: number, lastVisit: Date, totalSpent: number }>} */
  const map = new Map();
  for (const r of rows) {
    const key = r.customerPhone;
    const cur = map.get(key);
    const paid = ['confirmed', 'completed'].includes(r.status)
      ? r.totalAmount || 0
      : 0;
    if (!cur) {
      map.set(key, {
        customerPhone: r.customerPhone,
        customerName: r.customerName,
        customerId: r.customerId,
        visits: 1,
        lastVisit: r.startsAt,
        totalSpent: paid,
      });
    } else {
      cur.visits += 1;
      cur.totalSpent += paid;
      if (r.customerName) cur.customerName = r.customerName;
      if (r.customerId) cur.customerId = r.customerId;
    }
  }
  return Array.from(map.values());
}

// ─── Staff / Customer self panels ───────────────────────

export async function getStaffMemberForUser(userId) {
  const [row] = await db
    .select({
      memberId: businessMembers.id,
      businessId: businessMembers.businessId,
      role: businessMembers.role,
      jobTitle: businessMembers.jobTitle,
      businessName: businesses.name,
      businessSlug: businesses.slug,
    })
    .from(businessMembers)
    .innerJoin(businesses, eq(businesses.id, businessMembers.businessId))
    .where(
      and(
        eq(businessMembers.userId, userId),
        eq(businessMembers.isActive, true),
        or(
          eq(businessMembers.role, 'staff'),
          eq(businessMembers.role, 'manager'),
          eq(businessMembers.role, 'owner'),
        ),
      ),
    )
    .limit(1);
  return row || null;
}

export async function listStaffBookings(memberId, { from, to } = {}) {
  const conditions = [eq(bookings.memberId, memberId)];
  if (from) conditions.push(gte(bookings.startsAt, new Date(from)));
  if (to) {
    conditions.push(sql`${bookings.startsAt} <= ${new Date(to)}`);
  }

  return db
    .select({
      id: bookings.id,
      status: bookings.status,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      customerName: bookings.customerName,
      customerPhone: bookings.customerPhone,
      notes: bookings.notes,
      totalAmount: bookings.totalAmount,
      serviceName: services.name,
      serviceId: bookings.serviceId,
    })
    .from(bookings)
    .leftJoin(services, eq(services.id, bookings.serviceId))
    .where(and(...conditions))
    .orderBy(asc(bookings.startsAt))
    .limit(100);
}

export async function listCustomerBookings(userId, phone) {
  const conditions = phone
    ? or(eq(bookings.customerId, userId), eq(bookings.customerPhone, phone))
    : eq(bookings.customerId, userId);

  return db
    .select({
      id: bookings.id,
      status: bookings.status,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      totalAmount: bookings.totalAmount,
      depositAmount: bookings.depositAmount,
      serviceName: services.name,
      businessName: businesses.name,
      businessSlug: businesses.slug,
      businessId: bookings.businessId,
      cancellationPolicy: businesses.cancellationPolicy,
    })
    .from(bookings)
    .leftJoin(services, eq(services.id, bookings.serviceId))
    .leftJoin(businesses, eq(businesses.id, bookings.businessId))
    .where(conditions)
    .orderBy(desc(bookings.startsAt))
    .limit(50);
}
