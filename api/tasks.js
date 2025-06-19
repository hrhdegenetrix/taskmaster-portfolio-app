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

        // Fetch all tasks first, then sort in JavaScript to handle completed task logic properly
        const [allTasks, total] = await Promise.all([
          prisma.task.findMany({
            where,
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
        const transformedTasks = allTasks.map(task => {
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

        // Custom sorting: completed tasks always go last, ignoring their due dates
        const sortedTasks = transformedTasks.sort((a, b) => {
          // First, sort by completion status - incomplete tasks first
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1; // false (incomplete) comes before true (completed)
          }

          // Within the same completion status, sort by the requested criteria
          if (sortBy === 'priority') {
            const priorities = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'OVERDUE': 4 };
            const aPriority = priorities[a.priority] || 0;
            const bPriority = priorities[b.priority] || 0;
            return sortOrder === 'asc' ? aPriority - bPriority : bPriority - aPriority;
          } else if (sortBy === 'dueDate') {
            // For completed tasks, ignore due date and sort by updatedAt instead
            if (a.completed && b.completed) {
              const aDate = new Date(a.updatedAt);
              const bDate = new Date(b.updatedAt);
              return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
            }
            // For incomplete tasks, sort by due date normally
            const aDate = a.dueDate ? new Date(a.dueDate) : null;
            const bDate = b.dueDate ? new Date(b.dueDate) : null;
            
            if (!aDate && !bDate) return 0;
            if (!aDate) return sortOrder === 'asc' ? 1 : -1; // null dates go last when asc
            if (!bDate) return sortOrder === 'asc' ? -1 : 1;
            
            return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
          } else if (sortBy === 'position') {
            return sortOrder === 'asc' ? a.position - b.position : b.position - a.position;
          } else {
            // Default to createdAt
            const aDate = new Date(a.createdAt);
            const bDate = new Date(b.createdAt);
            return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
          }
        });

        // Apply pagination after sorting
        const paginatedTasks = sortedTasks.slice(skip, skip + limitNum);

        // Debug logging
        console.log('\n🔍 TASK SORTING DEBUG:')
        console.log('📊 Sort request:', { sortBy, sortOrder })
        console.log('📋 Total tasks before sorting:', allTasks.length)
        console.log('✅ Completed tasks:', allTasks.filter(t => t.completed).length)
        console.log('⭐ First 3 tasks BEFORE sorting:', 
          allTasks.slice(0, 3).map(t => ({
            title: t.title,
            completed: t.completed,
            priority: t.priority,
            dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : 'null'
          }))
        )
        console.log('🎯 First 3 tasks AFTER sorting:', 
          sortedTasks.slice(0, 3).map(t => ({
            title: t.title,
            completed: t.completed,
            priority: t.priority,
            dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : 'null'
          }))
        )
        console.log('📄 Paginated result (first 3):', 
          paginatedTasks.slice(0, 3).map(t => ({
            title: t.title,
            completed: t.completed,
            priority: t.priority,
            dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : 'null'
          }))
        )

        res.status(200).json({
          tasks: paginatedTasks,
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