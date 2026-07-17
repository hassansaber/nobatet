/**
 * تعطیلات رسمی تقویم ایران
 * شامل ثابت‌ها (جلالی) + متغیرهای قمری برای سال‌های ۱۴۰۳، ۱۴۰۴، ۱۴۰۵
 * منبع: شورای فرهنگ عمومی + تقویم رسمی
 * برای استفاده در پنل زمان‌بندی کسب‌وکار
 */

export const OFFICIAL_HOLIDAYS = [
  // === ۱۴۰۳ - سال گذشته (۱۴۰۳/۰۱/۰۱ تا ۱۴۰۳/۱۲/۲۹) - مرجع ===
  { jalali: '1403-01-01', gregorian: '2024-03-20', title: 'عید نوروز', type: 'official' },
  { jalali: '1403-01-02', gregorian: '2024-03-21', title: 'عید نوروز', type: 'official' },
  { jalali: '1403-01-03', gregorian: '2024-03-22', title: 'عید نوروز', type: 'official' },
  { jalali: '1403-01-04', gregorian: '2024-03-23', title: 'عید نوروز', type: 'official' },
  { jalali: '1403-01-12', gregorian: '2024-03-31', title: 'روز جمهوری اسلامی', type: 'official' },
  { jalali: '1403-01-13', gregorian: '2024-04-01', title: 'روز طبیعت', type: 'official' },
  { jalali: '1403-01-22', gregorian: '2024-04-10', title: 'عید سعید فطر', type: 'official' },
  { jalali: '1403-01-23', gregorian: '2024-04-11', title: 'تعطیل به مناسبت عید فطر', type: 'official' },
  { jalali: '1403-02-04', gregorian: '2024-04-23', title: 'شهادت امام جعفر صادق', type: 'official' },
  { jalali: '1403-03-14', gregorian: '2024-06-03', title: 'رحلت امام خمینی', type: 'official' },
  { jalali: '1403-03-15', gregorian: '2024-06-04', title: 'قیام ۱۵ خرداد', type: 'official' },
  { jalali: '1403-03-28', gregorian: '2024-06-17', title: 'عید قربان', type: 'official' },
  { jalali: '1403-04-05', gregorian: '2024-06-25', title: 'عید غدیر', type: 'official' },
  { jalali: '1403-04-26', gregorian: '2024-07-16', title: 'تاسوعا', type: 'official' },
  { jalali: '1403-04-27', gregorian: '2024-07-17', title: 'عاشورا', type: 'official' },
  { jalali: '1403-06-04', gregorian: '2024-08-25', title: 'اربعین حسینی', type: 'official' },
  { jalali: '1403-06-12', gregorian: '2024-09-02', title: 'رحلت رسول اکرم و شهادت امام حسن مجتبی', type: 'official' },
  { jalali: '1403-06-14', gregorian: '2024-09-04', title: 'شهادت امام رضا', type: 'official' },
  { jalali: '1403-06-21', gregorian: '2024-09-11', title: 'شهادت امام حسن عسکری و آغاز امامت حضرت مهدی', type: 'official' },
  { jalali: '1403-06-31', gregorian: '2024-09-21', title: 'میلاد رسول اکرم و امام جعفر صادق', type: 'official' },
  { jalali: '1403-09-05', gregorian: '2024-11-25', title: 'شهادت حضرت زهرا (س)', type: 'official' },
  { jalali: '1403-10-04', gregorian: '2024-12-24', title: 'ولادت امام علی و روز پدر', type: 'official' },
  { jalali: '1403-10-18', gregorian: '2025-01-07', title: 'مبعث رسول اکرم', type: 'official' },
  { jalali: '1403-11-15', gregorian: '2025-02-03', title: 'ولادت امام زمان (عج)', type: 'official' },
  { jalali: '1403-11-22', gregorian: '2025-02-10', title: 'پیروزی انقلاب اسلامی', type: 'official' },
  { jalali: '1403-12-11', gregorian: '2025-03-01', title: 'شهادت حضرت علی (ع)', type: 'official' },
  { jalali: '1403-12-21', gregorian: '2025-03-11', title: 'عید نوروز و شب قدر', type: 'official' },
  { jalali: '1403-12-30', gregorian: '2025-03-20', title: 'روز ملی شدن صنعت نفت (شب قدر)', type: 'official' },

  // === ۱۴۰۴ - سال جاری (۱۴۰۴/۰۱/۰۱ تا ۱۴۰۴/۱۲/۲۹) - ۲۶ روز تعطیل ===
  { jalali: '1404-01-01', gregorian: '2025-03-21', title: 'عید نوروز و شب قدر', type: 'official' },
  { jalali: '1404-01-02', gregorian: '2025-03-22', title: 'عید نوروز و شهادت امام علی (ع) - ۲۱ رمضان', type: 'official' },
  { jalali: '1404-01-03', gregorian: '2025-03-23', title: 'عید نوروز و شب قدر', type: 'official' },
  { jalali: '1404-01-04', gregorian: '2025-03-24', title: 'عید نوروز', type: 'official' },
  { jalali: '1404-01-11', gregorian: '2025-03-31', title: 'عید سعید فطر - ۱ شوال', type: 'official' },
  { jalali: '1404-01-12', gregorian: '2025-04-01', title: 'روز جمهوری اسلامی + تعطیل عید فطر (۲ شوال)', type: 'official' },
  { jalali: '1404-01-13', gregorian: '2025-04-02', title: 'روز طبیعت - سیزده بدر', type: 'official' },
  { jalali: '1404-02-04', gregorian: '2025-04-24', title: 'شهادت امام جعفر صادق (ع) - ۲۵ شوال', type: 'official' },
  { jalali: '1404-03-14', gregorian: '2025-06-04', title: 'رحلت حضرت امام خمینی (ره)', type: 'official' },
  { jalali: '1404-03-15', gregorian: '2025-06-05', title: 'قیام ۱۵ خرداد', type: 'official' },
  { jalali: '1404-03-16', gregorian: '2025-06-06', title: 'عید قربان - ۱۰ ذی‌الحجه', type: 'official' },
  { jalali: '1404-03-24', gregorian: '2025-06-14', title: 'عید غدیر خم - ۱۸ ذی‌الحجه', type: 'official' },
  { jalali: '1404-04-14', gregorian: '2025-07-05', title: 'تاسوعای حسینی - ۹ محرم', type: 'official' },
  { jalali: '1404-04-15', gregorian: '2025-07-06', title: 'عاشورای حسینی - ۱۰ محرم', type: 'official' },
  { jalali: '1404-05-23', gregorian: '2025-08-14', title: 'اربعین حسینی - ۲۰ صفر', type: 'official' },
  { jalali: '1404-05-31', gregorian: '2025-08-22', title: 'رحلت رسول اکرم و شهادت امام حسن مجتبی - ۲۸ صفر', type: 'official' },
  { jalali: '1404-06-02', gregorian: '2025-08-24', title: 'شهادت امام رضا (ع) - ۳۰ صفر', type: 'official' },
  { jalali: '1404-06-10', gregorian: '2025-09-01', title: 'شهادت امام حسن عسکری (ع) - ۸ ربیع الاول', type: 'official' },
  { jalali: '1404-06-19', gregorian: '2025-09-10', title: 'میلاد رسول اکرم و امام جعفر صادق (ع) - ۱۷ ربیع الاول', type: 'official' },
  { jalali: '1404-08-22', gregorian: '2025-11-13', title: 'شهادت حضرت زهرا (س) - ۳ جمادی‌الثانی', type: 'official' },
  { jalali: '1404-10-02', gregorian: '2025-12-22', title: 'ولادت امام علی (ع) و روز پدر - ۱۳ رجب', type: 'official' },
  { jalali: '1404-10-16', gregorian: '2026-01-05', title: 'مبعث رسول اکرم (ص) - ۲۷ رجب', type: 'official' },
  { jalali: '1404-11-04', gregorian: '2026-01-23', title: 'ولادت امام زمان (عج) - ۱۵ شعبان', type: 'official' },
  { jalali: '1404-11-22', gregorian: '2026-02-10', title: 'پیروزی انقلاب اسلامی', type: 'official' },
  { jalali: '1404-12-09', gregorian: '2026-02-28', title: 'شهادت حضرت علی (ع) - ۱۹ رمضان', type: 'official' },
  { jalali: '1404-12-19', gregorian: '2026-03-10', title: 'عید سعید فطر - ۱ شوال', type: 'official' },
  { jalali: '1404-12-20', gregorian: '2026-03-11', title: 'تعطیل به مناسبت عید فطر - ۲ شوال', type: 'official' },
  { jalali: '1404-12-29', gregorian: '2026-03-20', title: 'روز ملی شدن صنعت نفت ایران', type: 'official' },

  // === ۱۴۰۵ - سال آینده (۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹) - حدود ۲۷ روز ===
  { jalali: '1405-01-01', gregorian: '2026-03-21', title: 'عید نوروز و عید سعید فطر', type: 'official' },
  { jalali: '1405-01-02', gregorian: '2026-03-22', title: 'عید نوروز', type: 'official' },
  { jalali: '1405-01-03', gregorian: '2026-03-23', title: 'عید نوروز', type: 'official' },
  { jalali: '1405-01-04', gregorian: '2026-03-24', title: 'عید نوروز', type: 'official' },
  { jalali: '1405-01-12', gregorian: '2026-04-01', title: 'روز جمهوری اسلامی', type: 'official' },
  { jalali: '1405-01-13', gregorian: '2026-04-02', title: 'روز طبیعت', type: 'official' },
  { jalali: '1405-03-06', gregorian: '2026-05-27', title: 'عید سعید قربان - ۱۰ ذی‌الحجه', type: 'official' },
  { jalali: '1405-03-14', gregorian: '2026-06-04', title: 'رحلت امام خمینی + عید غدیر خم - ۱۸ ذی‌الحجه', type: 'official' },
  { jalali: '1405-03-15', gregorian: '2026-06-05', title: 'قیام ۱۵ خرداد', type: 'official' },
  { jalali: '1405-04-03', gregorian: '2026-06-24', title: 'تاسوعای حسینی - ۹ محرم', type: 'official' },
  { jalali: '1405-04-04', gregorian: '2026-06-25', title: 'عاشورای حسینی - ۱۰ محرم', type: 'official' },
  { jalali: '1405-05-13', gregorian: '2026-08-04', title: 'اربعین حسینی - ۲۰ صفر', type: 'official' },
  { jalali: '1405-05-21', gregorian: '2026-08-12', title: 'رحلت رسول اکرم و شهادت امام حسن مجتبی - ۲۸ صفر', type: 'official' },
  { jalali: '1405-05-22', gregorian: '2026-08-13', title: 'شهادت امام رضا (ع) - ۳۰ صفر', type: 'official' },
  { jalali: '1405-05-30', gregorian: '2026-08-21', title: 'شهادت امام حسن عسکری (ع) - ۸ ربیع‌الاول', type: 'official' },
  { jalali: '1405-06-08', gregorian: '2026-08-30', title: 'میلاد رسول اکرم و امام جعفر صادق (ع) - ۱۷ ربیع‌الاول', type: 'official' },
  { jalali: '1405-08-22', gregorian: '2026-11-13', title: 'شهادت حضرت زهرا (س)', type: 'official' },
  { jalali: '1405-10-02', gregorian: '2026-12-22', title: 'ولادت امام علی (ع) و روز پدر', type: 'official' },
  { jalali: '1405-10-16', gregorian: '2027-01-05', title: 'مبعث حضرت رسول اکرم (ص)', type: 'official' },
  { jalali: '1405-11-04', gregorian: '2027-01-23', title: 'ولادت حضرت قائم (عج) - نیمه شعبان', type: 'official' },
  { jalali: '1405-11-22', gregorian: '2027-02-10', title: 'پیروزی انقلاب اسلامی', type: 'official' },
  { jalali: '1405-12-09', gregorian: '2027-02-28', title: 'شهادت حضرت علی (ع) - ۱۹ رمضان', type: 'official' },
  { jalali: '1405-12-19', gregorian: '2027-03-10', title: 'عید سعید فطر - ۱ شوال', type: 'official' },
  { jalali: '1405-12-20', gregorian: '2027-03-11', title: 'تعطیل به مناسبت عید فطر - ۲ شوال', type: 'official' },
  { jalali: '1405-12-29', gregorian: '2027-03-20', title: 'روز ملی شدن صنعت نفت', type: 'official' },
];

