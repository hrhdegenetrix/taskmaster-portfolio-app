import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Filter,
  CheckSquare,
  Square,
  Calendar,
  Tag,
  FolderOpen,
  AlertCircle,
  Clock,
  Edit3,
  Trash2,
  Star,
  MoreHorizontal
} from 'lucide-react'
import { useTask } from '../contexts/TaskContext'
import { useTheme } from '../contexts/ThemeContext'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import TaskForm from '../components/Forms/TaskForm'
import ConfirmModal from '../components/Layout/ConfirmModal'
import { taskService } from '../services/api'
import { useMutation } from 'react-query'
import toast from 'react-hot-toast'

const Tasks = () => {
  const {
    tasks,
    allTasks,
    categories,
    tags,
    filters,
    setFilters,
    sort,
    setSort,
    viewMode,
    setViewMode,
    selectedTasks,
    toggleTaskSelection,
    showCompleted,
    toggleShowCompleted,
    incrementLifetimeCompleted,
    lifetimeCompleted,
    isLoading,
    invalidateQueries
  } = useTask()
  
  const { isDark } = useTheme()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  
  // Confirmation modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    task: null,
    onConfirm: null
  })

  // Toggle task completion mutation
  const toggleCompletionMutation = useMutation(
    ({ taskId, completed, status }) => taskService.updateTask(taskId, { 
      completed, 
      status,
      completedAt: completed ? new Date().toISOString() : null
    }),
    {
      onSuccess: () => {
        toast.success('Task updated! 🎉')
        invalidateQueries()
      },
      onError: (error) => {
        // Check if it's an overdue task error
        if (error?.response?.data?.code === 'TASK_OVERDUE') {
          toast.error(error.response.data.error)
        } else {
          toast.error('Failed to update task 😕')
        }
      }
    }
  )

  // Delete task mutation
  const deleteTaskMutation = useMutation(
    (taskId) => taskService.deleteTask(taskId),
    {
      onSuccess: () => {
        toast.success('Task deleted! 🗑️')
        invalidateQueries()
      },
      onError: () => toast.error('Failed to delete task 😕')
    }
  )

  // Delete all completed tasks mutation
  const deleteAllCompletedMutation = useMutation(
    async () => {
      const completedTasks = allTasks.filter(t => t.completed)
      // Note: We don't decrement lifetime completed count when deleting tasks
      // Lifetime count only tracks total completions, not current state
      await Promise.all(completedTasks.map(task => taskService.deleteTask(task.id)))
    },
    {
      onSuccess: () => {
        toast.success('All completed tasks deleted! 🧹')
        invalidateQueries()
      },
      onError: () => toast.error('Failed to delete completed tasks 😕')
    }
  )

  // Handle task completion toggle
  const handleToggleCompletion = (task) => {
    const newCompleted = !task.completed
    const newStatus = newCompleted ? 'COMPLETED' : (task.status === 'COMPLETED' ? 'PENDING' : task.status)
    
    // Increment lifetime completed counter when marking as completed (not when uncompleting)
    if (newCompleted && !task.completed) {
      incrementLifetimeCompleted()
    }
    
    toggleCompletionMutation.mutate({
      taskId: task.id,
      completed: newCompleted,
      status: newStatus
    })
  }

  // Handle task deletion with confirmation
  const handleDeleteTask = (task) => {
    setConfirmModal({
      isOpen: true,
      type: 'deleteTask',
      task,
      onConfirm: () => {
        deleteTaskMutation.mutate(task.id)
        setConfirmModal({ isOpen: false, type: null, task: null, onConfirm: null })
      }
    })
  }

  // Handle delete all completed tasks
  const handleDeleteAllCompleted = () => {
    const completedCount = allTasks.filter(t => t.completed).length
    if (completedCount === 0) return
    
    setConfirmModal({
      isOpen: true,
      type: 'deleteAllCompleted',
      task: null,
      onConfirm: () => {
        deleteAllCompletedMutation.mutate()
        setConfirmModal({ isOpen: false, type: null, task: null, onConfirm: null })
      }
    })
  }

  // Close confirmation modal
  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, type: null, task: null, onConfirm: null })
  }

  // Priority colors (dark mode optimized)
  const getPriorityColor = (priority, isDarkMode = false) => {
    const lightColors = {
      OVERDUE: 'from-red-700 to-red-800',
      URGENT: 'from-red-500 to-red-600',
      HIGH: 'from-orange-500 to-orange-600',
      MEDIUM: 'from-blue-500 to-blue-600',
      LOW: 'from-green-500 to-green-600'
    }
    
    const darkColors = {
      OVERDUE: 'from-red-900 to-red-950',
      URGENT: 'from-red-700 to-red-800',
      HIGH: 'from-orange-700 to-orange-800',
      MEDIUM: 'from-blue-700 to-blue-800',
      LOW: 'from-green-700 to-green-800'
    }
    
    const colors = isDarkMode ? darkColors : lightColors
    return colors[priority] || colors.MEDIUM
  }

  // Status colors
  const getStatusColor = (status, completed) => {
    if (completed) return 'from-green-500 to-green-600'
    const colors = {
      PENDING: 'from-gray-500 to-gray-600',
      IN_PROGRESS: 'from-blue-500 to-blue-600',
      COMPLETED: 'from-green-500 to-green-600',
      CANCELLED: 'from-red-500 to-red-600'
    }
    return colors[status] || colors.PENDING
  }

  // Task due date display
  const getDueDateDisplay = (dueDate) => {
    if (!dueDate) return null
    const date = new Date(dueDate)
    
    // For date-only tasks, consider them due at end of day
    // Set the comparison time to end of today (23:59:59)
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)
    
    const hasTime = date.getHours() !== 23 || date.getMinutes() !== 59 || date.getSeconds() !== 59;
    
    if (isToday(date)) {
      if (hasTime) {
        return { text: `Due today at ${format(date, 'h:mm a')}`, color: 'text-orange-600', emoji: '⚡' }
      }
      return { text: 'Due today', color: 'text-orange-600', emoji: '⚡' }
    }
    
    if (isTomorrow(date)) {
      if (hasTime) {
        return { text: `Due tomorrow at ${format(date, 'h:mm a')}`, color: 'text-yellow-600', emoji: '⏰' }
      }
      return { text: 'Due tomorrow', color: 'text-yellow-600', emoji: '⏰' }
    }
    
    // Only mark as overdue if the date is actually past (not just today)
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    if (date < startOfToday) return { text: 'Overdue', color: 'text-red-600', emoji: '🚨' }
    
    return { 
      text: hasTime ? format(date, 'MMM dd, h:mm a') : format(date, 'MMM dd'), 
      color: 'text-gray-600 dark:text-gray-400', 
      emoji: '📅' 
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading your awesome tasks... ✨</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 via-accent-600 to-fun-600 bg-clip-text text-transparent">
            Tasks ✅
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
            Manage your awesome tasks and get stuff done! 💪
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-primary-500 via-accent-500 to-fun-500 text-white px-6 py-3 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-bounce-soft"
        >
          <Plus className="w-5 h-5 mr-2 inline" />
          Create New Task ✨
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search your amazing tasks... 🔍"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
            className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Status 📋</option>
            <option value="PENDING">Pending ⏳</option>
            <option value="IN_PROGRESS">In Progress 🚀</option>
            <option value="COMPLETED">Completed ✅</option>
            <option value="CANCELLED">Cancelled ❌</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ priority: e.target.value })}
            className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Priority 🎯</option>
            <option value="OVERDUE">Overdue 💀</option>
            <option value="URGENT">Urgent 🚨</option>
            <option value="HIGH">High 🔥</option>
            <option value="MEDIUM">Medium ⚡</option>
            <option value="LOW">Low 🌱</option>
          </select>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => setFilters({ category: e.target.value })}
            className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Categories 📁</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* View Mode Toggle & Sorting */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">View:</span>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-md'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                📋 List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-md'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                🔲 Grid
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sort by:</span>
            <select
              value={`${sort.field}-${sort.order}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSort(field, order)
              }}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="dueDate-asc">📅 Due Date (Earliest)</option>
              <option value="dueDate-desc">📅 Due Date (Latest)</option>
              <option value="priority-desc">🔥 Priority (High to Low)</option>
              <option value="priority-asc">🔥 Priority (Low to High)</option>
              <option value="createdAt-desc">🕒 Recently Added</option>
              <option value="createdAt-asc">🕒 Oldest First</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Show Completed Toggle */}
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={toggleShowCompleted}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 transition-all duration-200"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors duration-200">
                Show completed tasks
              </span>
            </label>
            
            {/* Completed Tasks Status/Action */}
            {allTasks.filter(t => t.completed).length > 0 && (
              showCompleted ? (
                <button
                  onClick={handleDeleteAllCompleted}
                  disabled={deleteAllCompletedMutation.isLoading}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-all duration-200 transform hover:scale-105 bg-red-100 text-red-700 hover:bg-red-200 ${deleteAllCompletedMutation.isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title="Delete all completed tasks"
                >
                  {deleteAllCompletedMutation.isLoading ? (
                    'Deleting...'
                  ) : (
                    `Delete all ${allTasks.filter(t => t.completed).length} 🗑️`
                  )}
                </button>
              ) : (
                <span
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium"
                  title={`${allTasks.filter(t => t.completed).length} completed tasks are hidden`}
                >
                  {allTasks.filter(t => t.completed).length} hidden
                </span>
              )
            )}
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{showCompleted ? allTasks.length : tasks.length}</span> tasks shown •{' '}
            <span className="font-medium text-green-600">{lifetimeCompleted}</span> completed 🎉
          </div>
        </div>
      </div>

      {/* Tasks List/Grid */}
      <div className={`${
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
      }`}>
        <AnimatePresence>
          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full text-center py-12"
            >
              <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                No tasks yet! 
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-6">
                Ready to get productive? Create your first task! ✨
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2 inline" />
                Create Your First Task 🚀
              </button>
            </motion.div>
          ) : (
            tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                viewMode={viewMode}
                onEdit={setEditingTask}
                onToggleCompletion={handleToggleCompletion}
                onDelete={handleDeleteTask}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                getDueDateDisplay={getDueDateDisplay}
                categories={categories}
                tags={tags}
                isDark={isDark}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Create Task Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <TaskForm
            onClose={() => setShowCreateForm(false)}
            categories={categories}
            tags={tags}
          />
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {editingTask && (
          <TaskForm
            task={editingTask}
            onClose={() => setEditingTask(null)}
            categories={categories}
            tags={tags}
          />
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={
          confirmModal.type === 'deleteTask' 
            ? 'Delete Task'
            : confirmModal.type === 'deleteAllCompleted'
            ? 'Delete All Completed Tasks'
            : 'Confirm Action'
        }
        message={
          confirmModal.type === 'deleteTask' && confirmModal.task
            ? `Are you sure you want to delete "${confirmModal.task.title}"? This can't be undone! 🗑️`
            : confirmModal.type === 'deleteAllCompleted'
            ? `Are you sure you want to delete all ${allTasks.filter(t => t.completed).length} completed tasks? This can't be undone! 🧹`
            : 'Are you sure you want to perform this action?'
        }
        confirmText={
          confirmModal.type === 'deleteTask' 
            ? 'Delete Task'
            : confirmModal.type === 'deleteAllCompleted'
            ? 'Delete All'
            : 'Confirm'
        }
        type="danger"
        isLoading={
          confirmModal.type === 'deleteTask' 
            ? deleteTaskMutation.isLoading
            : confirmModal.type === 'deleteAllCompleted'
            ? deleteAllCompletedMutation.isLoading
            : false
        }
      />
    </div>
  )
}

