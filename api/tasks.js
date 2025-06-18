const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET': {
        const { 
          page = 1, 
          limit = 50, 
          status, 
          priority, 
          categoryId, 
          completed,
          search 
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const where = {};
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (categoryId) where.categoryId = categoryId;
        if (completed !== undefined) where.completed = completed === 'true';
        if (search) {
          where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ];
        }

        const [tasks, total] = await Promise.all([
          prisma.task.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: [
              { completed: 'asc' },
              { priority: 'desc' },
              { createdAt: 'desc' }
            ],
            include: {
              category: true,
              tags: {
                include: {
                  tag: true
                }
              }
            }
          }),
          prisma.task.count({ where })
        ]);

        // Transform tasks to include tags properly
        const transformedTasks = tasks.map(task => ({
          ...task,
          tags: task.tags.map(taskTag => taskTag.tag)
        }));

        res.status(200).json({
          tasks: transformedTasks,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        });
        break;
      }

      case 'POST': {
        const { 
          title, 
          description, 
          status = 'PENDING',
          priority = 'MEDIUM',
          dueDate,
          categoryId,
          tagIds = []
        } = req.body;

        if (!title) {
          return res.status(400).json({ error: 'Task title is required' });
        }

        // Create task with tags
        const newTask = await prisma.task.create({
          data: {
            title,
            description,
            status,
            priority,
            dueDate: dueDate ? new Date(dueDate) : null,
            categoryId,
            tags: {
              create: tagIds.map(tagId => ({
                tag: { connect: { id: tagId } }
              }))
            }
          },
          include: {
            category: true,
            tags: {
              include: {
                tag: true
              }
            }
          }
        });

        // Transform response
        const transformedTask = {
          ...newTask,
          tags: newTask.tags.map(taskTag => taskTag.tag)
        };

        res.status(201).json(transformedTask);
        break;
      }

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Tasks API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  } finally {
    await prisma.$disconnect();
  }
}; 