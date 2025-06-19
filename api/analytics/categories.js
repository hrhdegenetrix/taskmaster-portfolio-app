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
    console.error('Analytics categories error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  } finally {
    await prisma.$disconnect();
  }
}; 