// Task Card Component
const TaskCard = ({ task, index, viewMode, onEdit, onToggleCompletion, onDelete, getPriorityColor, getStatusColor, getDueDateDisplay, categories, tags, isDark }) => {
  const dueDateInfo = getDueDateDisplay(task.dueDate)
  const category = categories.find(c => c.id === task.categoryId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
      className={`
        bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-primary-500 flex flex-col
        ${task.completed ? 'opacity-75' : ''}
        ${viewMode === 'grid' ? 'h-48' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => onToggleCompletion(task)}
            className={`
              w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 hover:scale-110
              ${task.completed 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-gray-300 hover:border-primary-500'
              }
            `}
          >
            {task.completed && <CheckSquare className="w-4 h-4" />}
          </button>
          <div className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getPriorityColor(task.priority, isDark)} ${task.priority === 'OVERDUE' ? 'animate-pulse' : ''}`}>
            {task.priority} {task.priority === 'OVERDUE' ? '💀' : task.priority === 'URGENT' ? '🚨' : task.priority === 'HIGH' ? '🔥' : task.priority === 'MEDIUM' ? '⚡' : '🌱'}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(task)}
            className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(task)}
            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h3 className={`
        text-lg font-bold mb-2 transition-all duration-200 line-clamp-2
        ${task.completed 
          ? 'text-gray-500 line-through' 
          : 'text-gray-900 dark:text-white'
        }
      `}>
        {task.title}
      </h3>

      <div className="flex-1 mb-4">
        {task.description ? (
          <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
            {task.description}
          </p>
        ) : (
          <div className="h-12"></div>
        )}
      </div>

      <div className="flex items-center justify-between min-h-[28px]">
        <div className="flex items-center space-x-2 flex-1">
          {category && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded-lg text-xs">
              <span>{category.icon}</span>
              <span className="font-medium text-gray-700 dark:text-gray-200">{category.name}</span>
            </div>
          )}
          
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center space-x-1">
              <Tag className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">{task.tags.length}</span>
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          {dueDateInfo && (
            <div className={`flex items-center space-x-1 text-xs font-medium ${dueDateInfo.color}`}>
              <span>{dueDateInfo.emoji}</span>
              <span>{dueDateInfo.text}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}



export default Tasks 