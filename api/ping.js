module.exports = (req, res) => {
  res.status(200).json({ 
    message: 'PING SUCCESS! 🏓', 
    timestamp: new Date().toISOString(),
    method: req.method,
    status: 'No database, no imports, just pure function'
  });
}; 