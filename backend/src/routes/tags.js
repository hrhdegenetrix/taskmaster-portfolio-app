const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/tags - Get all tags with usage statistics
router.get('/', async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { tasks: true }
        },
        tasks: {
          include: {
            task: {
              select: {
                completed: true,
                status: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Calculate additional statistics for each tag
    const tagsWithStats = tags.map(tag => {
      const totalTasks = tag.tasks.length;
      const completedTasks = tag.tasks.filter(taskTag => taskTag.task.completed).length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
        usageCount: totalTasks,
        completedTaskCount: completedTasks,
        completionRate: Math.round(completionRate * 100) / 100
      };
    });

    res.json(tagsWithStats);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// GET /api/tags/:id - Get a specific tag with associated tasks
router.get('/:id', async (req, res) => {
  try {
    const tag = await prisma.tag.findUnique({
      where: { id: req.params.id },
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
  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({ error: 'Failed to fetch tag' });
  }
});

// POST /api/tags - Create a new tag
router.post('/', async (req, res) => {
  try {
    const {
      name,
      color = '#6B7280'
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    // Check if tag with this name already exists
    const existingTag = await prisma.tag.findUnique({
      where: { name: name.trim().toLowerCase() }
    });

    if (existingTag) {
      return res.status(400).json({ error: 'Tag with this name already exists' });
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.trim().toLowerCase(),
        color
      }
    });

    res.status(201).json({
      ...tag,
      usageCount: 0,
      completedTaskCount: 0,
      completionRate: 0
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Tag with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create tag' });
    }
  }
});

// PUT /api/tags/:id - Update a tag
router.put('/:id', async (req, res) => {
  try {
    const { name, color } = req.body;

    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
      where: { id: req.params.id }
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
      where: { id: req.params.id },
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
  } catch (error) {
    console.error('Error updating tag:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Tag with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update tag' });
    }
  }
});

// DELETE /api/tags/:id - Delete a tag
router.delete('/:id', async (req, res) => {
  try {
    const tag = await prisma.tag.findUnique({
      where: { id: req.params.id },
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
      where: { id: req.params.id }
    });

    res.json({ 
      message: 'Tag deleted successfully',
      affectedTasks: tag._count.tasks
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// GET /api/tags/popular - Get most popular tags
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const popularTags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: {
        tasks: {
          _count: 'desc'
        }
      },
      take: parseInt(limit)
    });

    const tagsWithUsage = popularTags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      usageCount: tag._count.tasks,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt
    }));

    res.json(tagsWithUsage);
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    res.status(500).json({ error: 'Failed to fetch popular tags' });
  }
});

module.exports = router; 