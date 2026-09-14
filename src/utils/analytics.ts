import {
  Habit,
  HabitCategory,
  HabitLogsMap,
  WeeklyProductivityReport,
  DailyStat,
} from '../types';
import {
  formatDateKey,
  formatShortDay,
  getWeekDates,
  isHabitScheduledForDay,
  isSameDay,
} from './dateUtils';

// Calculate streaks for a specific habit
export function calculateHabitStreak(
  habit: Habit,
  logs: HabitLogsMap,
  referenceDate: Date = new Date()
): { currentStreak: number; longestStreak: number; completionRate30: number } {
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let totalScheduled30 = 0;
  let totalCompleted30 = 0;

  // We scan back 90 days for streaks, 30 days for rate
  const checkDate = new Date(referenceDate);
  checkDate.setHours(0, 0, 0, 0);

  let checkingCurrent = true;

  for (let i = 0; i < 90; i++) {
    const d = new Date(checkDate);
    d.setDate(checkDate.getDate() - i);
    const dateKey = formatDateKey(d);

    const isScheduled = isHabitScheduledForDay(habit.frequency, habit.customDays, d);
    if (!isScheduled) continue;

    const log = logs[dateKey]?.[habit.id];
    const isCompleted = !!log?.completed;

    if (i < 30) {
      totalScheduled30++;
      if (isCompleted) totalCompleted30++;
    }

    if (isCompleted) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      if (checkingCurrent) {
        currentStreak++;
      }
    } else {
      // If day is today and not yet completed, don't break current streak yet
      if (i === 0 && isSameDay(d, referenceDate)) {
        // give grace for today
      } else {
        checkingCurrent = false;
      }
      tempStreak = 0;
    }
  }

  const completionRate30 = totalScheduled30 > 0
    ? Math.round((totalCompleted30 / totalScheduled30) * 100)
    : 0;

  return { currentStreak, longestStreak, completionRate30 };
}

