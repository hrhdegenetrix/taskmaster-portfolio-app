const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Task ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET': {
        const task = await prisma.task.findUnique({
          where: { id },
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
        break;
      }

      case 'PUT': {
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

        // Check if task exists
        const existingTask = await prisma.task.findUnique({
          where: { id }
        });

        if (!existingTask) {
          return res.status(404).json({ error: 'Task not found' });
        }

        // Prepare update data
        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description?.trim();
        if (status !== undefined) updateData.status = status.toUpperCase();
        if (priority !== undefined) updateData.priority = priority.toUpperCase();
        if (dueDate !== undefined) {
          if (dueDate) {
            const date = new Date(dueDate);
            // If no time is specified, set to end of day (23:59:59)
            if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0) {
              date.setHours(23, 59, 59, 999);
            }
            updateData.dueDate = date;
          } else {
            updateData.dueDate = null;
          }
        }
        if (completed !== undefined) {
          updateData.completed = completed;
          if (completed && !existingTask.completed) {
            updateData.completedAt = new Date();
            updateData.status = 'COMPLETED';
          } else if (!completed && existingTask.completed) {
            updateData.completedAt = null;
            updateData.status = 'PENDING';
          }
        }
        if (categoryId !== undefined) updateData.categoryId = categoryId;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        if (position !== undefined) updateData.position = parseInt(position);

        // Update the task
        const updatedTask = await prisma.task.update({
          where: { id },
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
            where: { taskId: id }
          });

          // Add new tags
          if (tags.length > 0) {
            await Promise.all(
              tags.map(tagId =>
                prisma.taskTag.create({
                  data: {
                    taskId: id,
                    tagId
                  }
                })
              )
            );
          }

          // Fetch updated task with new tags
          const taskWithTags = await prisma.task.findUnique({
            where: { id },
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
        break;
      }

      case 'DELETE': {
        const task = await prisma.task.findUnique({
          where: { id }
        });

        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }

        await prisma.task.delete({
          where: { id }
        });

        res.json({ message: 'Task deleted successfully' });
        break;
      }

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Task API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  } finally {
    await prisma.$disconnect();
  }
}; 