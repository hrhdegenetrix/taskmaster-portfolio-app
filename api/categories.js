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
      case 'GET':
        const categories = await prisma.category.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { tasks: true }
            }
          }
        });
        
        res.status(200).json(categories);
        break;

      case 'POST':
        const { name, description, color, icon } = req.body;
        
        if (!name) {
          return res.status(400).json({ error: 'Category name is required' });
        }

        const newCategory = await prisma.category.create({
          data: {
            name,
            description,
            color: color || '#3B82F6',
            icon: icon || '📁'
          }
        });

        res.status(201).json(newCategory);
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Categories API error:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  } finally {
    await prisma.$disconnect();
  }
}; 