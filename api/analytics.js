const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      tasksByPriority,
      tasksByCategory,
      recentTasks
    ] = await Promise.all([
      // Total tasks count
      prisma.task.count(),
      
      // Completed tasks count
      prisma.task.count({ where: { completed: true } }),
      
      // Pending tasks count
      prisma.task.count({ where: { status: 'PENDING' } }),
      
      // In progress tasks count
      prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
      
      // Tasks by priority
      prisma.task.groupBy({
        by: ['priority'],
        _count: true
      }),
      
      // Tasks by category
      prisma.task.groupBy({
        by: ['categoryId'],
        _count: true,
        where: { categoryId: { not: null } }
      }),
      
      // Recent tasks (last 7 days)
      prisma.task.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Format priority data
    const priorityData = [
      { priority: 'LOW', count: 0 },
      { priority: 'MEDIUM', count: 0 },
      { priority: 'HIGH', count: 0 },
      { priority: 'URGENT', count: 0 }
    ];

    tasksByPriority.forEach(item => {
      const index = priorityData.findIndex(p => p.priority === item.priority);
      if (index !== -1) {
        priorityData[index].count = item._count;
      }
    });

    res.status(200).json({
      overview: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        completionRate: Math.round(completionRate * 100) / 100,
        recentTasks
      },
      charts: {
        priorityDistribution: priorityData,
        categoryDistribution: tasksByCategory.map(item => ({
          categoryId: item.categoryId,
          count: item._count
        }))
      },
      timestamp: new Date().toISOString()
    });
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