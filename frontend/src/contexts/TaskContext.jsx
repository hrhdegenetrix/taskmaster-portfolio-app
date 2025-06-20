import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { taskService } from '../services/api'

const TaskContext = createContext()

export const useTask = () => {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider')
  }
  return context
}

// Task reducer for state management
const taskReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      }
    case 'SET_SORT':
      return {
        ...state,
        sort: action.payload
      }
    case 'SET_VIEW_MODE':
      return {
        ...state,
        viewMode: action.payload
      }
    case 'SET_SELECTED_TASKS':
      return {
        ...state,
        selectedTasks: action.payload
      }
    case 'TOGGLE_TASK_SELECTION':
      const taskId = action.payload
      const isSelected = state.selectedTasks.includes(taskId)
      return {
        ...state,
        selectedTasks: isSelected
          ? state.selectedTasks.filter(id => id !== taskId)
          : [...state.selectedTasks, taskId]
      }
    case 'CLEAR_SELECTIONS':
      return {
        ...state,
        selectedTasks: []
      }
    case 'TOGGLE_SHOW_COMPLETED':
      return {
        ...state,
        showCompleted: !state.showCompleted
      }
    case 'SET_SHOW_COMPLETED':
      return {
        ...state,
        showCompleted: action.payload
      }
    case 'INCREMENT_LIFETIME_COMPLETED':
      const newLifetimeCount = state.lifetimeCompleted + 1
      // Save to localStorage
      localStorage.setItem('taskmaster-lifetime-completed', newLifetimeCount.toString())
      return {
        ...state,
        lifetimeCompleted: newLifetimeCount
      }
    case 'LOAD_LIFETIME_COMPLETED':
      return {
        ...state,
        lifetimeCompleted: action.payload
      }
    case 'INCREMENT_LIFETIME_TOTAL':
      const newLifetimeTotal = state.lifetimeTotal + 1
      // Save to localStorage
      localStorage.setItem('taskmaster-lifetime-total', newLifetimeTotal.toString())
      return {
        ...state,
        lifetimeTotal: newLifetimeTotal
      }
    case 'LOAD_LIFETIME_TOTAL':
      return {
        ...state,
        lifetimeTotal: action.payload
      }
    default:
      return state
  }
}

// Get default show completed setting from localStorage
const getDefaultShowCompleted = () => {
  const stored = localStorage.getItem('taskmaster-default-show-completed')
  return stored ? stored === 'true' : false
}

const initialState = {
  filters: {
    search: '',
    status: '',
    priority: '',
    category: '',
    completed: undefined,
    tags: []
  },
  sort: {
    field: 'dueDate',
    order: 'asc'
  },
  viewMode: 'list', // 'list' | 'grid' | 'kanban'
  selectedTasks: [],
  showCompleted: getDefaultShowCompleted(), // Use user's preference or default to false
  lifetimeCompleted: 0, // Track lifetime completed tasks
  lifetimeTotal: 0 // Track lifetime total tasks
}

