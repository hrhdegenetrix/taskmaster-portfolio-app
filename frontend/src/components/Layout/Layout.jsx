import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  CheckSquare,
  FolderOpen,
  BarChart3,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  Search,
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useTask } from '../../contexts/TaskContext'
import UrgentTaskAlert from './UrgentTaskAlert'
import { useNavigate } from 'react-router-dom'

// Global search input component
const GlobalSearchInput = () => {
  const { filters, setFilters } = useTask()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSearch = (value) => {
    setFilters({ search: value })
    // Navigate to tasks page if not already there
    if (location.pathname !== '/tasks') {
      navigate('/tasks')
    }
  }

  return (
    <input
      type="text"
      placeholder="Search tasks..."
      value={filters.search}
      onChange={(e) => handleSearch(e.target.value)}
      className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus-ring"
    />
  )
}

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const { isDark, toggleTheme } = useTheme()
  const { tasks, categories, lifetimeCompleted } = useTask()
  const location = useLocation()

  // Navigation items
  const navItems = [
    {
      path: '/',
      icon: LayoutDashboard,
      label: 'Dashboard',
      description: 'Overview and quick actions 📊',
      emoji: '🏠'
    },
    {
      path: '/tasks',
      icon: CheckSquare,
      label: 'Tasks',
      description: 'Manage your awesome tasks 💪',
      count: tasks?.length || 0,
      emoji: '✅'
    },
    {
      path: '/analytics',
      icon: BarChart3,
      label: 'Analytics',
      description: 'Productivity insights 📈',
      emoji: '📊'
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
      description: 'Customize your experience ⚙️',
      emoji: '⚙️'
    }
  ]

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // Drag handlers for pull-out tab
  const handleDragStart = (e) => {
    e.preventDefault()
    setIsDragging(true)
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    setDragStartX(clientX)
  }

  const handleDragMove = (e) => {
    if (!isDragging) return
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const dragDistance = clientX - dragStartX
    
    // If dragged right more than 50px, open sidebar
    if (dragDistance > 50 && !isSidebarOpen) {
      setIsSidebarOpen(true)
      setIsDragging(false)
    }
    // If dragged left more than 50px, close sidebar  
    else if (dragDistance < -50 && isSidebarOpen) {
      setIsSidebarOpen(false)
      setIsDragging(false)
    }
  }

  const handleDragEnd = (e) => {
    if (isDragging) {
      // If we didn't drag far enough, treat it as a click
      const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX
      const dragDistance = Math.abs(clientX - dragStartX)
      
      if (dragDistance < 10) { // Small distance = click
        toggleSidebar()
      }
    }
    setIsDragging(false)
  }

  // Add global event listeners for drag
  React.useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e) => handleDragMove(e)
      const handleMouseUp = (e) => handleDragEnd(e)
      const handleTouchMove = (e) => handleDragMove(e)
      const handleTouchEnd = (e) => handleDragEnd(e)

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleTouchEnd)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, dragStartX, isSidebarOpen])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={toggleSidebar}
        />
      )}

      {/* Pull-out Tab (Always Visible) */}
      <motion.div
        className="fixed left-0 top-1/2 transform -translate-y-1/2 z-50"
        initial={{ x: -8 }}
        animate={{ x: isSidebarOpen ? -8 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className={`bg-gradient-to-br from-primary-500 via-accent-500 to-fun-500 text-white w-3.5 h-64 rounded-r-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex flex-col items-center justify-between group touch-manipulation ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          title={isSidebarOpen ? "Close menu" : "Open menu (click or drag to toggle)"}
        >
          {/* Top Arrow */}
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              animate={{ rotate: isSidebarOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center"
            >
              <svg 
                className="w-2.5 h-2.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={3} 
                  d={isSidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} 
                />
              </svg>
            </motion.div>
          </div>
          
          {/* MENU Text - Centered */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform rotate-90">
              {isSidebarOpen ? 'CLOSE' : 'MENU'}
            </div>
          </div>
          
          {/* Bottom Arrow */}
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              animate={{ rotate: isSidebarOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center"
            >
              <svg 
                className="w-2.5 h-2.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={3} 
                  d={isSidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} 
                />
              </svg>
            </motion.div>
          </div>
        </button>
      </motion.div>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isSidebarOpen ? 0 : '-100%',
        }}
        className="fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out"
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 via-accent-500 to-fun-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-300 animate-float">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 via-accent-600 to-fun-600 bg-clip-text text-transparent">
                TaskMaster ✨
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Get stuff done! 🚀
              </p>
            </div>
          </div>

        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105
                  ${isActive
                    ? 'bg-gradient-to-r from-primary-50 to-accent-50 text-primary-700 dark:from-primary-900/30 dark:to-accent-900/30 dark:text-primary-300 shadow-lg border-l-4 border-primary-500'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-primary-25 dark:text-gray-300 dark:hover:from-gray-700 dark:hover:to-primary-900/20 hover:shadow-md'
                  }
                `}
              >
                <div className="flex items-center justify-center w-8 h-8 mr-3">
                  <span className="text-lg">{item.emoji}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{item.label}</span>
                    {item.count !== undefined && (
                      <span className={`
                        px-2.5 py-1 text-xs rounded-full font-bold animate-bounce-soft
                        ${isActive
                          ? 'bg-gradient-to-r from-primary-200 to-accent-200 text-primary-800 dark:from-primary-700 dark:to-accent-700 dark:text-primary-200'
                          : 'bg-gradient-to-r from-gray-200 to-primary-200 text-gray-700 dark:from-gray-600 dark:to-primary-600 dark:text-gray-200'
                        }
                      `}>
                        {item.count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                    {item.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-ring"
          >
            {isDark ? (
              <Sun className="w-5 h-5 mr-3" />
            ) : (
              <Moon className="w-5 h-5 mr-3" />
            )}
            Switch to {isDark ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="w-full flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-400" />
                <GlobalSearchInput />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{tasks?.length || 0} total tasks</span>
                <span>•</span>
                <span>{lifetimeCompleted || 0} completed</span>
              </div>
              
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-ring"
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Urgent Task Alert */}
        <UrgentTaskAlert />

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="h-full p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout 