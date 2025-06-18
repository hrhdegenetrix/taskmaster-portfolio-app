module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ 
    message: 'ROOT LEVEL API TEST WORKING!', 
    timestamp: new Date().toISOString() 
  });
}; 