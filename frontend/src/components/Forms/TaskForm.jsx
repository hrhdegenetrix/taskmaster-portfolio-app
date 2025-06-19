import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  Calendar,
  Tag,
  FolderOpen,
  AlertCircle,
  Clock,
  Image as ImageIcon,
  Upload,
  Trash2,
  Star,
  Zap,
  Flame,
  Leaf,
  Save,
  Sparkles
} from 'lucide-react'
import { useTask } from '../../contexts/TaskContext'
import { taskService, uploadService } from '../../services/api'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'

const TaskForm = ({ task = null, onClose, categories, tags }) => {
  const { invalidateQueries } = useTask()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  
  const isEditing = !!task
  
  // Form state
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'MEDIUM',
    status: task?.status || 'PENDING',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    dueTime: task?.dueDate ? (() => {
      const date = new Date(task.dueDate);
      // Check if it's set to end of day (23:59:59) - if so, no specific time was set
      if (date.getHours() === 23 && date.getMinutes() === 59 && date.getSeconds() === 59) {
        return '';
      }
      return date.toTimeString().split(' ')[0].substring(0, 5);
    })() : '',
    categoryId: task?.categoryId || '',
    selectedTags: task?.tags?.map(t => t.id) || [],
    imageUrl: task?.imageUrl || ''
  })
  
  const [newTag, setNewTag] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [errors, setErrors] = useState({})

  // Priority options with fun styling
  const priorityOptions = [
    { value: 'LOW', label: 'Low Priority', icon: Leaf, color: 'from-green-500 to-green-600', emoji: '🌱' },
    { value: 'MEDIUM', label: 'Medium Priority', icon: Zap, color: 'from-blue-500 to-blue-600', emoji: '⚡' },
    { value: 'HIGH', label: 'High Priority', icon: Flame, color: 'from-orange-500 to-orange-600', emoji: '🔥' },
    { value: 'URGENT', label: 'Urgent!', icon: AlertCircle, color: 'from-red-500 to-red-600', emoji: '🚨' }
  ]

  // Status options
  const statusOptions = [
    { value: 'PENDING', label: 'Pending', emoji: '⏳' },
    { value: 'IN_PROGRESS', label: 'In Progress', emoji: '🚀' },
    { value: 'COMPLETED', label: 'Completed', emoji: '✅' },
    { value: 'CANCELLED', label: 'Cancelled', emoji: '❌' }
  ]

  // Create/Update task mutation
  const createTaskMutation = useMutation(
    (taskData) => isEditing 
      ? taskService.updateTask(task.id, taskData)
      : taskService.createTask(taskData),
    {
      onSuccess: () => {
        toast.success(isEditing ? 'Task updated! 🎉' : 'Task created! ✨')
        invalidateQueries()
        onClose()
      },
      onError: (error) => {
        toast.error('Oops! Something went wrong 😕')
        console.error('Task mutation error:', error)
      }
    }
  )

  // Create tag mutation
  const createTagMutation = useMutation(
    (tagData) => taskService.createTag(tagData),
    {
      onSuccess: (newTag) => {
        toast.success(`Tag "${newTag.name}" created! 🏷️`)
        queryClient.invalidateQueries('tags')
        setFormData(prev => ({
          ...prev,
          selectedTags: [...prev.selectedTags, newTag.id]
        }))
        setNewTag('')
      },
      onError: (error) => {
        toast.error('Failed to create tag 😕')
        console.error('Tag creation error:', error)
      }
    }
  )

  // Create category mutation
  const createCategoryMutation = useMutation(
    (categoryData) => taskService.createCategory(categoryData),
    {
      onSuccess: (newCategory) => {
        toast.success(`Category "${newCategory.name}" created! 📁`)
        queryClient.invalidateQueries('categories')
        setFormData(prev => ({
          ...prev,
          categoryId: newCategory.id
        }))
        setNewCategory('')
      },
      onError: (error) => {
        toast.error('Failed to create category 😕')
        console.error('Category creation error:', error)
      }
    }
  )

  // Handle form input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  // Handle tag selection
  const toggleTag = (tagId) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter(id => id !== tagId)
        : [...prev.selectedTags, tagId]
    }))
  }

  // Remove tag from selection
  const removeTag = (tagId, event) => {
    event.stopPropagation() // Prevent the toggle when clicking X
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.filter(id => id !== tagId)
    }))
  }

  // Create new tag(s) - supports comma separation
  const handleCreateTag = () => {
    if (!newTag.trim()) return
    
    // Split by comma and create multiple tags
    const tagNames = newTag.split(',').map(name => name.trim()).filter(name => name.length > 0)
    
    tagNames.forEach(tagName => {
      // Check if tag already exists
      const existingTag = tags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase())
      if (existingTag) {
        // Add existing tag to selection if not already selected
        if (!formData.selectedTags.includes(existingTag.id)) {
          setFormData(prev => ({
            ...prev,
            selectedTags: [...prev.selectedTags, existingTag.id]
          }))
        }
      } else {
        // Create new tag
        createTagMutation.mutate({
          name: tagName,
          color: '#8b5cf6' // Default purple color
        })
      }
    })
    
    setNewTag('')
  }

  // Create new category
  const handleCreateCategory = () => {
    if (!newCategory.trim()) return
    
    createCategoryMutation.mutate({
      name: newCategory.trim(),
      color: '#8b5cf6', // Default purple color
      icon: '📁' // Default folder icon
    })
  }

  // Handle image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large! Max 5MB please 📏')
      return
    }

    setUploadingImage(true)
    try {
      const result = await uploadService.uploadImage(file)
      setFormData(prev => ({ ...prev, imageUrl: result.file.url }))
      toast.success('Image uploaded! 📸')
    } catch (error) {
      toast.error('Image upload failed 😕')
    } finally {
      setUploadingImage(false)
    }
  }

  // Remove image
  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }))
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required! 📝'
    }
    
    if (formData.title.length > 100) {
      newErrors.title = 'Title too long! Keep it under 100 characters 📏'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors first! 🛠️')
      return
    }

    // Combine date and time if both are provided
    let combinedDateTime = null;
    if (formData.dueDate) {
      combinedDateTime = formData.dueDate;
      if (formData.dueTime) {
        combinedDateTime += `T${formData.dueTime}:00`;
      } else {
        // If no time specified, set to end of day (will be handled by backend)
        combinedDateTime += `T00:00:00`;
      }
    }

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      status: formData.status,
      dueDate: combinedDateTime,
      categoryId: formData.categoryId || null,
      tags: formData.selectedTags,
      imageUrl: formData.imageUrl || null
    }

    createTaskMutation.mutate(taskData)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 via-accent-600 to-fun-600 bg-clip-text text-transparent">
              {isEditing ? `Edit Task ✏️` : 'Create New Task ✨'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mt-2">
              {isEditing ? 'Update your awesome task! 🚀' : 'Let\'s create something amazing! 💫'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 text-gray-400 hover:text-red-500 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-110"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Task Title */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
              Task Title ✨
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="What awesome thing do you want to accomplish? 🎯"
              className={`w-full px-6 py-4 text-lg border-2 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 transition-all duration-200 focus:ring-4 focus:ring-primary-200 focus:border-primary-500 ${
                errors.title ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
              }`}
              maxLength={100}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-2 font-medium">{errors.title}</p>
            )}
            <p className="text-gray-500 text-sm mt-2">
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
              Priority Level 🎯
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {priorityOptions.map((option) => {
                const Icon = option.icon
                const isSelected = formData.priority === option.value
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange('priority', option.value)}
                    className={`
                      p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105
                      ${isSelected 
                        ? `bg-gradient-to-r ${option.color} text-white border-transparent shadow-lg scale-105` 
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-300'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-2xl">{option.emoji}</span>
                      <span className="font-semibold text-sm">{option.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Status & Due Date/Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                Status 📊
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.emoji} {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date & Time */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                Due Date & Time 📅⏰
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  className="px-4 py-3 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200"
                />
                <div className="relative">
                  <input
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => handleChange('dueTime', e.target.value)}
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200"
                    disabled={!formData.dueDate}
                    title="Click the clock icon or type HH:MM format (e.g., 14:30 for 2:30 PM)"
                    placeholder="HH:MM"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-2 mt-2">
                <p className="text-gray-500 text-xs">
                  💡 Time is optional - without it, tasks are due at end of day.
                </p>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-gray-500 text-xs">
                  ⌨️ <strong>Desktop users:</strong> Click time field, then use arrow keys or type directly (14:30)
                </p>
              </div>
            </div>
          </div>

          {/* Category & Tags Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                Category 📁
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 mb-3"
              >
                <option value="">Choose a category... 🗂️</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              
              {/* Create New Category */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Create new category... 🆕"
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateCategory())}
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={!newCategory.trim() || createCategoryMutation.isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-accent-500 to-fun-500 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  {createCategoryMutation.isLoading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                Tags 🏷️
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map(tag => {
                  const isSelected = formData.selectedTags.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`
                        group relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105
                        ${isSelected
                          ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                        }
                      `}
                    >
                      <span className={isSelected ? 'mr-1' : ''}>{tag.name}</span>
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => removeTag(tag.id, e)}
                          className="ml-1 inline-flex items-center justify-center w-4 h-4 text-white hover:text-red-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          title="Remove tag"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </button>
                  )
                })}
              </div>
              
              {/* Create New Tag */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Create tags (separate with commas)... 🆕"
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateTag())}
                />
                <button
                  type="button"
                  onClick={handleCreateTag}
                  disabled={!newTag.trim() || createTagMutation.isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-accent-500 to-fun-500 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
              Description 📝
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Tell us more about this task... (Markdown supported!) ✨"
              rows={6}
              className="w-full px-6 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-4 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 resize-none"
            />
            <p className="text-gray-500 text-sm mt-2">
              💡 You can use **bold**, *italic*, and other markdown formatting!
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
              Attach Image 📸
            </label>
            
            {formData.imageUrl ? (
              <div className="relative">
                <img
                  src={formData.imageUrl}
                  alt="Task attachment"
                  className="w-full h-48 object-cover rounded-2xl"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 transform hover:scale-110"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-25 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {uploadingImage ? (
                  <div className="flex flex-col items-center">
                    <div className="loading-spinner w-8 h-8 mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Uploading image... ⚡</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      Click to upload an image ✨
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={createTaskMutation.isLoading}
              className="flex-1 px-6 py-4 text-lg font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-2xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTaskMutation.isLoading || uploadingImage}
              className="flex-1 px-6 py-4 text-lg font-bold text-white bg-gradient-to-r from-primary-500 via-accent-500 to-fun-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createTaskMutation.isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner w-5 h-5 mr-2"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Save className="w-5 h-5 mr-2" />
                  {isEditing ? 'Update Task ✨' : 'Create Task 🚀'}
                </div>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default TaskForm 