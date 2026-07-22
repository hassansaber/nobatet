/**
 * Seed واقع‌گرایانه برای نوبتت - 5 کسب‌وکار + 100 کاربر + تاریخچه رزرو متنوع
 * اجرا: node --env-file=.env scripts/seed-realistic.js
 * یا: npm run db:seed:realistic (اضافه کن به package.json)
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import {
  users,
  businesses,
  businessMembers,
  services,
  workingHours,
  staffServices,
  visitors,
} from '../src/db/schema/businesses.js';
import { bookings } from '../src/db/schema/bookings.js';
import { plans, subscriptions } from '../src/db/schema/saas.js';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const client = postgres(url, { max: 1 });
const db = drizzle(client);

const passwordHash = await bcrypt.hash('123456', 10);

const firstNames = ['مریم', 'سارا', 'علی', 'رضا', 'نازنین', 'پریسا', 'محمد', 'حسین', 'زهرا', 'فاطمه', 'امیر', 'نگار', 'بهار', 'آرمان', 'کیان', 'لاله', 'شیدا', 'مهدی', 'سجاد', 'مینا', 'آتنا', 'پگاه', 'نیما', 'سحر', 'یاسمن'];
const lastNames = ['احمدی', 'محمدی', 'رضایی', 'حسینی', 'کریمی', 'موسوی', 'جعفری', 'صادقی', 'نوری', 'اکبری', 'رحیمی', 'قاسمی', 'عباسی', 'مرادی', 'هاشمی', 'امیری', 'مقدم', 'نجفی', 'پور', 'زاده'];

function randomName() {
  return {
    first: firstNames[Math.floor(Math.random() * firstNames.length)],
    last: lastNames[Math.floor(Math.random() * lastNames.length)],
  };
}

function randomPhone(index) {
  // 0912 + 7 رقم رندوم بر اساس index برای یکتایی
  const base = 2000000 + index * 1234;
  const num = String(base).padStart(7, '0').slice(-7);
  return `0912${num}`;
}

const businessesSeed = [
  {
    slug: 'demo',
    name: 'سالن زیبایی گل‌نرگس',
    description: 'ارائه خدمات آرایشی و زیبایی با کادری مجرب - رزرو آنلاین کمتر از یک دقیقه',
    city: 'تهران',
    address: 'ولیعصر، پلاک 100',
    theme: { primary: '#0d9488', secondary: '#0f766e', accent: '#f59e0b' },
    services: [
      { name: 'کوتاهی مو', duration: 45, price: 450000 },
      { name: 'رنگ و مش', duration: 120, price: 1800000 },
      { name: 'مانیکور', duration: 40, price: 350000 },
    ],
  },
  {
    slug: 'moristyle',
    name: 'آرایشگاه زنانه موری استایل',
    description: 'تخصصی‌ترین آرایشگاه زنانه با لاین‌های رنگ، کوتاهی، کراتین و اکستنشن',
    city: 'تهران',
    address: 'سعادت آباد، سرو غربی',
    theme: { primary: '#db2777', secondary: '#be185d', accent: '#f472b6' },
    services: [
      { name: 'کراتین مو', duration: 180, price: 3500000 },
      { name: 'شینیون عروس', duration: 120, price: 2500000 },
      { name: 'رنگ ریشه', duration: 90, price: 1200000 },
      { name: 'اصلاح ابرو', duration: 20, price: 150000 },
    ],
  },
  {
    slug: 'nailart',
    name: 'ناخن‌کار حرفه‌ای نیل آرت',
    description: 'طراحی ناخن، کاشت، ژلیش و مانیکور روسی توسط ناخن‌کار حرفه‌ای',
    city: 'اصفهان',
    address: 'چهارباغ بالا، مجتمع پارک',
    theme: { primary: '#7c3aed', secondary: '#5b21b6', accent: '#f472b6' },
    services: [
      { name: 'کاشت ناخن', duration: 90, price: 800000 },
      { name: 'ژلیش', duration: 60, price: 450000 },
      { name: 'طراحی ساده', duration: 30, price: 200000 },
      { name: 'ترمیم', duration: 60, price: 500000 },
    ],
  },
  {
    slug: 'barberking',
    name: 'آرایشگاه مردانه باربر کینگ',
    description: 'آرایشگاه آقایان با استایل کلاسیک و مدرن - فید، سایه، ریش',
    city: 'مشهد',
    address: 'احمدآباد، خیابان کلاهدوز',
    theme: { primary: '#111827', secondary: '#000', accent: '#f59e0b' },
    services: [
      { name: 'اصلاح فید', duration: 30, price: 250000 },
      { name: 'اصلاح ریش', duration: 20, price: 150000 },
      { name: 'رنگ مو آقایان', duration: 45, price: 400000 },
      { name: 'پاکسازی پوست', duration: 40, price: 350000 },
    ],
  },
  {
    slug: 'clinicnoor',
    name: 'کلینیک زیبایی نور',
    description: 'کلینیک پوست، مو و زیبایی با دستگاه‌های به روز - بوتاکس، فیلر، لیزر',
    city: 'شیراز',
    address: 'معالی آباد، نبش پزشکان',
    theme: { primary: '#0284C7', secondary: '#0369a1', accent: '#06b6d4' },
    services: [
      { name: 'بوتاکس پیشانی', duration: 30, price: 2500000 },
      { name: 'فیلر لب', duration: 45, price: 4500000 },
      { name: 'لیزر مو', duration: 60, price: 1200000 },
      { name: 'مزوتراپی', duration: 40, price: 1800000 },
    ],
  },
];

async function ensureUser(phone, firstName, lastName, role = 'customer') {
  let [u] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (!u) {
    [u] = await db.insert(users).values({
      phone,
      firstName,
      lastName,
      passwordHash,
      role,
      isPhoneVerified: true,
    }).returning();
  }
  return u;
}

async function ensureBusiness(data, owner) {
  let [biz] = await db.select().from(businesses).where(eq(businesses.slug, data.slug)).limit(1);
  if (!biz) {
    [biz] = await db.insert(businesses).values({
      ownerId: owner.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      city: data.city,
      address: data.address,
      theme: data.theme,
      phone: '02191000000',
      depositPercent: 50,
      cardNumber: '6037-9977-1234-5678',
      cardHolderName: owner.firstName + ' ' + owner.lastName,
    }).returning();
    console.log(`biz ${biz.slug} created`);
  }

  // owner member
  let [om] = await db.select().from(businessMembers).where(eq(businessMembers.businessId, biz.id)).limit(1);
  // ساده: چک اگر owner membership ندارد
  const { and } = await import('drizzle-orm');
  const [ownerMember] = await db.select().from(businessMembers).where(and(eq(businessMembers.businessId, biz.id), eq(businessMembers.userId, owner.id))).limit(1);
  if (!ownerMember) {
    await db.insert(businessMembers).values({ businessId: biz.id, userId: owner.id, role: 'owner', jobTitle: 'مدیر' });
  }

  // services
  const existingServices = await db.select().from(services).where(eq(services.businessId, biz.id));
  let serviceList = existingServices;
  if (existingServices.length === 0) {
    serviceList = await db.insert(services).values(
      data.services.map((s, idx) => ({
        businessId: biz.id,
        name: s.name,
        durationMinutes: s.duration,
        price: s.price,
        bufferMinutes: 10,
        type: 'individual',
        sortOrder: idx + 1,
      }))
    ).returning();
  }

  // working hours
  const { workingHours: whTable } = await import('../src/db/schema/services.js');
  const existingHours = await db.select().from(whTable).where(eq(whTable.businessId, biz.id));
  if (existingHours.length === 0) {
    const hours = [];
    for (let d = 0; d <= 5; d++) {
      hours.push({ businessId: biz.id, memberId: null, dayOfWeek: d, startTime: '09:00', endTime: '19:00', isOff: false });
    }
    hours.push({ businessId: biz.id, memberId: null, dayOfWeek: 6, startTime: '00:00', endTime: '00:00', isOff: true });
    await db.insert(whTable).values(hours);
  }

  // staffServices
  const members = await db.select().from(businessMembers).where(eq(businessMembers.businessId, biz.id));
  for (const mem of members) {
    for (const svc of serviceList) {
      try {
        const { staffServices: ss } = await import('../src/db/schema/services.js');
        await db.insert(ss).values({ memberId: mem.id, serviceId: svc.id }).onConflictDoNothing();
      } catch {}
    }
  }

  return { biz, services: serviceList };
}

async function main() {
  console.log('Seeding realistic data...');

  // اطمینان از پلن‌ها
  let planRows = await db.select().from(plans);
  if (planRows.length === 0) {
    planRows = await db.insert(plans).values([
      { code: 'base', name: 'پایه', priceMonthly: 290000, maxStaff: 2, maxServices: 10, trialDays: 14, sortOrder: 1 },
      { code: 'pro', name: 'حرفه‌ای', priceMonthly: 590000, maxStaff: 5, maxServices: 50, trialDays: 14, sortOrder: 2 },
      { code: 'enterprise', name: 'سازمانی', priceMonthly: 1290000, maxStaff: 20, maxServices: 500, trialDays: 14, sortOrder: 3 },
    ]).returning();
  }
  const proPlan = planRows[0];

  // 5 بیزنس + owner
  const bizList = [];
  for (let i = 0; i < businessesSeed.length; i++) {
    const bData = businessesSeed[i];
    const ownerPhone = `0912000000${i + 1}`; // 09120000001 تا 09120000005
    const owner = await ensureUser(ownerPhone, bData.name.split(' ')[0], 'مدیر', 'business_owner');
    const { biz, services: svcList } = await ensureBusiness(bData, owner);
    bizList.push({ biz, services: svcList, owner });

    // subscription trial
    const { subscriptions: subs } = await import('../src/db/schema/saas.js');
    const existingSub = await db.select().from(subs).where(eq(subs.businessId, biz.id)).limit(1);
    if (!existingSub[0]) {
      const startsAt = new Date();
      const endsAt = new Date(Date.now() + 14 * 86400000);
      await db.insert(subs).values({ businessId: biz.id, planId: proPlan.id, status: 'trial', startsAt, endsAt, trialEndsAt: endsAt, billingCycle: 'monthly' });
    }
  }

  // 100 کاربر مشتری
  const customers = [];
  for (let i = 0; i < 100; i++) {
    const { first, last } = randomName();
    const phone = randomPhone(i + 100);
    const u = await ensureUser(phone, first, last, 'customer');
    customers.push(u);
  }
  console.log(`100 customers created`);

  // تاریخچه رزرو متنوع
  const statuses = ['confirmed', 'completed', 'cancelled', 'no_show', 'pending_payment', 'expired'];
  const paymentMethods = ['gateway', 'card_to_card', 'pos'];

  let totalBookings = 0;
  for (const { biz, services: svcList } of bizList) {
    const members = await db.select().from(businessMembers).where(eq(businessMembers.businessId, biz.id));
    const memberIds = members.map((m) => m.id);

    for (let k = 0; k < 30; k++) {
      const cust = customers[Math.floor(Math.random() * customers.length)];
      const svc = svcList[Math.floor(Math.random() * svcList.length)];
      const memId = memberIds[Math.floor(Math.random() * memberIds.length)] || null;

      // تاریخ: 60 روز گذشته تا 14 روز آینده
      const offsetDays = Math.floor(Math.random() * 74) - 60;
      const date = new Date();
      date.setDate(date.getDate() + offsetDays);
      date.setHours(9 + Math.floor(Math.random() * 9), [0, 15, 30, 45][Math.floor(Math.random() * 4)], 0, 0);

      const endsAt = new Date(date.getTime() + svc.durationMinutes * 60000);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const totalAmount = svc.price;
      const depositAmount = Math.round(totalAmount * 0.5);

      try {
        await db.insert(bookings).values({
          businessId: biz.id,
          serviceId: svc.id,
          memberId: memId,
          customerId: cust.id,
          customerName: `${cust.firstName} ${cust.lastName}`,
          customerPhone: cust.phone,
          startsAt: date,
          endsAt,
          status,
          totalAmount,
          depositAmount,
          notes: Math.random() > 0.7 ? 'مشتری VIP - پذیرایی ویژه' : null,
          policyAccepted: true,
        });
        totalBookings++;
      } catch (e) {
        // ignore duplicate
      }
    }
  }

  console.log(`Bookings created: ${totalBookings}`);

  // Super admin + visitor
  await ensureUser('09120000000', 'سوپر', 'ادمین', 'super_admin');
  await ensureUser('09120000004', 'رضا', 'بازاریاب', 'visitor');

  // visitor profile
  const [visitorUser] = await db.select().from(users).where(eq(users.phone, '09120000004')).limit(1);
  const { visitors: visitorsTable } = await import('../src/db/schema/businesses.js');
  const [visExists] = await db.select().from(visitorsTable).where(eq(visitorsTable.userId, visitorUser.id)).limit(1);
  if (!visExists) {
    await db.insert(visitorsTable).values({ userId: visitorUser.id, slug: 'reza-visitor', referralCode: 'REZA20', bio: 'مشاور راه‌اندازی', commissionPercent: 20 });
  }

  console.log('\n✅ Realistic Seed Complete');
  console.log('Businesses: demo, moristyle, nailart, barberking, clinicnoor');
  console.log('Each accessible at: http://{slug}.localhost:3001/  (e.g. http://moristyle.localhost:3001/)');
  console.log('Owner logins: 09120000001 تا 09120000005 / 123456');
  console.log('100 customers: 0912xxxxxxx / 123456');
  console.log('Super admin: 09120000000 / 123456');
  console.log('Visitor: 09120000004 / 123456 (REZA20)');

  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