// Compute full productivity report for a given anchor week
export function generateWeeklyReport(
  habits: Habit[],
  logs: HabitLogsMap,
  anchorDate: Date
): WeeklyProductivityReport {
  const activeHabits = habits.filter((h) => !h.archived);
  const weekDates = getWeekDates(anchorDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekStart = formatDateKey(weekDates[0]);
  const weekEnd = formatDateKey(weekDates[6]);

  const dailyStats: DailyStat[] = [];
  let totalScheduled = 0;
  let totalCompleted = 0;
  let perfectDays = 0;

  const categoryMap: Record<
    HabitCategory,
    { scheduled: number; completed: number }
  > = {
    health: { scheduled: 0, completed: 0 },
    work: { scheduled: 0, completed: 0 },
    mindfulness: { scheduled: 0, completed: 0 },
    fitness: { scheduled: 0, completed: 0 },
    learning: { scheduled: 0, completed: 0 },
    personal: { scheduled: 0, completed: 0 },
  };

  const habitWeekCompletion: Record<string, { habit: Habit; completedCount: number; scheduledCount: number }> = {};
  activeHabits.forEach((h) => {
    habitWeekCompletion[h.id] = { habit: h, completedCount: 0, scheduledCount: 0 };
  });

  weekDates.forEach((date) => {
    const dateKey = formatDateKey(date);
    const isToday = isSameDay(date, today);
    const isFuture = date.getTime() > today.getTime();

    let dayScheduled = 0;
    let dayCompleted = 0;

    activeHabits.forEach((habit) => {
      const scheduled = isHabitScheduledForDay(habit.frequency, habit.customDays, date);
      if (scheduled) {
        dayScheduled++;
        totalScheduled++;
        categoryMap[habit.category].scheduled++;
        habitWeekCompletion[habit.id].scheduledCount++;

        const log = logs[dateKey]?.[habit.id];
        if (log?.completed) {
          dayCompleted++;
          totalCompleted++;
          categoryMap[habit.category].completed++;
          habitWeekCompletion[habit.id].completedCount++;
        }
      }
    });

    const dayRate = dayScheduled > 0 ? Math.round((dayCompleted / dayScheduled) * 100) : 0;
    if (dayScheduled > 0 && dayCompleted === dayScheduled) {
      perfectDays++;
    }

    dailyStats.push({
      date: dateKey,
      dayLabel: formatShortDay(date),
      dayNumber: date.getDate(),
      scheduledCount: dayScheduled,
      completedCount: dayCompleted,
      percentage: dayRate,
      isToday,
      isFuture,
    });
  });

  const completionRate = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

  // Calculate Productivity Score (0 - 100):
  // 60% completion rate + 20% consistency / perfect day ratio + 20% active volume
  const perfectDayRatio = (perfectDays / 7) * 100;
  const rawScore = completionRate * 0.65 + perfectDayRatio * 0.25 + (totalCompleted > 0 ? 10 : 0);
  const productivityScore = Math.min(100, Math.round(rawScore));

  // Calculate prior week for delta comparison
  const priorWeekAnchor = new Date(weekDates[0]);
  priorWeekAnchor.setDate(priorWeekAnchor.getDate() - 7);
  const priorWeekDates = getWeekDates(priorWeekAnchor);
  let priorScheduled = 0;
  let priorCompleted = 0;
  let priorPerfectDays = 0;

  priorWeekDates.forEach((date) => {
    const dateKey = formatDateKey(date);
    let pDaySched = 0;
    let pDayComp = 0;

    activeHabits.forEach((habit) => {
      if (isHabitScheduledForDay(habit.frequency, habit.customDays, date)) {
        priorScheduled++;
        pDaySched++;
        if (logs[dateKey]?.[habit.id]?.completed) {
          priorCompleted++;
          pDayComp++;
        }
      }
    });
    if (pDaySched > 0 && pDayComp === pDaySched) {
      priorPerfectDays++;
    }
  });

  const priorRate = priorScheduled > 0 ? (priorCompleted / priorScheduled) * 100 : 0;
  const priorScore = Math.min(100, Math.round(priorRate * 0.65 + (priorPerfectDays / 7) * 25 + (priorCompleted > 0 ? 10 : 0)));
  const scoreDelta = productivityScore - priorScore;

  // Identify Peak and Slump days (ignoring future unlogged days)
  const pastOrTodayStats = dailyStats.filter((d) => !d.isFuture && d.scheduledCount > 0);
  let peakDay: { dayName: string; rate: number } | null = null;
  let slumpDay: { dayName: string; rate: number } | null = null;

  if (pastOrTodayStats.length > 0) {
    const sorted = [...pastOrTodayStats].sort((a, b) => b.percentage - a.percentage);
    peakDay = { dayName: sorted[0].dayLabel, rate: sorted[0].percentage };
    const lowest = sorted[sorted.length - 1];
    if (lowest.percentage < sorted[0].percentage) {
      slumpDay = { dayName: lowest.dayLabel, rate: lowest.percentage };
    }
  }

  // Category breakdown
  const categoryBreakdown = (Object.keys(categoryMap) as HabitCategory[])
    .map((cat) => ({
      category: cat,
      scheduled: categoryMap[cat].scheduled,
      completed: categoryMap[cat].completed,
      rate: categoryMap[cat].scheduled > 0
        ? Math.round((categoryMap[cat].completed / categoryMap[cat].scheduled) * 100)
        : 0,
    }))
    .filter((c) => c.scheduled > 0)
    .sort((a, b) => b.rate - a.rate);

  // Top habits & habits needing attention
  const habitItems = Object.values(habitWeekCompletion).map((item) => {
    const streakData = calculateHabitStreak(item.habit, logs, anchorDate);
    const rate = item.scheduledCount > 0 ? Math.round((item.completedCount / item.scheduledCount) * 100) : 0;
    return {
      habit: item.habit,
      completedDays: item.completedCount,
      scheduledDays: item.scheduledCount,
      rate,
      streak: streakData.currentStreak,
    };
  });

  const topHabits = [...habitItems]
    .filter((h) => h.completedDays > 0)
    .sort((a, b) => b.rate - a.rate || b.streak - a.streak)
    .slice(0, 3)
    .map((h) => ({ habit: h.habit, completedDays: h.completedDays, streak: h.streak }));

  const needsAttentionHabits = [...habitItems]
    .filter((h) => h.scheduledDays > 0 && h.rate < 60)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 3)
    .map((h) => ({ habit: h.habit, completedDays: h.completedDays, rate: h.rate }));

  // Generate dynamic, human-level actionable productivity insights
  const insights: WeeklyProductivityReport['insights'] = [];

  if (productivityScore >= 80) {
    insights.push({
      id: 'ins-score-high',
      type: 'positive',
      title: 'High Velocity Week',
      message: `Your weekly score is ${productivityScore}% with ${perfectDays} flawless days. Your consistency compound effect is accelerating.`,
    });
  } else if (productivityScore >= 60) {
    insights.push({
      id: 'ins-score-med',
      type: 'positive',
      title: 'Solid Baseline Maintained',
      message: `You've achieved ${completionRate}% completion across ${totalCompleted} completed checkpoints. Maintaining momentum into next week will secure your active goals.`,
    });
  } else {
    insights.push({
      id: 'ins-score-low',
      type: 'warning',
      title: 'Friction Point Detected',
      message: `Completion rate is currently ${completionRate}%. Consider simplifying habits down to 2-minute starter versions to rebuild frictionless execution.`,
    });
  }

  if (peakDay) {
    insights.push({
      id: 'ins-peak',
      type: 'positive',
      title: `Peak Performance on ${peakDay.dayName}s`,
      message: `${peakDay.dayName} recorded your highest completion rate (${peakDay.rate}%). Schedule your most challenging cognitive tasks on this day.`,
    });
  }

  if (slumpDay && slumpDay.rate < 65) {
    insights.push({
      id: 'ins-slump',
      type: 'tip',
      title: `Weekend / ${slumpDay.dayName} Dip Strategy`,
      message: `${slumpDay.dayName} dropped to ${slumpDay.rate}%. Try setting low-friction weekend variants or schedule intentional active recovery.`,
    });
  }

  if (categoryBreakdown.length > 0) {
    const topCat = categoryBreakdown[0];
    const lowCat = categoryBreakdown[categoryBreakdown.length - 1];
    if (topCat.rate >= 80 && lowCat.rate < 60 && topCat.category !== lowCat.category) {
      insights.push({
        id: 'ins-cat-balance',
        type: 'tip',
        title: `Category Balance: ${topCat.category.toUpperCase()} vs ${lowCat.category.toUpperCase()}`,
        message: `You are excelling in ${topCat.category} (${topCat.rate}%), while ${lowCat.category} (${lowCat.rate}%) is lagging behind. Anchor ${lowCat.category} habits directly before your favorite routine.`,
      });
    }
  }

  return {
    weekStart,
    weekEnd,
    totalScheduled,
    totalCompleted,
    completionRate,
    productivityScore,
    scoreDelta,
    perfectDays,
    peakDay,
    slumpDay,
    dailyStats,
    categoryBreakdown,
    topHabits,
    needsAttentionHabits,
    insights,
  };
}
