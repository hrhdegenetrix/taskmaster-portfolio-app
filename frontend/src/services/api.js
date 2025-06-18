import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data || config.params)
    return config
  },
  (error) => {
    console.error('❌ Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data)
    return response
  },
  (error) => {
    console.error('❌ Response error:', error.response?.data || error.message)
    
    // Handle common errors
    if (error.response?.status === 404) {
      console.warn('Resource not found')
    } else if (error.response?.status >= 500) {
      console.error('Server error occurred')
    }
    
    return Promise.reject(error)
  }
)

// Task service
export const taskService = {
  // Get all tasks with optional filters
  getTasks: async (params = {}) => {
    const response = await api.get('/tasks', { params })
    return response.data
  },

  // Get a specific task by ID
  getTask: async (id) => {
    const response = await api.get(`/tasks/${id}`)
    return response.data
  },

  // Create a new task
  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData)
    return response.data
  },

  // Update a task
  updateTask: async (id, taskData) => {
    const response = await api.put(`/tasks/${id}`, taskData)
    return response.data
  },

  // Delete a task
  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`)
    return response.data
  },

  // Bulk operations
  bulkOperation: async (action, taskIds, updateData = null) => {
    const response = await api.post('/tasks/bulk', {
      action,
      taskIds,
      updateData
    })
    return response.data
  },

  // Get all categories
  getCategories: async () => {
    const response = await api.get('/categories')
    return response.data
  },

  // Create a new category
  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData)
    return response.data
  },

  // Update a category
  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData)
    return response.data
  },

  // Delete a category
  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`)
    return response.data
  },

  // Get all tags
  getTags: async () => {
    const response = await api.get('/tags')
    return response.data
  },

  // Create a new tag
  createTag: async (tagData) => {
    const response = await api.post('/tags', tagData)
    return response.data
  },

  // Update a tag
  updateTag: async (id, tagData) => {
    const response = await api.put(`/tags/${id}`, tagData)
    return response.data
  },

  // Delete a tag
  deleteTag: async (id) => {
    const response = await api.delete(`/tags/${id}`)
    return response.data
  },

  // Get popular tags
  getPopularTags: async (limit = 10) => {
    const response = await api.get(`/tags/popular?limit=${limit}`)
    return response.data
  },
}

// Analytics service
export const analyticsService = {
  // Get analytics overview
  getOverview: async (period = 'all') => {
    const response = await api.get(`/analytics/overview?period=${period}`)
    return response.data
  },

  // Get completion trends
  getTrends: async (period = 'week', granularity = 'day') => {
    const response = await api.get(`/analytics/trends?period=${period}&granularity=${granularity}`)
    return response.data
  },

  // Get productivity metrics
  getProductivity: async (period = 'month') => {
    const response = await api.get(`/analytics/productivity?period=${period}`)
    return response.data
  },

  // Get category analytics
  getCategoryAnalytics: async (period = 'month') => {
    const response = await api.get(`/analytics/categories?period=${period}`)
    return response.data
  },
}

// Upload service
export const uploadService = {
  // Upload an image
  uploadImage: async (file) => {
    const formData = new FormData()
    formData.append('image', file)

    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Delete an image
  deleteImage: async (filename) => {
    const response = await api.delete(`/upload/image/${filename}`)
    return response.data
  },
}

// Utility functions
export const apiUtils = {
  // Test API connection
  testConnection: async () => {
    try {
      const response = await api.get('/health')
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get API info
  getApiInfo: async () => {
    const response = await api.get('/')
    return response.data
  },
}

export default api 