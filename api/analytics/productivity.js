const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper function to get date range filter
const getDateRangeFilter = (period) => {
  const now = new Date();
  const filters = {};
  
  switch (period) {
    case 'today':
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filters.createdAt = { gte: startOfDay };
      break;
    case 'week':
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filters.createdAt = { gte: startOfWeek };
      break;
    case 'month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filters.createdAt = { gte: startOfMonth };
      break;
    case 'year':
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      filters.createdAt = { gte: startOfYear };
      break;
    default:
      // No filter for 'all' period
      break;
  }
  
  return filters;
};

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { period = 'month' } = req.query;
    const dateFilter = getDateRangeFilter(period);

    // Calculate average completion time
    const completedTasksWithTimes = await prisma.task.findMany({
      where: {
        ...dateFilter,
        completed: true,
        completedAt: { not: null }
      },
      select: {
        createdAt: true,
        completedAt: true,
        priority: true
      }
    });

    let avgCompletionTime = 0;
    let priorityCompletionTimes = { LOW: [], MEDIUM: [], HIGH: [], URGENT: [] };

    if (completedTasksWithTimes.length > 0) {
      const totalTime = completedTasksWithTimes.reduce((sum, task) => {
        const timeToComplete = new Date(task.completedAt) - new Date(task.createdAt);
        priorityCompletionTimes[task.priority].push(timeToComplete);
        return sum + timeToComplete;
      }, 0);

      avgCompletionTime = totalTime / completedTasksWithTimes.length;
    }

    // Calculate average completion time by priority
    const avgTimeByPriority = {};
    Object.keys(priorityCompletionTimes).forEach(priority => {
      const times = priorityCompletionTimes[priority];
      if (times.length > 0) {
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        avgTimeByPriority[priority] = avgTime / (1000 * 60 * 60); // Convert to hours
      } else {
        avgTimeByPriority[priority] = 0;
      }
    });

    // Get most productive days of week (simplified version for serverless)
    const completedTasks = await prisma.task.findMany({
      where: {
        ...dateFilter,
        completed: true,
        completedAt: { not: null }
      },
      select: {
        completedAt: true
      }
    });

    const dayOfWeekCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    completedTasks.forEach(task => {
      const dayOfWeek = new Date(task.completedAt).getDay();
      dayOfWeekCounts[dayOfWeek]++;
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const productiveDays = Object.entries(dayOfWeekCounts)
      .map(([day, count]) => ({
        day: dayNames[parseInt(day)],
        completedTasks: count
      }))
      .sort((a, b) => b.completedTasks - a.completedTasks);

    // Get completion streaks (simplified calculation)
    const recentTasks = await prisma.task.findMany({
      where: {
        completed: true,
        completedAt: { not: null }
      },
      select: {
        completedAt: true
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 100
    });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    recentTasks.forEach(task => {
      const completedDate = new Date(task.completedAt).toDateString();
      
      if (lastDate === null) {
        tempStreak = 1;
        currentStreak = 1;
      } else if (lastDate === completedDate) {
        // Same day, continue streak
        // (Already counted)
      } else {
        const dayDiff = (new Date(lastDate) - new Date(completedDate)) / (1000 * 60 * 60 * 24);
        if (dayDiff === 1) {
          tempStreak++;
          if (currentStreak === tempStreak - 1) {
            currentStreak = tempStreak;
          }
        } else {
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          tempStreak = 1;
          if (currentStreak > 1) {
            currentStreak = 0; // Streak broken
          }
        }
      }
      lastDate = completedDate;
    });

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    res.json({
      avgCompletionTimeHours: avgCompletionTime / (1000 * 60 * 60), // Convert to hours
      avgTimeByPriority,
      productiveDays,
      streaks: {
        current: currentStreak,
        longest: longestStreak
      },
      period
    });
  } catch (error) {
    console.error('Analytics productivity error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  } finally {
    await prisma.$disconnect();
  }
}; 