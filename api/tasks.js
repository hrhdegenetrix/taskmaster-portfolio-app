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
          search,
          sortBy = 'dueDate',
          sortOrder = 'asc'
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

        // Build order by clause
        const orderBy = [];
        
        // Always put completed tasks at the end, but allow sorting within groups
        orderBy.push({ completed: 'asc' });
        
        // Add the requested sort
        if (sortBy === 'priority') {
          orderBy.push({ 
            priority: sortOrder === 'asc' ? 'asc' : 'desc'
          });
        } else if (sortBy === 'dueDate') {
          // For dueDate, put null values last when ascending, first when descending
          orderBy.push({ 
            dueDate: { 
              sort: sortOrder === 'asc' ? 'asc' : 'desc',
              nulls: sortOrder === 'asc' ? 'last' : 'first'
            }
          });
        } else if (sortBy === 'position') {
          orderBy.push({ position: sortOrder === 'asc' ? 'asc' : 'desc' });
        } else {
          // Default to createdAt
          orderBy.push({ createdAt: sortOrder === 'asc' ? 'asc' : 'desc' });
        }

        const [tasks, total] = await Promise.all([
          prisma.task.findMany({
            where,
            skip,
            take: limitNum,
            orderBy,
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

        // Transform tasks to include tags properly and mark overdue
        const now = new Date();
        const transformedTasks = tasks.map(task => {
          let finalTask = {
            ...task,
            tags: task.tags.map(taskTag => taskTag.tag)
          };

          // Check if task is overdue and not completed
          if (task.dueDate && !task.completed && new Date(task.dueDate) < now) {
            // Mark as overdue if not already overdue
            if (task.priority !== 'OVERDUE') {
              finalTask.priority = 'OVERDUE';
              finalTask.isAutoOverdue = true; // Flag to indicate auto-assignment
            }
          }

          return finalTask;
        });

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
          tags = []
        } = req.body;

        if (!title) {
          return res.status(400).json({ error: 'Task title is required' });
        }

        // Process due date - set to end of day if no time specified
        let processedDueDate = null;
        if (dueDate) {
          const date = new Date(dueDate);
          // If no time is specified, set to end of day (23:59:59)
          if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0) {
            date.setHours(23, 59, 59, 999);
          }
          processedDueDate = date;
        }

        // Create the task first
        const task = await prisma.task.create({
          data: {
            title: title.trim(),
            description: description?.trim(),
            status: status.toUpperCase(),
            priority: priority.toUpperCase(),
            dueDate: processedDueDate,
            categoryId,
            position: 0
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

        // Add tags if provided
        if (tags.length > 0) {
          await Promise.all(
            tags.map(async (tagId) => {
              return prisma.taskTag.create({
                data: {
                  taskId: task.id,
                  tagId
                }
              });
            })
          );
        }

        // Fetch the complete task with tags
        const completeTask = await prisma.task.findUnique({
          where: { id: task.id },
          include: {
            category: true,
            tags: {
              include: {
                tag: true
              }
            }
          }
        });

        const transformedTask = {
          ...completeTask,
          tags: completeTask.tags.map(tt => tt.tag)
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