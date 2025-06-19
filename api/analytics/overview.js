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
    console.error('Analytics overview error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  } finally {
    await prisma.$disconnect();
  }
}; 