/**
 * تعطیلات پیش رو (۶۰ روز آینده از امروز میلادی)
 */
export function getUpcomingHolidays(daysAhead = 90) {
  const now = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return OFFICIAL_HOLIDAYS.filter((h) => {
    const d = new Date(h.gregorian);
    return d >= now && d <= future;
  });
}

/**
 * تبدیل تاریخ جلالی YYYY-MM-DD به بازه زمانی کامل روز به وقت تهران
 * برای ثبت به عنوان time_off (از 00:00 تا 23:59:59)
 */
export function jalaliToTimeOffRange(jalaliDate) {
  const gregorian = OFFICIAL_HOLIDAYS.find((h) => h.jalali === jalaliDate)?.gregorian;
  const base = gregorian ? new Date(gregorian) : new Date();
  // روز کامل به وقت تهران: 00:00 تا 23:59
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(base);
  end.setHours(23, 59, 59, 999);
  // برای دقت بیشتر، اگر تاریخ جلالی آینده است، آن را به صورت میلادی تخمین می‌زنیم
  // فعلاً از همان gregorian استفاده می‌کنیم
  return { startAt: start.toISOString(), endAt: end.toISOString() };
}

/**
 * گروه‌بندی تعطیلات بر اساس ماه جلالی
 */
export function groupByJalaliMonth() {
  const groups = {};
  for (const h of OFFICIAL_HOLIDAYS) {
    const month = h.jalali.slice(0, 7); // YYYY-MM
    if (!groups[month]) groups[month] = [];
    groups[month].push(h);
  }
  return groups;
}
