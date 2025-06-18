const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'TaskMaster API is running! 🚀',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Hello from Express on Vercel! 👋',
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Categories endpoint (placeholder)
app.get('/categories', (req, res) => {
  res.json([
    { id: 1, name: 'Work', icon: '💼', color: '#3B82F6' },
    { id: 2, name: 'Personal', icon: '🏠', color: '#10B981' },
    { id: 3, name: 'Learning', icon: '📚', color: '#8B5CF6' },
    { id: 4, name: 'Health', icon: '🏥', color: '#EF4444' }
  ]);
});

// Tags endpoint (placeholder)
app.get('/tags', (req, res) => {
  res.json([
    { id: 1, name: 'urgent', color: '#EF4444' },
    { id: 2, name: 'important', color: '#F59E0B' },
    { id: 3, name: 'quick', color: '#10B981' }
  ]);
});

// Tasks endpoint (placeholder)
app.get('/tasks', (req, res) => {
  res.json({
    tasks: [
      {
        id: 1,
        title: 'Welcome to TaskMaster! 🎉',
        description: 'This is a sample task. Your app is working!',
        priority: 'MEDIUM',
        status: 'PENDING',
        completed: false,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        category: { id: 1, name: 'Work', icon: '💼' },
        tags: [{ id: 1, name: 'urgent', color: '#EF4444' }]
      }
    ],
    pagination: {
      page: 1,
      limit: 50,
      total: 1,
      pages: 1
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

module.exports = app; 