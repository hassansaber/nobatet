/**
 * Seed داده دمو برای توسعه
 * اجرا: node --env-file=.env scripts/seed.js
 * یا: npm run db:seed
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import {
  users,
  businesses,
  businessMembers,
  services,
  workingHours,
  staffServices,
} from '../src/db/schema/index.js';
import { eq } from 'drizzle-orm';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const client = postgres(url, { max: 1 });
const db = drizzle(client);

async function main() {
  console.log('Seeding nobatet...');

  const passwordHash = await bcrypt.hash('123456', 10);

  // Owner
  let [owner] = await db
    .select()
    .from(users)
    .where(eq(users.phone, '09120000001'))
    .limit(1);

  if (!owner) {
    [owner] = await db
      .insert(users)
      .values({
        phone: '09120000001',
        firstName: 'مریم',
        lastName: 'احمدی',
        passwordHash,
        role: 'business_owner',
        isPhoneVerified: true,
      })
      .returning();
    console.log('owner:', owner.phone);
  }

  // Staff user
  let [staffUser] = await db
    .select()
    .from(users)
    .where(eq(users.phone, '09120000002'))
    .limit(1);

  if (!staffUser) {
    [staffUser] = await db
      .insert(users)
      .values({
        phone: '09120000002',
        firstName: 'سارا',
        lastName: 'محمدی',
        passwordHash,
        role: 'staff',
        isPhoneVerified: true,
      })
      .returning();
    console.log('staff:', staffUser.phone);
  }

  // Customer
  let [customer] = await db
    .select()
    .from(users)
    .where(eq(users.phone, '09120000003'))
    .limit(1);

  if (!customer) {
    [customer] = await db
      .insert(users)
      .values({
        phone: '09120000003',
        firstName: 'علی',
        lastName: 'رضایی',
        passwordHash,
        role: 'customer',
        isPhoneVerified: true,
      })
      .returning();
    console.log('customer:', customer.phone);
  }

  // Business
  let [biz] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.slug, 'demo'))
    .limit(1);

  if (!biz) {
    [biz] = await db
      .insert(businesses)
      .values({
        ownerId: owner.id,
        name: 'سالن زیبایی گل‌نرگس',
        slug: 'demo',
        description:
          'ارائه‌دهنده خدمات آرایشی و زیبایی با کادری مجرب. رزرو آنلاین نوبت در کمتر از یک دقیقه.',
        phone: '02191000000',
        city: 'تهران',
        address: 'خیابان ولیعصر، پلاک ۱۰۰',
        theme: { primary: '#0d9488', secondary: '#0f766e', accent: '#f59e0b' },
        landingFeatures: {
          gallery: true,
          reviews: true,
          about: true,
          services: true,
        },
        cancellationPolicy:
          'لغو تا ۲۴ ساعت قبل از نوبت رایگان است. پس از آن بیعانه قابل بازگشت نیست.',
        depositPercent: 100,
        cardNumber: '6037-9977-1234-5678',
        cardHolderName: 'مریم احمدی',
      })
      .returning();
    console.log('business:', biz.slug);
  }

  // Members
  let [ownerMember] = await db
    .select()
    .from(businessMembers)
    .where(eq(businessMembers.userId, owner.id))
    .limit(1);

  if (!ownerMember) {
    [ownerMember] = await db
      .insert(businessMembers)
      .values({
        businessId: biz.id,
        userId: owner.id,
        role: 'owner',
        jobTitle: 'مدیر سالن',
      })
      .returning();
  }

  let [staffMember] = await db
    .select()
    .from(businessMembers)
    .where(eq(businessMembers.userId, staffUser.id))
    .limit(1);

  if (!staffMember) {
    [staffMember] = await db
      .insert(businessMembers)
      .values({
        businessId: biz.id,
        userId: staffUser.id,
        role: 'staff',
        jobTitle: 'آرایشگر',
      })
      .returning();
  }

  // Services
  const existingServices = await db
    .select()
    .from(services)
    .where(eq(services.businessId, biz.id));

  let serviceList = existingServices;
  if (existingServices.length === 0) {
    serviceList = await db
      .insert(services)
      .values([
        {
          businessId: biz.id,
          name: 'کوتاهی مو',
          description: 'کوتاهی تخصصی مطابق مدل روز',
          durationMinutes: 45,
          bufferMinutes: 15,
          price: 450000,
          type: 'individual',
          sortOrder: 1,
        },
        {
          businessId: biz.id,
          name: 'رنگ و مش',
          description: 'رنگ کامل یا مش حرفه‌ای',
          durationMinutes: 120,
          bufferMinutes: 20,
          price: 1800000,
          type: 'individual',
          sortOrder: 2,
        },
        {
          businessId: biz.id,
          name: 'مانیکور',
          description: 'مانیکور کلاسیک',
          durationMinutes: 40,
          bufferMinutes: 10,
          price: 350000,
          type: 'individual',
          sortOrder: 3,
        },
      ])
      .returning();
    console.log('services:', serviceList.length);
  }

  // staff_services — هر دو عضو همه خدمات
  for (const svc of serviceList) {
    for (const mem of [ownerMember, staffMember]) {
      try {
        await db.insert(staffServices).values({
          memberId: mem.id,
          serviceId: svc.id,
        });
      } catch {
        // unique conflict ok
      }
    }
  }

  // Working hours: شنبه تا پنج‌شنبه 09:00-18:00 ، جمعه تعطیل
  const existingHours = await db
    .select()
    .from(workingHours)
    .where(eq(workingHours.businessId, biz.id));

  if (existingHours.length === 0) {
    const hours = [];
    for (let day = 0; day <= 5; day++) {
      // 0=شنبه ... 5=پنج‌شنبه
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
      dayOfWeek: 6, // جمعه
      startTime: '00:00',
      endTime: '00:00',
      isOff: true,
    });
    await db.insert(workingHours).values(hours);
    console.log('working hours seeded');
  }

  // Super admin
  let [admin] = await db
    .select()
    .from(users)
    .where(eq(users.phone, '09120000000'))
    .limit(1);
  if (!admin) {
    [admin] = await db
      .insert(users)
      .values({
        phone: '09120000000',
        firstName: 'سوپر',
        lastName: 'ادمین',
        passwordHash,
        role: 'super_admin',
        isPhoneVerified: true,
      })
      .returning();
    console.log('super_admin:', admin.phone);
  }

  // Visitor
  let [visitorUser] = await db
    .select()
    .from(users)
    .where(eq(users.phone, '09120000004'))
    .limit(1);
  if (!visitorUser) {
    [visitorUser] = await db
      .insert(users)
      .values({
        phone: '09120000004',
        firstName: 'رضا',
        lastName: 'بازاریاب',
        passwordHash,
        role: 'visitor',
        isPhoneVerified: true,
      })
      .returning();
    console.log('visitor:', visitorUser.phone);
  }

  // visitor profile via raw insert (avoid path alias)
  const { visitors } = await import('../src/db/schema/businesses.js');
  let [vis] = await db
    .select()
    .from(visitors)
    .where(eq(visitors.userId, visitorUser.id))
    .limit(1);
  if (!vis) {
    [vis] = await db
      .insert(visitors)
      .values({
        userId: visitorUser.id,
        slug: 'reza-visitor',
        referralCode: 'REZA20',
        bio: 'مشاور راه‌اندازی نوبت‌دهی آنلاین برای کسب‌وکارهای زیبایی و سلامت',
        commissionPercent: 20,
      })
      .returning();
    console.log('visitor profile:', vis.slug, vis.referralCode);
  }

  // SaaS plans + demo subscription (inline — no path alias)
  const { plans, subscriptions } = await import('../src/db/schema/saas.js');
  let planRows = await db.select().from(plans);
  if (planRows.length === 0) {
    planRows = await db
      .insert(plans)
      .values([
        {
          code: 'starter',
          name: 'شروع',
          description: '۱۴ روز آزمایشی',
          priceMonthly: 0,
          maxStaff: 1,
          maxServices: 5,
          maxBookingsPerMonth: 50,
          trialDays: 14,
          sortOrder: 1,
          features: { crm: false, loyalty: false, reports: false },
        },
        {
          code: 'pro',
          name: 'حرفه‌ای',
          description: 'مناسب سالن در حال رشد',
          priceMonthly: 490000,
          priceYearly: 4900000,
          maxStaff: 5,
          maxServices: 50,
          trialDays: 14,
          sortOrder: 2,
          features: { crm: true, loyalty: true, reports: true, customTheme: true },
        },
        {
          code: 'business',
          name: 'سازمانی',
          description: 'نامحدود',
          priceMonthly: 990000,
          priceYearly: 9900000,
          maxStaff: 100,
          maxServices: 500,
          trialDays: 14,
          sortOrder: 3,
          features: { crm: true, loyalty: true, reports: true, customDomain: true },
        },
      ])
      .returning();
    console.log('plans seeded', planRows.length);
  }
  const pro = planRows.find((p) => p.code === 'pro') || planRows[0];
  const existingSub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.businessId, biz.id))
    .limit(1);
  if (!existingSub[0]) {
    const startsAt = new Date();
    const trialEndsAt = new Date(startsAt.getTime() + 14 * 86400000);
    await db.insert(subscriptions).values({
      businessId: biz.id,
      planId: pro.id,
      status: 'trial',
      visitorId: vis.id,
      startsAt,
      endsAt: trialEndsAt,
      trialEndsAt,
      billingCycle: 'monthly',
    });
    console.log('demo subscription trial linked to visitor');
  }

  console.log('\n✅ Seed complete');
  console.log('─────────────────────────────────');
  console.log('Super Admin:    09120000000 / 123456');
  console.log('Owner login:    09120000001 / 123456');
  console.log('Staff login:    09120000002 / 123456');
  console.log('Customer login: 09120000003 / 123456');
  console.log('Visitor login:  09120000004 / 123456');
  console.log('Business slug:  demo');
  console.log('Visitor slug:   reza-visitor  (code REZA20)');
  console.log('Tenant URL:     demo.business.localhost:3001 (prod: {slug}.business.nobatet.com)');
  console.log('─────────────────────────────────');

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
