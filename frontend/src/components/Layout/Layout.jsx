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

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { isDark, toggleTheme } = useTheme()
  const { tasks, categories } = useTask()
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
      path: '/categories',
      icon: FolderOpen,
      label: 'Categories',
      description: 'Organize by category 🗂️',
      count: categories?.length || 0,
      emoji: '📁'
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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isSidebarOpen ? 0 : '-100%',
        }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0"
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
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-md lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700 focus-ring"
          >
            <X className="w-5 h-5" />
          </button>
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700 focus-ring block"
                title="Toggle sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="hidden sm:flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus-ring"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{tasks?.length || 0} total tasks</span>
                <span>•</span>
                <span>{tasks?.filter(t => t.completed)?.length || 0} completed</span>
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