/**
 * تست واحد توابع خالص موتور رزرو (بدون DB)
 * اجرا: node --experimental-default-type=module src/lib/booking-engine.test.js
 * یا از مسیر نسبی بعد از extract
 */

import {
  timeToMinutes,
  minutesToTime,
  rangesOverlap,
  jalaliDayOfWeek,
  combineLocalDateTime,
} from '../services/booking-engine.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// time helpers
assert(timeToMinutes('09:30') === 9 * 60 + 30, 'timeToMinutes');
assert(minutesToTime(570) === '09:30', 'minutesToTime');
assert(minutesToTime(0) === '00:00', 'midnight');

// overlap
const a0 = new Date('2026-07-12T09:00:00');
const a1 = new Date('2026-07-12T10:00:00');
const b0 = new Date('2026-07-12T09:30:00');
const b1 = new Date('2026-07-12T10:30:00');
const c0 = new Date('2026-07-12T10:00:00');
const c1 = new Date('2026-07-12T11:00:00');
assert(rangesOverlap(a0, a1, b0, b1) === true, 'overlap mid');
assert(rangesOverlap(a0, a1, c0, c1) === false, 'touch end no overlap [)');
assert(rangesOverlap(a0, a1, a0, a1) === true, 'same range');

// buffer scenario: service 60 + buffer 15 => block 75
// booking 09:00-10:00 + buffer => busy until 10:15
// next free at 10:15
const busyEnd = new Date(a1.getTime() + 15 * 60_000);
const nextStart = new Date('2026-07-12T10:15:00');
const nextEnd = new Date('2026-07-12T11:15:00');
assert(
  rangesOverlap(nextStart, nextEnd, a0, busyEnd) === false,
  'buffer frees at 10:15',
);
const tooEarly = new Date('2026-07-12T10:00:00');
assert(
  rangesOverlap(tooEarly, new Date('2026-07-12T11:00:00'), a0, busyEnd) === true,
  '10:00 conflicts with buffer',
);

// jalali day: 2026-07-11 is Saturday in many locales — check formula consistency
const sat = new Date(2026, 6, 11); // Jul 11 2026
// If Saturday: getDay()=6 → (6+1)%7=0
assert(jalaliDayOfWeek(sat) === (sat.getDay() + 1) % 7, 'dow map');

const dt = combineLocalDateTime('2026-07-12', '14:30');
assert(dt.getHours() === 14 && dt.getMinutes() === 30, 'combine');

console.log('✓ booking-engine pure unit tests passed');
