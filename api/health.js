// Simple health check without database first
module.exports = async (req, res) => {
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

  // Simple response first - test if endpoint works
  res.status(200).json({ 
    status: 'healthy', 
    message: 'TaskMaster API is running! 🚀',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoint: '/api/health'
  });
}; 