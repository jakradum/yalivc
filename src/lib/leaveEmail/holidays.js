// Office holidays, as circulated by Karthik Sunder on the shared calendar ("<Name> (Holiday)"
// events). Add next year's list here when it goes out — nothing reads the calendar itself.
export const HOLIDAYS = [
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-04-14', name: 'Tamil New Year / Vishu' },
  { date: '2026-05-01', name: 'May Day' },
  { date: '2026-08-26', name: 'Onam' },
  { date: '2026-09-14', name: 'Vinayaka Chaturthi / Ganesh Chaturthi' },
  { date: '2026-10-02', name: 'Mahatma Gandhi Jayanthi' },
  { date: '2026-10-20', name: 'Vijayadashami' },
  { date: '2026-11-10', name: 'Balipadyami' },
  { date: '2026-12-25', name: 'Christmas' },
];

const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const isHoliday = (iso) => HOLIDAYS.some((h) => h.date === iso);
const isWorkingDay = (d) => d.getDay() !== 0 && d.getDay() !== 6 && !isHoliday(isoOf(d));

// The reminder for a holiday goes out on the last working day before it, so a Monday
// holiday is announced on the Friday, and back-to-back holidays share one send day.
export function reminderDate(holidayISO) {
  const d = parse(holidayISO);
  do d.setDate(d.getDate() - 1); while (!isWorkingDay(d));
  return isoOf(d);
}

// Holidays to announce on the given IST date (YYYY-MM-DD), each with whether it's the very next day.
export function holidaysToAnnounce(todayISO) {
  const next = parse(todayISO);
  next.setDate(next.getDate() + 1);
  return HOLIDAYS
    .filter((h) => reminderDate(h.date) === todayISO)
    .map((h) => ({ ...h, isTomorrow: h.date === isoOf(next) }));
}
