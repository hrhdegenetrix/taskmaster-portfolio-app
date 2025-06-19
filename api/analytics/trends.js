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
    const { period = 'week', granularity = 'day' } = req.query;
    const dateFilter = getDateRangeFilter(period);
    
    // Get all tasks for trend analysis
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

    // Simple daily aggregation for serverless compatibility
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
  } catch (error) {
    console.error('Analytics trends error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  } finally {
    await prisma.$disconnect();
  }
}; 