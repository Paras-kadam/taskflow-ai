import { Request, Response, NextFunction } from 'express';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { FocusSession } from '../models/FocusSession';

export const getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const endOfYesterday = new Date(startOfToday.getTime() - 1);

    // 1. All tasks of the user
    const allTasks = await Task.find({ userId });
    const totalTasks = allTasks.length;
    const totalCompleted = allTasks.filter((t) => t.status === 'completed').length;
    const totalActive = allTasks.filter((t) => t.status !== 'completed' && t.status !== 'archived').length;

    // 2. Today's breakdown
    const tasksDueToday = allTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) >= startOfToday && new Date(t.dueDate) <= endOfToday
    );
    const completedToday = allTasks.filter(
      (t) => t.completedAt && new Date(t.completedAt) >= startOfToday && new Date(t.completedAt) <= endOfToday
    ).length;

    const completedYesterday = allTasks.filter(
      (t) => t.completedAt && new Date(t.completedAt) >= startOfYesterday && new Date(t.completedAt) <= endOfYesterday
    ).length;

    const overdueTasks = allTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < startOfToday && t.status !== 'completed' && t.status !== 'archived'
    ).length;

    const todayRemaining = tasksDueToday.filter((t) => t.status !== 'completed').length;

    // 3. Priority distribution of active tasks
    const priorityDistribution = {
      urgent: allTasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length,
      high: allTasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length,
      medium: allTasks.filter((t) => t.priority === 'medium' && t.status !== 'completed').length,
      low: allTasks.filter((t) => t.priority === 'low' && t.status !== 'completed').length,
      none: allTasks.filter((t) => (t.priority === 'none' || !t.priority) && t.status !== 'completed').length,
    };

    // 4. Streak Calculation
    // Find all distinct dates on which at least one task was completed
    const completedTasksWithDates = allTasks.filter((t) => t.completedAt);
    const completedDateSet = new Set<string>();
    completedTasksWithDates.forEach((t) => {
      if (t.completedAt) {
        const d = new Date(t.completedAt);
        completedDateSet.add(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);
      }
    });

    let currentStreak = 0;
    let checkDate = new Date(startOfToday);

    // If completed today, start counting from today. Otherwise, check if completed yesterday.
    const todayKey = `${checkDate.getFullYear()}-${checkDate.getMonth() + 1}-${checkDate.getDate()}`;
    if (completedDateSet.has(todayKey)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Check if streak is still active from yesterday
      const yesterdayDate = new Date(startOfYesterday);
      const yKey = `${yesterdayDate.getFullYear()}-${yesterdayDate.getMonth() + 1}-${yesterdayDate.getDate()}`;
      if (completedDateSet.has(yKey)) {
        checkDate = yesterdayDate;
      } else {
        checkDate = null as any;
      }
    }

    if (checkDate) {
      while (true) {
        const key = `${checkDate.getFullYear()}-${checkDate.getMonth() + 1}-${checkDate.getDate()}`;
        if (completedDateSet.has(key)) {
          if (key !== todayKey) currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // 5. Completion history for the last 14 days (for charts)
    const historyData = [];
    for (let i = 13; i >= 0; i--) {
      const targetDate = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
      const dateLabel = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const completedOnDate = allTasks.filter(
        (t) => t.completedAt && new Date(t.completedAt) >= targetDate && new Date(t.completedAt) < nextDate
      ).length;

      const createdOnDate = allTasks.filter(
        (t) => new Date(t.createdAt) >= targetDate && new Date(t.createdAt) < nextDate
      ).length;

      historyData.push({
        date: dateLabel,
        completed: completedOnDate,
        created: createdOnDate,
      });
    }

    // 6. Project Stats
    const projects = await Project.find({ userId });
    const projectStats = projects.map((p) => {
      const projectTasks = allTasks.filter((t) => t.projectId && t.projectId.toString() === p._id.toString());
      const pCompleted = projectTasks.filter((t) => t.status === 'completed').length;
      return {
        name: p.name,
        color: p.color || '#8b5cf6',
        total: projectTasks.length,
        completed: pCompleted,
        remaining: projectTasks.length - pCompleted,
        progress: projectTasks.length > 0 ? Math.round((pCompleted / projectTasks.length) * 100) : 0,
      };
    });

    // 7. Focus Sessions Stats
    const focusSessions = await FocusSession.find({ userId });
    const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + s.duration, 0);
    const todayFocusMinutes = focusSessions
      .filter((s) => new Date(s.completedAt) >= startOfToday)
      .reduce((acc, s) => acc + s.duration, 0);

    // 8. Productivity Score (0 - 100)
    // Formula: based on completion rate (40%), streak bonus (30%), overdue penalty (-20%), focus time (10%)
    const completionRate = totalTasks > 0 ? (totalCompleted / totalTasks) : 0;
    const streakFactor = Math.min(currentStreak / 10, 1);
    const overduePenalty = totalActive > 0 ? Math.min(overdueTasks / totalActive, 1) * 20 : 0;
    const focusBonus = Math.min(totalFocusMinutes / 120, 1) * 10;

    let productivityScore = Math.round(completionRate * 50 + streakFactor * 30 + focusBonus - overduePenalty);
    productivityScore = Math.max(0, Math.min(100, productivityScore));

    res.status(200).json({
      overview: {
        totalTasks,
        totalCompleted,
        totalActive,
        completedToday,
        completedYesterday,
        dueToday: tasksDueToday.length,
        todayRemaining,
        overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0,
        currentStreak,
        productivityScore,
        totalFocusMinutes,
        todayFocusMinutes,
        focusSessionsCount: focusSessions.length,
      },
      priorityDistribution,
      historyData,
      projectStats,
    });
  } catch (error) {
    next(error);
  }
};
