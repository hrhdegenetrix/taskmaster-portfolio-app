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
    return res.status(400).json({ error: 'Tag ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET': {
        const tag = await prisma.tag.findUnique({
          where: { id },
          include: {
            tasks: {
              include: {
                task: {
                  include: {
                    category: true,
                    tags: {
                      include: {
                        tag: true
                      }
                    }
                  }
                }
              }
            },
            _count: {
              select: { tasks: true }
            }
          }
        });

        if (!tag) {
          return res.status(404).json({ error: 'Tag not found' });
        }

        // Transform the data to include full task information
        const transformedTasks = tag.tasks.map(taskTag => ({
          ...taskTag.task,
          tags: taskTag.task.tags.map(tt => tt.tag)
        }));

        res.json({
          ...tag,
          tasks: transformedTasks
        });
        break;
      }

      case 'PUT': {
        const { name, color } = req.body;

        // Check if tag exists
        const existingTag = await prisma.tag.findUnique({
          where: { id }
        });

        if (!existingTag) {
          return res.status(404).json({ error: 'Tag not found' });
        }

        // Check if new name conflicts with existing tag (if name is being changed)
        if (name && name.trim().toLowerCase() !== existingTag.name) {
          const nameConflict = await prisma.tag.findUnique({
            where: { name: name.trim().toLowerCase() }
          });

          if (nameConflict) {
            return res.status(400).json({ error: 'Tag with this name already exists' });
          }
        }

        // Prepare update data
        const updateData = {};
        if (name !== undefined) updateData.name = name.trim().toLowerCase();
        if (color !== undefined) updateData.color = color;

        const updatedTag = await prisma.tag.update({
          where: { id },
          data: updateData,
          include: {
            _count: {
              select: { tasks: true }
            },
            tasks: {
              include: {
                task: {
                  select: {
                    completed: true
                  }
                }
              }
            }
          }
        });

        // Calculate statistics
        const totalTasks = updatedTag.tasks.length;
        const completedTasks = updatedTag.tasks.filter(taskTag => taskTag.task.completed).length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        res.json({
          id: updatedTag.id,
          name: updatedTag.name,
          color: updatedTag.color,
          createdAt: updatedTag.createdAt,
          updatedAt: updatedTag.updatedAt,
          usageCount: totalTasks,
          completedTaskCount: completedTasks,
          completionRate: Math.round(completionRate * 100) / 100
        });
        break;
      }

      case 'DELETE': {
        const tag = await prisma.tag.findUnique({
          where: { id },
          include: {
            _count: {
              select: { tasks: true }
            }
          }
        });

        if (!tag) {
          return res.status(404).json({ error: 'Tag not found' });
        }

        await prisma.tag.delete({
          where: { id }
        });

        res.json({ 
          message: 'Tag deleted successfully',
          affectedTasks: tag._count.tasks
        });
        break;
      }

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Tag API error:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Tag name already exists' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  } finally {
    await prisma.$disconnect();
  }
}; 