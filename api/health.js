const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      message: 'TaskMaster API is running! 🚀'
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } finally {
    await prisma.$disconnect();
  }
} 