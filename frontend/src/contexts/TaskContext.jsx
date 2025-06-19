import React, { createContext, useContext, useReducer, useEffect } from 'react'
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
    default:
      return state
  }
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
  selectedTasks: []
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
      keepPreviousData: false, // Don't keep previous data to force fresh sorting
      staleTime: 0, // Always fetch fresh data for tasks
      cacheTime: 5000, // Keep in cache for just 5 seconds
      refetchOnMount: 'always', // Always refetch when component mounts
    }
  )

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
    const allTaskIds = tasksData?.tasks?.map(task => task.id) || []
    dispatch({ type: 'SET_SELECTED_TASKS', payload: allTaskIds })
  }

  const clearSelection = () => {
    dispatch({ type: 'CLEAR_SELECTIONS' })
  }

  // Utility functions
  const invalidateQueries = () => {
    // Clear task cache completely to force fresh sorting on next request
    queryClient.removeQueries('tasks')
    queryClient.invalidateQueries('tasks')
    queryClient.invalidateQueries('categories')
    queryClient.invalidateQueries('tags')
    queryClient.invalidateQueries('analytics')
  }

  const getTaskById = (taskId) => {
    return tasksData?.tasks?.find(task => task.id === taskId)
  }

  const getCategoryById = (categoryId) => {
    return categories?.find(category => category.id === categoryId)
  }

  const getTagById = (tagId) => {
    return tags?.find(tag => tag.id === tagId)
  }

  // Load view mode from localStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('taskmaster-view-mode')
    if (savedViewMode && ['list', 'grid', 'kanban'].includes(savedViewMode)) {
      dispatch({ type: 'SET_VIEW_MODE', payload: savedViewMode })
    }
  }, [])

  const value = {
    // State
    filters: state.filters,
    sort: state.sort,
    viewMode: state.viewMode,
    selectedTasks: state.selectedTasks,

    // Data
    tasks: tasksData?.tasks || [],
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
    invalidateQueries,

    // Utility functions
    getTaskById,
    getCategoryById,
    getTagById,
  }

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  )
} 