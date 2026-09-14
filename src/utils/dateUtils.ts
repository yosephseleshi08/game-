export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Get the Monday of the week for a given date
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get all 7 days of the week (Monday through Sunday)
export function getWeekDates(anchorDate: Date): Date[] {
  const monday = getMondayOfWeek(anchorDate);
  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    week.push(nextDay);
  }
  return week;
}

export function formatShortDay(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function formatMonthDay(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatWeekRange(startDate: Date, endDate: Date): string {
  const sameMonth = startDate.getMonth() === endDate.getMonth();
  if (sameMonth) {
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endDate.getDate()}, ${endDate.getFullYear()}`;
  }
  return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${endDate.getFullYear()}`;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isHabitScheduledForDay(
  frequency: 'daily' | 'weekdays' | 'custom',
  customDays: number[] | undefined,
  date: Date
): boolean {
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  if (frequency === 'daily') return true;
  if (frequency === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (frequency === 'custom' && customDays) {
    return customDays.includes(dayOfWeek);
  }
  return true;
}
