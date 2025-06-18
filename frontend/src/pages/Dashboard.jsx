import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus,
  CheckSquare,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  BarChart3,
} from 'lucide-react'
import { useTask } from '../contexts/TaskContext'
import { format, isToday, isTomorrow, isPast } from 'date-fns'

const Dashboard = () => {
  const { tasks, categories, isLoading } = useTask()

  // Calculate statistics
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    overdue: tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !t.completed).length,
    dueToday: tasks.filter(t => t.dueDate && isToday(new Date(t.dueDate)) && !t.completed).length,
    dueTomorrow: tasks.filter(t => t.dueDate && isTomorrow(new Date(t.dueDate)) && !t.completed).length,
  }

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  // Recent tasks (last 5 completed or created)
  const recentTasks = tasks
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5)

  // Upcoming tasks (due soon)
  const upcomingTasks = tasks
    .filter(t => t.dueDate && !t.completed)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5)

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats.total,
      icon: CheckSquare,
      color: 'blue',
      change: '+12%',
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: TrendingUp,
      color: 'green',
      change: `${completionRate}%`,
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'yellow',
      change: '-8%',
    },
    {
      title: 'Overdue',
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'red',
      change: stats.overdue > 0 ? 'Action needed' : 'All good!',
    },
  ]

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      green: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      yellow: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    }
    return colors[color] || colors.blue
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with your tasks.
          </p>
        </div>
        <Link
          to="/tasks"
          className="btn btn-primary btn-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.change}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-soft"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Due Today
          </h3>
          {stats.dueToday > 0 ? (
            <div className="space-y-2">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.dueToday}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tasks due today
              </p>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No tasks due today 🎉
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-soft"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Completion Rate
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {completionRate}%
              </span>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-soft"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Categories
          </h3>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {categories.length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Active categories
            </p>
          </div>
        </motion.div>
      </div>

      {/* Recent & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-soft"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h3>
            <Link
              to="/tasks"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    task.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      task.completed ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'
                    }`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(task.updatedAt), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No recent tasks
              </p>
            )}
          </div>
        </motion.div>

        {/* Upcoming Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-soft"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Due Dates
            </h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => {
                const dueDate = new Date(task.dueDate)
                const isOverdue = isPast(dueDate)
                const isDueToday = isToday(dueDate)
                
                return (
                  <div
                    key={task.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      isOverdue ? 'bg-red-500' : isDueToday ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-gray-900 dark:text-white">
                        {task.title}
                      </p>
                      <p className={`text-xs ${
                        isOverdue ? 'text-red-500' : isDueToday ? 'text-yellow-600' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {isOverdue ? 'Overdue' : isDueToday ? 'Due today' : format(dueDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No upcoming due dates
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard 