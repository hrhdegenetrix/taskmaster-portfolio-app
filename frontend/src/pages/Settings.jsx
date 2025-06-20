import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings as SettingsIcon, 
  BarChart3, 
  Trash2, 
  Moon, 
  Sun,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useTask } from '../contexts/TaskContext'
import toast from 'react-hot-toast'

const Settings = () => {
  const { isDark, setThemePreference, permanentPreference, resetToPreference } = useTheme()
  const { lifetimeCompleted } = useTask()
  const [isResetting, setIsResetting] = useState(false)
  
  // Check if current theme differs from permanent preference
  const isTemporaryOverride = (isDark ? 'dark' : 'light') !== permanentPreference
  
  // Default show completed tasks setting
  const [defaultShowCompleted, setDefaultShowCompleted] = useState(() => {
    const stored = localStorage.getItem('taskmaster-default-show-completed')
    return stored ? stored === 'true' : false
  })

  const handleResetLifetimeCount = () => {
    if (window.confirm(`Are you sure you want to reset your lifetime completed count from ${lifetimeCompleted} to 0? This can't be undone! 🔄`)) {
      setIsResetting(true)
      
      // Reset in localStorage
      localStorage.setItem('taskmaster-lifetime-completed', '0')
      
      // Reset in context (we'll need to add this action)
      setTimeout(() => {
        window.location.reload() // Simple approach - reload to reset context
        setIsResetting(false)
        toast.success('Lifetime completed count reset! 🔄')
      }, 1000)
    }
  }

  const handleToggleDefaultShowCompleted = () => {
    const newValue = !defaultShowCompleted
    setDefaultShowCompleted(newValue)
    localStorage.setItem('taskmaster-default-show-completed', newValue.toString())
    
    // Dispatch custom event to notify TaskContext immediately
    window.dispatchEvent(new CustomEvent('taskmaster-setting-changed', {
      detail: { setting: 'showCompleted', value: newValue }
    }))
    
    toast.success(
      newValue 
        ? 'Tasks page will now show completed tasks by default! 👁️' 
        : 'Tasks page will now hide completed tasks by default! 🙈'
    )
  }

  const handleToggleThemePreference = () => {
    // Toggle based on permanent preference, not current temporary state
    const newTheme = permanentPreference === 'dark' ? 'light' : 'dark'
    setThemePreference(newTheme)
    toast.success(
      newTheme === 'dark'
        ? 'Dark mode set as default! The app will open in dark mode. 🌙'
        : 'Light mode set as default! The app will open in light mode. ☀️'
    )
  }

  const settingsCards = [
    {
      title: 'Appearance',
      description: 'Customize the look and feel of TaskMaster',
      icon: permanentPreference === 'dark' ? Sun : Moon,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Theme</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Switch between light and dark mode
              </p>
            </div>
            <button
              onClick={handleToggleThemePreference}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                permanentPreference === 'dark' ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  permanentPreference === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 This sets your default theme preference. The app will always open with this theme. You can still use the sidebar toggle for temporary changes during your session.
            </p>
            {isTemporaryOverride && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                  ℹ️ You're currently using a temporary {isDark ? 'dark' : 'light'} theme override. Your permanent preference is <strong>{permanentPreference} mode</strong>.
                </p>
                <button
                  onClick={resetToPreference}
                  className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  Reset to {permanentPreference} mode
                </button>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Task Display',
      description: 'Configure how tasks are displayed by default',
      icon: defaultShowCompleted ? Eye : EyeOff,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Show Completed Tasks</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Default visibility of completed tasks on Tasks page
              </p>
            </div>
            <button
              onClick={handleToggleDefaultShowCompleted}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                defaultShowCompleted ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  defaultShowCompleted ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {defaultShowCompleted 
                ? "👁️ Completed tasks will be visible by default when you visit the Tasks page"
                : "🙈 Completed tasks will be hidden by default when you visit the Tasks page"
              }
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Statistics',
      description: 'Manage your productivity statistics and achievements',
      icon: BarChart3,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Lifetime Completed Count</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Currently: <span className="font-bold text-purple-600">{lifetimeCompleted}</span> tasks completed all time
              </p>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {lifetimeCompleted}
            </div>
          </div>
          
          <button
            onClick={handleResetLifetimeCount}
            disabled={isResetting}
            className={`w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 transform hover:scale-105 ${
              isResetting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isResetting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Reset Completed Task Count
              </>
            )}
          </button>
          
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ⚠️ This will reset your lifetime completed count to 0. This cannot be undone.
          </p>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 via-accent-600 to-fun-600 bg-clip-text text-transparent">
          Settings ⚙️
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
          Customize your TaskMaster experience! 🎨
        </p>
      </div>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {settingsCards.map((card, index) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {card.description}
                  </p>
                </div>
              </div>
              
              {card.content}
            </motion.div>
          )
        })}
      </div>
      
      {/* App Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 via-accent-500 to-fun-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-float">
            <SettingsIcon className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-primary-600 via-accent-600 to-fun-600 bg-clip-text text-transparent mb-2">
            TaskMaster ✨
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            A beautiful task management app built with React, Node.js, and PostgreSQL
          </p>
          <div className="flex flex-col items-center space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>Version 1.0.0</span>
              <span>•</span>
              <span>Portfolio Project for Magdalene Sullivan</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>📧</span>
              <a 
                href="mailto:magda.sullivan@gmail.com" 
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200 font-medium"
              >
                magda.sullivan@gmail.com
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Settings 