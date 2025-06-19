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
    const { type = 'overview', period = 'month', granularity = 'day' } = req.query;
    const dateFilter = getDateRangeFilter(period);

    switch (type) {
      case 'overview':
        return await getOverviewData(res, dateFilter, period);
      case 'productivity':
        return await getProductivityData(res, dateFilter, period);
      case 'trends':
        return await getTrendsData(res, dateFilter, period, granularity);
      case 'categories':
        return await getCategoriesData(res, dateFilter, period);
      default:
        return await getOverviewData(res, dateFilter, period);
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  } finally {
    await prisma.$disconnect();
  }
};

// Overview analytics
async function getOverviewData(res, dateFilter, period) {
  // For period-specific data, use date filters
  const [
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    overdueTasks,
    tasksWithDueDate
  ] = await Promise.all([
    prisma.task.count({ where: dateFilter }),
    prisma.task.count({ 
      where: { 
        ...dateFilter, 
        completed: true 
      } 
    }),
    prisma.task.count({ 
      where: { 
        ...dateFilter, 
        status: 'PENDING' 
      } 
    }),
    prisma.task.count({ 
      where: { 
        ...dateFilter, 
        status: 'IN_PROGRESS' 
      } 
    }),
    prisma.task.count({
      where: {
        ...dateFilter,
        dueDate: { lt: new Date() },
        completed: false
      }
    }),
    prisma.task.count({
      where: {
        ...dateFilter,
        dueDate: { not: null }
      }
    })
  ]);

  // Calculate completion rate for the period
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Get priority distribution
  const priorityStats = await prisma.task.groupBy({
    by: ['priority'],
    where: dateFilter,
    _count: {
      id: true
    }
  });

  // Get category distribution
  const categoryStats = await prisma.task.groupBy({
    by: ['categoryId'],
    where: dateFilter,
    _count: {
      id: true
    }
  });

  // Get categories with names
  const categoriesWithCounts = await Promise.all(
    categoryStats.map(async (stat) => {
      if (stat.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: stat.categoryId },
          select: { name: true, color: true, icon: true }
        });
        return {
          category: category?.name || 'Unknown',
          color: category?.color || '#6B7280',
          icon: category?.icon || '📁',
          count: stat._count.id
        };
      }
      return {
        category: 'Uncategorized',
        color: '#6B7280',
        icon: '📝',
        count: stat._count.id
      };
    })
  );

  res.json({
    overview: {
      // Period-specific data (for charts and period analysis)
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      tasksWithDueDate,
      completionRate: Math.round(completionRate * 100) / 100
      
      // NOTE: NO "lifetime" data here - frontend uses localStorage for that!
      // The database only shows current state, not true lifetime including deletions
    },
    priorityDistribution: priorityStats.map(stat => ({
      priority: stat.priority,
      count: stat._count.id
    })),
    categoryDistribution: categoriesWithCounts,
    period
  });
}

// Productivity analytics
async function getProductivityData(res, dateFilter, period) {
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

  // Get most productive days of week
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

  // Get completion streaks
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
    avgCompletionTimeHours: avgCompletionTime / (1000 * 60 * 60),
    avgTimeByPriority,
    productiveDays,
    streaks: {
      current: currentStreak,
      longest: longestStreak
    },
    period
  });
}

// Trends analytics
async function getTrendsData(res, dateFilter, period, granularity) {
  const allTasks = await prisma.task.findMany({
    where: {
      createdAt: dateFilter.createdAt?.gte ? { gte: dateFilter.createdAt.gte } : {}
    },
    select: {
      createdAt: true,
      completedAt: true,
      completed: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const trendsMap = new Map();

  // Process creation trends
  allTasks.forEach(task => {
    const date = new Date(task.createdAt);
    const period = granularity === 'day' 
      ? date.toISOString().split('T')[0] // YYYY-MM-DD
      : `${date.getFullYear()}-W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
    
    if (!trendsMap.has(period)) {
      trendsMap.set(period, { period, created: 0, completed: 0 });
    }
    trendsMap.get(period).created++;
  });

  // Process completion trends
  allTasks.forEach(task => {
    if (task.completed && task.completedAt) {
      const date = new Date(task.completedAt);
      const period = granularity === 'day' 
        ? date.toISOString().split('T')[0] // YYYY-MM-DD
        : `${date.getFullYear()}-W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
      
      if (!trendsMap.has(period)) {
        trendsMap.set(period, { period, created: 0, completed: 0 });
      }
      trendsMap.get(period).completed++;
    }
  });

  const trends = Array.from(trendsMap.values()).sort((a, b) => a.period.localeCompare(b.period));

  res.json({
    trends,
    period,
    granularity
  });
}

// Categories analytics
async function getCategoriesData(res, dateFilter, period) {
  const categories = await prisma.category.findMany({
    include: {
      tasks: {
        where: dateFilter,
        select: {
          completed: true,
          priority: true,
          createdAt: true,
          completedAt: true
        }
      }
    }
  });

  const categoryAnalytics = categories.map(category => {
    const tasks = category.tasks;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Priority distribution
    const priorityDistribution = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    // Average completion time for this category
    const completedWithTimes = tasks.filter(task => task.completed && task.completedAt);
    let avgCompletionTime = 0;
    if (completedWithTimes.length > 0) {
      const totalTime = completedWithTimes.reduce((sum, task) => {
        return sum + (new Date(task.completedAt) - new Date(task.createdAt));
      }, 0);
      avgCompletionTime = totalTime / completedWithTimes.length;
    }

    return {
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
      totalTasks,
      completedTasks,
      completionRate: Math.round(completionRate * 100) / 100,
      priorityDistribution,
      avgCompletionTimeHours: avgCompletionTime / (1000 * 60 * 60)
    };
  });

  res.json({
    categories: categoryAnalytics,
    period
  });
} 