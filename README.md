# 📋 TaskMaster - Modern Task Management App

A beautiful, full-stack task management application built with React, Node.js, and PostgreSQL. Designed for productivity enthusiasts who want more than just a simple to-do list.

![TaskMaster Preview](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=TaskMaster+Preview)

## 🌟 Features

### ✨ Core Functionality
- **Smart Task Management** - Create, edit, delete, and organize tasks
- **Categories & Tags** - Organize tasks with custom categories and searchable tags
- **Priority Levels** - High, Medium, Low priority with visual indicators
- **Due Dates** - Set deadlines with smart notifications
- **Progress Tracking** - Mark tasks as pending, in progress, or completed

### 🎨 Rich Content Support
- **Markdown Formatting** - Rich text support for detailed task descriptions
- **Image Attachments** - Add visual context to your tasks
- **Dark/Light Mode** - Beautiful themes for any time of day
- **Responsive Design** - Seamless experience on desktop and mobile

### 📊 Analytics & Insights
- **Productivity Dashboard** - Track completion rates and patterns
- **Category Analytics** - See which areas need most attention
- **Time Tracking** - Monitor how long tasks take to complete
- **Progress Visualization** - Beautiful charts and progress indicators

### 🔍 Advanced Features
- **Smart Search** - Find tasks by content, tags, or categories
- **Bulk Operations** - Manage multiple tasks at once
- **Export Options** - Export tasks to various formats
- **Keyboard Shortcuts** - Power-user friendly navigation

## 🛠️ Tech Stack

**Frontend:**
- React 18 with hooks and context
- Vite for lightning-fast development
- Tailwind CSS for modern styling
- React Router for navigation
- Axios for API communication

**Backend:**
- Node.js with Express framework
- Prisma ORM for database management
- PostgreSQL for reliable data storage
- JWT authentication (ready for user accounts)
- RESTful API design

**Deployment:**
- Optimized for Vercel deployment
- Environment-based configuration
- Production-ready builds

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (local or cloud)

### Installation

1. **Clone and setup:**
```bash
git clone <your-repo-url>
cd taskmaster
npm run setup
```

2. **Configure database:**
```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit backend/.env with your PostgreSQL connection string
# DATABASE_URL="postgresql://username:password@localhost:5432/taskmaster"
```

3. **Initialize database:**
```bash
npm run db:setup
```

4. **Start development servers:**
```bash
npm run dev
```

Visit http://localhost:3000 to see TaskMaster in action!

## 📁 Project Structure

```
taskmaster/
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── context/       # State management
│   │   ├── utils/         # Helper functions
│   │   └── styles/        # Global styles
│   ├── public/            # Static assets
│   └── package.json
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Express middleware
│   │   ├── utils/         # Backend utilities
│   │   └── index.js       # Server entry point
│   ├── prisma/            # Database schema & migrations
│   │   ├── schema.prisma  # Database schema
│   │   └── migrations/    # Database migrations
│   └── package.json
└── README.md              # This file
```

## 🎯 API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks with filtering
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Analytics
- `GET /api/analytics/overview` - Get productivity overview
- `GET /api/analytics/categories` - Get category-based analytics
- `GET /api/analytics/trends` - Get completion trends

## 🎨 Customization

TaskMaster is built with customization in mind:

- **Themes:** Easy to add new color schemes
- **Categories:** Unlimited custom categories with icons
- **Priority Systems:** Configurable priority levels
- **Date Formats:** Multiple date display options

## 🚀 Deployment

### Vercel Deployment

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Set environment variables:**
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `JWT_SECRET` - Random string for authentication
4. **Deploy!**

The app is optimized for Vercel with automatic frontend builds and serverless backend functions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your portfolio!

## 🎉 Portfolio Impact

This project demonstrates:
- **Full-Stack Development** - Complete frontend and backend implementation
- **Modern React Patterns** - Hooks, context, and component composition
- **Database Design** - Well-structured PostgreSQL schema with Prisma
- **API Development** - RESTful API with proper error handling
- **UI/UX Design** - Beautiful, responsive interface with accessibility
- **DevOps** - Production deployment and environment management

Perfect for showcasing technical skills in job applications! 🌟 