export const TaskProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState)
  const queryClient = useQueryClient()

  // Fetch tasks with current filters
  const {
    data: tasksData,
    isLoading: tasksLoading,
    error: tasksError
  } = useQuery(
    ['tasks', state.filters, state.sort],
    () => taskService.getTasks({
      ...state.filters,
      categoryId: state.filters.category, // Fix: backend expects categoryId, not category
      sortBy: state.sort.field,
      sortOrder: state.sort.order
    }),
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 seconds
    }
  )

  // Helper function to compute effective priority (including OVERDUE)
  const getEffectivePriority = useMemo(() => {
    return (task) => {
      // Check if task is overdue
      if (task.dueDate && !task.completed) {
        const now = new Date()
        const dueDate = new Date(task.dueDate)
        if (dueDate < now) {
          return 'OVERDUE'
        }
      }
      return task.priority
    }
  }, [])

  // Priority order for sorting (OVERDUE is highest priority)
  const priorityOrder = useMemo(() => ({
    'OVERDUE': 5,
    'URGENT': 4,
    'HIGH': 3,
    'MEDIUM': 2,
    'LOW': 1
  }), [])

  // Apply frontend sorting if needed (especially for priority)
  const sortedTasks = useMemo(() => {
    if (!tasksData?.tasks) return []
    
    let tasks = [...tasksData.tasks]
    
    // Apply custom sorting for priority to handle OVERDUE
    if (state.sort.field === 'priority') {
      tasks.sort((a, b) => {
        const aPriority = getEffectivePriority(a)
        const bPriority = getEffectivePriority(b)
        const aOrder = priorityOrder[aPriority] || 0
        const bOrder = priorityOrder[bPriority] || 0
        
        if (state.sort.order === 'desc') {
          return bOrder - aOrder
        } else {
          return aOrder - bOrder
        }
      })
    }
    // For other sorting fields, the backend already sorted them correctly
    
    return tasks
  }, [tasksData?.tasks, state.sort.field, state.sort.order, getEffectivePriority, priorityOrder])

  // Fetch categories
  const {
    data: categories,
    isLoading: categoriesLoading
  } = useQuery('categories', taskService.getCategories, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch tags
  const {
    data: tags,
    isLoading: tagsLoading
  } = useQuery('tags', taskService.getTags, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Actions
  const setFilters = (filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters })
  }

  const setSort = (field, order = 'desc') => {
    dispatch({ type: 'SET_SORT', payload: { field, order } })
  }

  const setViewMode = (mode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode })
    localStorage.setItem('taskmaster-view-mode', mode)
  }

  const toggleTaskSelection = (taskId) => {
    dispatch({ type: 'TOGGLE_TASK_SELECTION', payload: taskId })
  }

  const selectAllTasks = () => {
    const allTaskIds = sortedTasks?.map(task => task.id) || []
    dispatch({ type: 'SET_SELECTED_TASKS', payload: allTaskIds })
  }

  const clearSelection = () => {
    dispatch({ type: 'CLEAR_SELECTIONS' })
  }

  const toggleShowCompleted = () => {
    dispatch({ type: 'TOGGLE_SHOW_COMPLETED' })
  }

  // Listen for changes to the default show completed setting
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'taskmaster-default-show-completed') {
        const newValue = e.newValue === 'true'
        if (newValue !== state.showCompleted) {
          dispatch({ type: 'SET_SHOW_COMPLETED', payload: newValue })
        }
      }
    }

    const handleCustomSettingChange = (e) => {
      if (e.detail && e.detail.setting === 'showCompleted') {
        dispatch({ type: 'SET_SHOW_COMPLETED', payload: e.detail.value })
      }
    }

    // Listen for localStorage changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange)
    
    // Listen for custom events from settings page
    window.addEventListener('taskmaster-setting-changed', handleCustomSettingChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('taskmaster-setting-changed', handleCustomSettingChange)
    }
  }, [state.showCompleted])

  const incrementLifetimeCompleted = () => {
    dispatch({ type: 'INCREMENT_LIFETIME_COMPLETED' })
  }

  const incrementLifetimeTotal = () => {
    dispatch({ type: 'INCREMENT_LIFETIME_TOTAL' })
  }

  // Utility functions
  const invalidateQueries = () => {
    queryClient.invalidateQueries('tasks')
    queryClient.invalidateQueries('categories')
    queryClient.invalidateQueries('tags')
    queryClient.invalidateQueries('analytics')
  }

  const getTaskById = (taskId) => {
    return sortedTasks?.find(task => task.id === taskId)
  }

  const getCategoryById = (categoryId) => {
    return categories?.find(category => category.id === categoryId)
  }

  const getTagById = (tagId) => {
    return tags?.find(tag => tag.id === tagId)
  }

  // Load view mode and lifetime counts from localStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('taskmaster-view-mode')
    if (savedViewMode && ['list', 'grid', 'kanban'].includes(savedViewMode)) {
      dispatch({ type: 'SET_VIEW_MODE', payload: savedViewMode })
    }

    const savedLifetimeCompleted = localStorage.getItem('taskmaster-lifetime-completed')
    if (savedLifetimeCompleted) {
      const count = parseInt(savedLifetimeCompleted, 10)
      if (!isNaN(count)) {
        dispatch({ type: 'LOAD_LIFETIME_COMPLETED', payload: count })
      }
    }

    const savedLifetimeTotal = localStorage.getItem('taskmaster-lifetime-total')
    if (savedLifetimeTotal) {
      const count = parseInt(savedLifetimeTotal, 10)
      if (!isNaN(count)) {
        dispatch({ type: 'LOAD_LIFETIME_TOTAL', payload: count })
      }
    }
  }, [])

  // Initialize lifetimeTotal from current task count if not set (for existing users)
  useEffect(() => {
    if (sortedTasks && state.lifetimeTotal === 0) {
      const currentTaskCount = sortedTasks.length
      if (currentTaskCount > 0) {
        // Only initialize if there are tasks but no lifetime total recorded
        dispatch({ type: 'LOAD_LIFETIME_TOTAL', payload: currentTaskCount })
        localStorage.setItem('taskmaster-lifetime-total', currentTaskCount.toString())
      }
    }
  }, [sortedTasks, state.lifetimeTotal])

  // Filter tasks based on showCompleted toggle
  const filteredTasks = sortedTasks.filter(task => {
    if (!state.showCompleted && task.completed) {
      return false // Hide completed tasks when showCompleted is false
    }
    return true
  })

  const value = {
    // State
    filters: state.filters,
    sort: state.sort,
    viewMode: state.viewMode,
    selectedTasks: state.selectedTasks,
    showCompleted: state.showCompleted,
    lifetimeCompleted: state.lifetimeCompleted,
    lifetimeTotal: state.lifetimeTotal,

    // Data
    tasks: filteredTasks,
    allTasks: sortedTasks, // Use sorted tasks for consistency
    pagination: tasksData?.pagination,
    categories: categories || [],
    tags: tags || [],

    // Loading states
    isLoading: tasksLoading || categoriesLoading || tagsLoading,
    tasksLoading,
    categoriesLoading,
    tagsLoading,

    // Error states
    error: tasksError,

    // Actions
    setFilters,
    setSort,
    setViewMode,
    toggleTaskSelection,
    selectAllTasks,
    clearSelection,
    toggleShowCompleted,
    incrementLifetimeCompleted,
    incrementLifetimeTotal,
    invalidateQueries,

    // Utility functions
    getTaskById,
    getCategoryById,
    getTagById,
    getEffectivePriority, // Export the helper function
  }

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  )
} 