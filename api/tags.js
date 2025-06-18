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
        const tags = await prisma.tag.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { tasks: true }
            }
          }
        });
        
        res.status(200).json(tags);
        break;

      case 'POST':
        const { name, color } = req.body;
        
        if (!name) {
          return res.status(400).json({ error: 'Tag name is required' });
        }

        const newTag = await prisma.tag.create({
          data: {
            name: name.toLowerCase().trim(),
            color: color || '#6B7280'
          }
        });

        res.status(201).json(newTag);
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Tags API error:', error);
    
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