const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
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

// GET /api/analytics/overview - Get productivity overview
router.get('/overview', async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    const dateFilter = getDateRangeFilter(period);

    // Get basic task statistics
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

    // Calculate completion rate
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
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        overdueTasks,
        tasksWithDueDate,
        completionRate: Math.round(completionRate * 100) / 100
      },
      priorityDistribution: priorityStats.map(stat => ({
        priority: stat.priority,
        count: stat._count.id
      })),
      categoryDistribution: categoriesWithCounts,
      period
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

// GET /api/analytics/trends - Get completion trends over time
router.get('/trends', async (req, res) => {
  try {
    const { period = 'week', granularity = 'day' } = req.query;
    
    let dateFormat;
    let groupBy;
    
    // Configure date grouping based on granularity
    switch (granularity) {
      case 'hour':
        dateFormat = 'YYYY-MM-DD HH24:00:00';
        groupBy = 'hour';
        break;
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        groupBy = 'day';
        break;
      case 'week':
        dateFormat = 'YYYY-"W"WW';
        groupBy = 'week';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        groupBy = 'month';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
        groupBy = 'day';
    }

    const dateFilter = getDateRangeFilter(period);
    
    // Get task creation trends
    const creationTrends = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC(${groupBy}, "createdAt"), ${dateFormat}) as period,
        COUNT(*) as created_count
      FROM "tasks"
      WHERE "createdAt" >= ${dateFilter.createdAt?.gte || new Date('2000-01-01')}
      GROUP BY DATE_TRUNC(${groupBy}, "createdAt")
      ORDER BY DATE_TRUNC(${groupBy}, "createdAt")
    `;

    // Get task completion trends
    const completionTrends = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC(${groupBy}, "completedAt"), ${dateFormat}) as period,
        COUNT(*) as completed_count
      FROM "tasks"
      WHERE "completedAt" >= ${dateFilter.createdAt?.gte || new Date('2000-01-01')}
        AND "completedAt" IS NOT NULL
      GROUP BY DATE_TRUNC(${groupBy}, "completedAt")
      ORDER BY DATE_TRUNC(${groupBy}, "completedAt")
    `;

    // Merge creation and completion data
    const trendsMap = new Map();
    
    creationTrends.forEach(item => {
      trendsMap.set(item.period, {
        period: item.period,
        created: parseInt(item.created_count),
        completed: 0
      });
    });

    completionTrends.forEach(item => {
      const existing = trendsMap.get(item.period) || { period: item.period, created: 0, completed: 0 };
      existing.completed = parseInt(item.completed_count);
      trendsMap.set(item.period, existing);
    });

    const trends = Array.from(trendsMap.values()).sort((a, b) => a.period.localeCompare(b.period));

    res.json({
      trends,
      period,
      granularity
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// GET /api/analytics/productivity - Get productivity metrics
router.get('/productivity', async (req, res) => {
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

    // Get most productive days of week
    const tasksByDayOfWeek = await prisma.$queryRaw`
      SELECT 
        EXTRACT(DOW FROM "completedAt") as day_of_week,
        COUNT(*) as completed_count
      FROM "tasks"
      WHERE "completedAt" >= ${dateFilter.createdAt?.gte || new Date('2000-01-01')}
        AND "completedAt" IS NOT NULL
      GROUP BY EXTRACT(DOW FROM "completedAt")
      ORDER BY completed_count DESC
    `;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const productiveDays = tasksByDayOfWeek.map(item => ({
      day: dayNames[parseInt(item.day_of_week)],
      completedTasks: parseInt(item.completed_count)
    }));

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
    console.error('Error fetching productivity metrics:', error);
    res.status(500).json({ error: 'Failed to fetch productivity metrics' });
  }
});

// GET /api/analytics/categories - Get category-specific analytics
router.get('/categories', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const dateFilter = getDateRangeFilter(period);

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
  } catch (error) {
    console.error('Error fetching category analytics:', error);
    res.status(500).json({ error: 'Failed to fetch category analytics' });
  }
});

module.exports = router; 