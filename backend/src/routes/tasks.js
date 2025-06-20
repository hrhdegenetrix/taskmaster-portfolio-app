const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Helper function to parse query parameters
const parseFilters = (query) => {
  const filters = {};
  
  if (query.status) {
    filters.status = query.status.toUpperCase();
  }
  
  if (query.priority) {
    filters.priority = query.priority.toUpperCase();
  }
  
  if (query.category) {
    filters.categoryId = query.category;
  }
  
  if (query.completed !== undefined) {
    filters.completed = query.completed === 'true';
  }
  
  if (query.search) {
    filters.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } }
    ];
  }
  
  return filters;
};

// GET /api/tasks - Get all tasks with filtering and sorting
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const filters = parseFilters(req.query);
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    // Build order by clause
    const orderBy = {};
    if (sortBy === 'priority') {
      orderBy.priority = sortOrder === 'asc' ? 'asc' : 'desc';
    } else if (sortBy === 'dueDate') {
      // Handle null due dates properly with multiple sort fields
      orderBy = [
        { dueDate: sortOrder === 'asc' ? 'asc' : 'desc' },
        { createdAt: 'asc' } // Secondary sort by creation date for tasks with same/null due dates
      ];
    } else if (sortBy === 'position') {
      orderBy.position = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = sortOrder === 'asc' ? 'asc' : 'desc';
    }

    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where: filters,
        include: {
          category: true,
          tags: {
            include: {
              tag: true
            }
          }
        },
        orderBy,
        skip,
        take
      }),
      prisma.task.count({ where: filters })
    ]);

    // Transform the data for easier frontend consumption
    const transformedTasks = tasks.map(task => ({
      ...task,
      tags: task.tags.map(tt => tt.tag)
    }));

    res.json({
      tasks: transformedTasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - Get a specific task
router.get('/:id', async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Transform the data
    const transformedTask = {
      ...task,
      tags: task.tags.map(tt => tt.tag)
    };

    res.json(transformedTask);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks - Create a new task
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      status = 'PENDING',
      priority = 'MEDIUM',
      dueDate,
      categoryId,
      tags = [],
      imageUrl,
      position = 0
    } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Task title is required' });
    }

    // Process due date - frontend sends properly formatted datetime
    let processedDueDate = null;
    if (dueDate) {
      console.log('Creating task with dueDate:', dueDate);
      processedDueDate = new Date(dueDate);
      console.log('Parsed as:', processedDueDate.toISOString());
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        status: status.toUpperCase(),
        priority: priority.toUpperCase(),
        dueDate: processedDueDate,
        categoryId,
        imageUrl,
        position: parseInt(position)
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
      const tagConnections = await Promise.all(
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
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      completed,
      categoryId,
      tags,
      imageUrl,
      position
    } = req.body;

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body cannot be empty' });
    }

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: req.params.id }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Allow all edits on tasks, including overdue ones
    // Users should be able to fix overdue tasks however they want

    // Validate status and priority values
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

    if (status !== undefined && status !== null && !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}` });
    }

    // Handle the special case where frontend might send "OVERDUE" priority
    if (priority !== undefined && priority !== null) {
      if (priority.toUpperCase() === 'OVERDUE') {
        // Convert OVERDUE to HIGH priority (since overdue tasks are important)
        console.log('Converting OVERDUE priority to HIGH');
        priority = 'HIGH';
      } else if (!validPriorities.includes(priority.toUpperCase())) {
        return res.status(400).json({ error: `Invalid priority: ${priority}. Must be one of: ${validPriorities.join(', ')}` });
      }
    }

    // Prepare update data
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (status !== undefined) updateData.status = status.toUpperCase();
    if (priority !== undefined) updateData.priority = priority.toUpperCase();
    if (dueDate !== undefined) {
      if (dueDate) {
        // Store the date string directly without timezone conversion
        // Frontend sends properly formatted datetime strings
        console.log('Received dueDate:', dueDate);
        const parsedDate = new Date(dueDate);
        console.log('Parsed date:', parsedDate.toISOString());
        updateData.dueDate = parsedDate;
      } else {
        updateData.dueDate = null;
      }
    }
    // Handle completed status changes intelligently
    if (completed !== undefined) {
      updateData.completed = completed;
      if (completed && !existingTask.completed) {
        updateData.completedAt = new Date();
        // Only set status to COMPLETED if no explicit status was provided
        if (status === undefined) {
          updateData.status = 'COMPLETED';
        }
      } else if (!completed && existingTask.completed) {
        updateData.completedAt = null;
        // Only set status to PENDING if no explicit status was provided
        if (status === undefined) {
          updateData.status = 'PENDING';
        }
      }
    }
    
    // Ensure status and completed fields are consistent
    if (status !== undefined) {
      const newStatus = status.toUpperCase();
      if (newStatus === 'COMPLETED') {
        updateData.completed = true;
        updateData.completedAt = new Date();
      } else if (completed === undefined) {
        // Only update completed if it wasn't explicitly set
        if (newStatus === 'PENDING' || newStatus === 'IN_PROGRESS' || newStatus === 'CANCELLED') {
          updateData.completed = false;
          updateData.completedAt = null;
        }
      }
    }
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (position !== undefined) updateData.position = parseInt(position);

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        category: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    // Update tags if provided
    if (tags !== undefined) {
      // Remove existing tags
      await prisma.taskTag.deleteMany({
        where: { taskId: req.params.id }
      });

      // Add new tags
      if (tags.length > 0) {
        await Promise.all(
          tags.map(tagId =>
            prisma.taskTag.create({
              data: {
                taskId: req.params.id,
                tagId
              }
            })
          )
        );
      }

      // Fetch updated task with new tags
      const taskWithTags = await prisma.task.findUnique({
        where: { id: req.params.id },
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
        ...taskWithTags,
        tags: taskWithTags.tags.map(tt => tt.tag)
      };

      return res.json(transformedTask);
    }

    const transformedTask = {
      ...updatedTask,
      tags: updatedTask.tags.map(tt => tt.tag)
    };

    res.json(transformedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    console.error('Request body:', req.body);
    console.error('Task ID:', req.params.id);
    console.error('Full error:', error.message);
    console.error('Error stack:', error.stack);
    
    // Send more specific error information
    res.status(500).json({ 
      error: 'Failed to update task',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// POST /api/tasks/bulk - Bulk operations on tasks
router.post('/bulk', async (req, res) => {
  try {
    const { action, taskIds, updateData } = req.body;

    if (!action || !taskIds || !Array.isArray(taskIds)) {
      return res.status(400).json({ error: 'Invalid bulk operation data' });
    }

    let result;

    switch (action) {
      case 'delete':
        result = await prisma.task.deleteMany({
          where: { id: { in: taskIds } }
        });
        break;

      case 'complete':
        result = await prisma.task.updateMany({
          where: { id: { in: taskIds } },
          data: {
            completed: true,
            completedAt: new Date(),
            status: 'COMPLETED'
          }
        });
        break;

      case 'uncomplete':
        result = await prisma.task.updateMany({
          where: { id: { in: taskIds } },
          data: {
            completed: false,
            completedAt: null,
            status: 'PENDING'
          }
        });
        break;

      case 'update':
        if (!updateData) {
          return res.status(400).json({ error: 'Update data is required for bulk update' });
        }
        result = await prisma.task.updateMany({
          where: { id: { in: taskIds } },
          data: updateData
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid bulk action' });
    }

    res.json({ 
      message: `Bulk ${action} completed successfully`,
      affectedCount: result.count
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    res.status(500).json({ error: 'Failed to perform bulk operation' });
  }
});

module.exports = router; 