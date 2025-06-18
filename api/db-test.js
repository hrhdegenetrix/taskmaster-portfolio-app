const { Client } = require('pg');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client;
  try {
    // Test direct PostgreSQL connection
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await client.connect();
    console.log('✅ Database connected successfully');

    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    
    await client.end();

    res.status(200).json({
      success: true,
      message: 'Database connection successful! 🎉',
      timestamp: result.rows[0].current_time,
      database_url_exists: !!process.env.DATABASE_URL,
      database_url_prefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'Not set'
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    if (client) {
      try {
        await client.end();
      } catch (endError) {
        console.error('Error closing client:', endError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: error.message,
      code: error.code,
      database_url_exists: !!process.env.DATABASE_URL,
      database_url_prefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'Not set'
    });
  }
}; 