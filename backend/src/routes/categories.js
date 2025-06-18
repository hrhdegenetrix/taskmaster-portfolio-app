const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/categories - Get all categories with task counts
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { tasks: true }
        },
        tasks: {
          select: {
            completed: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Calculate additional statistics for each category
    const categoriesWithStats = categories.map(category => {
      const completedTasks = category.tasks.filter(task => task.completed).length;
      const totalTasks = category.tasks.length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        icon: category.icon,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        taskCount: totalTasks,
        completedTaskCount: completedTasks,
        completionRate: Math.round(completionRate * 100) / 100
      };
    });

    res.json(categoriesWithStats);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/:id - Get a specific category with tasks
router.get('/:id', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        tasks: {
          include: {
            tags: {
              include: {
                tag: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: { tasks: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Transform tasks data
    const transformedTasks = category.tasks.map(task => ({
      ...task,
      tags: task.tags.map(tt => tt.tag)
    }));

    res.json({
      ...category,
      tasks: transformedTasks
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// POST /api/categories - Create a new category
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      color = '#3B82F6',
      icon = '📁'
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if category with this name already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name: name.trim() }
    });

    if (existingCategory) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        color,
        icon
      }
    });

    res.status(201).json({
      ...category,
      taskCount: 0,
      completedTaskCount: 0,
      completionRate: 0
    });
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Category with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
});

// PUT /api/categories/:id - Update a category
router.put('/:id', async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: req.params.id }
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if new name conflicts with existing category (if name is being changed)
    if (name && name.trim() !== existingCategory.name) {
      const nameConflict = await prisma.category.findUnique({
        where: { name: name.trim() }
      });

      if (nameConflict) {
        return res.status(400).json({ error: 'Category with this name already exists' });
      }
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;

    const updatedCategory = await prisma.category.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        _count: {
          select: { tasks: true }
        },
        tasks: {
          select: {
            completed: true
          }
        }
      }
    });

    // Calculate statistics
    const completedTasks = updatedCategory.tasks.filter(task => task.completed).length;
    const totalTasks = updatedCategory.tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    res.json({
      id: updatedCategory.id,
      name: updatedCategory.name,
      description: updatedCategory.description,
      color: updatedCategory.color,
      icon: updatedCategory.icon,
      createdAt: updatedCategory.createdAt,
      updatedAt: updatedCategory.updatedAt,
      taskCount: totalTasks,
      completedTaskCount: completedTasks,
      completionRate: Math.round(completionRate * 100) / 100
    });
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Category with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update category' });
    }
  }
});

// DELETE /api/categories/:id - Delete a category
router.delete('/:id', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { tasks: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has tasks
    if (category._count.tasks > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with existing tasks. Please move or delete all tasks first.' 
      });
    }

    await prisma.category.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router; 