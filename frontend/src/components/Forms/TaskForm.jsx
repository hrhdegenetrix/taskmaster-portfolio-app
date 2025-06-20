import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Calendar,
  Tag,
  FolderOpen,
  AlertCircle,
  Clock,
  Trash2,
  Star,
  Zap,
  Flame,
  Leaf,
  Save,
  Sparkles
} from 'lucide-react'
import { useTask } from '../../contexts/TaskContext'
import { taskService } from '../../services/api'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDangerous = false }) => {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className={`p-2 rounded-full ${isDangerous ? 'bg-red-100 dark:bg-red-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
              <AlertCircle className={`w-5 h-5 ${isDangerous ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            {message}
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 text-white rounded-xl transition-all duration-200 font-medium ${
                isDangerous 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {confirmText}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-200 font-medium"
            >
              {cancelText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Custom Time Dropdown Component
const TimeDropdown = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value || '')
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)
  
  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value || '')
  }, [value])
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Validate and format time input
  const handleInputChange = (e) => {
    const input = e.target.value
    setInputValue(input)
    
    // Basic time validation (HH:MM format)
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
    if (timeRegex.test(input)) {
      onChange(input)
    } else if (input === '') {
      onChange('')
    }
  }
  
  // Handle input blur to format the time
  const handleInputBlur = () => {
    if (inputValue) {
      // Try to parse and reformat the input
      const timeRegex = /^(\d{1,2}):?(\d{0,2})$/
      const match = inputValue.match(timeRegex)
      
      if (match) {
        let [, hours, minutes] = match
        hours = parseInt(hours)
        minutes = minutes ? parseInt(minutes) : 0
        
        // Validate ranges
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
          setInputValue(formattedTime)
          onChange(formattedTime)
        }
      }
    }
  }
  
  // Generate time options (every 15 minutes)
  const timeOptions = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour = h.toString().padStart(2, '0')
      const minute = m.toString().padStart(2, '0')
      const time24 = `${hour}:${minute}`
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
      const ampm = h < 12 ? 'AM' : 'PM'
      const time12 = `${hour12}:${minute} ${ampm}`
      
      timeOptions.push({
        value: time24,
        label: time12,
        display: time24
      })
    }
  }

  const selectedOption = timeOptions.find(opt => opt.value === value)
  
  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="flex w-full">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => {
            // If time is empty and user focuses on input, set current time as default
            if (!value || value === '') {
              const now = new Date()
              const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
              onChange(currentTime)
              setInputValue(currentTime)
            }
          }}
          placeholder="HH:MM or select..."
          disabled={disabled}
          className={`flex-1 min-w-0 px-4 py-3 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-l-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              // If time is empty and user clicks, set current time as default
              if (!value || value === '') {
                const now = new Date()
                const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
                onChange(currentTime)
                setInputValue(currentTime)
              }
              setIsOpen(!isOpen)
            }
          }}
          disabled={disabled}
          className={`flex-shrink-0 px-3 py-3 border-2 border-l-0 border-gray-200 dark:border-gray-600 rounded-r-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      </div>
      
      {isOpen && !disabled && (
        <div 
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-48 overflow-y-auto"
          ref={(el) => {
            if (el && value) {
              // Scroll to the selected time when dropdown opens
              const selectedIndex = timeOptions.findIndex(opt => opt.value === value)
              if (selectedIndex >= 0) {
                const buttonHeight = 32 // Approximate height of each button
                const scrollTop = Math.max(0, (selectedIndex - 2) * buttonHeight) // Show 2 items above
                setTimeout(() => el.scrollTop = scrollTop, 0)
              }
            }
          }}
        >
          <div className="p-2">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setIsOpen(false)
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              No specific time
            </button>
            {timeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  value === option.value
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const TaskForm = ({ task = null, onClose, categories, tags }) => {
  const { invalidateQueries, incrementLifetimeTotal } = useTask()
  const queryClient = useQueryClient()
  
  const isEditing = !!task
  
  // Form state
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: (task?.priority && task.priority !== 'OVERDUE') ? task.priority : 'MEDIUM',
    status: task?.status || 'PENDING',
    dueDate: task?.dueDate ? (() => {
      // Convert UTC datetime to user's local timezone for date extraction
      const taskDate = new Date(task.dueDate);
      const year = taskDate.getFullYear();
      const month = (taskDate.getMonth() + 1).toString().padStart(2, '0');
      const day = taskDate.getDate().toString().padStart(2, '0');
      const localDateStr = `${year}-${month}-${day}`;
      console.log('📅 Date conversion for editing:', {
        utcFromDb: task.dueDate,
        localDateObj: taskDate.toString(),
        formFieldValue: localDateStr
      });
      return localDateStr;
    })() : new Date().toISOString().split('T')[0],
    dueTime: task?.dueDate ? (() => {
      // Convert UTC datetime to user's local timezone for editing
      const taskDate = new Date(task.dueDate);
      const hours = taskDate.getHours().toString().padStart(2, '0');
      const minutes = taskDate.getMinutes().toString().padStart(2, '0');
      const seconds = taskDate.getSeconds().toString().padStart(2, '0');
      
      // Check if it's set to end of day (23:59:59) in local time - if so, no specific time was set
      if (hours === '23' && minutes === '59' && seconds === '59') {
        console.log('⏰ Time conversion for editing - end of day detected, showing no specific time');
        return '';
      }
      
      const localTimeStr = `${hours}:${minutes}`;
      console.log('⏰ Time conversion for editing:', {
        utcFromDb: task.dueDate,
        localDateObj: taskDate.toString(),
        formFieldValue: localTimeStr
      });
      return localTimeStr;
    })() : '',
    categoryId: task?.categoryId || '',
    selectedTags: task?.tags?.map(t => t.id) || []
  })
  
  const [newTag, setNewTag] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [errors, setErrors] = useState({})
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDangerous: false
  })

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
        
        // Increment lifetime total only when creating new tasks (not editing)
        if (!isEditing) {
          incrementLifetimeTotal()
        }
        
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

  // Delete tag mutation
  const deleteTagMutation = useMutation(
    (tagId) => taskService.deleteTag(tagId),
    {
      onSuccess: async (deletedTag, tagId) => {
        toast.success(`Tag deleted! 🗑️`)
        
        // Remove the deleted tag from selected tags if it was selected
        setFormData(prev => ({
          ...prev,
          selectedTags: prev.selectedTags.filter(id => id !== tagId)
        }))
        
        // Aggressive cache invalidation and refetching
        await Promise.all([
          queryClient.invalidateQueries('tags'),
          queryClient.invalidateQueries('tasks'),
          queryClient.invalidateQueries('categories'),
          // Force immediate refetch of all tasks to update counts
          queryClient.refetchQueries('tasks', { active: true }),
        ])
        
        // If we're editing an existing task, refetch its data specifically
        if (isEditing && task?.id) {
          try {
            const updatedTask = await taskService.getTask(task.id)
            console.log('🔄 Refreshed current task data after tag deletion')
            
            // Update form data with fresh task data (this should show correct tag count)
            setFormData(prev => ({
              ...prev,
              selectedTags: updatedTask.tags?.map(t => t.id) || []
            }))
          } catch (error) {
            console.warn('Could not refresh current task data:', error)
          }
        }
      },
      onError: (error) => {
        toast.error('Failed to delete tag 😕')
        console.error('Tag deletion error:', error)
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

  // Delete tag from system with confirmation modal
  const deleteTag = React.useCallback((tagId, tagName, event) => {
    console.log('🗑️ deleteTag called with:', tagId, tagName) // Debug log
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }
    
    // Show confirmation modal
    setConfirmModal({
      isOpen: true,
      title: 'Delete Tag 🗑️',
      message: `Are you sure you want to permanently delete the tag "${tagName}"? This will remove it from all tasks and cannot be undone!`,
      onConfirm: () => {
        console.log('✅ User confirmed deletion of tag:', tagName) // Debug log
        deleteTagMutation.mutate(tagId)
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
      },
      isDangerous: true
    })
  }, [deleteTagMutation])

  // Close confirmation modal
  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }))
  }

  // Remove tag from selection (for unselecting without deleting)
  const unselectTag = React.useCallback((tagId, event) => {
    console.log('🏷️ unselectTag called with:', tagId) // Debug log
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }
    
    console.log('🔍 Current selectedTags before removal:', formData.selectedTags) // Debug log
    
    // Update state immediately and force component re-render
    setFormData(currentData => {
      const updatedTags = currentData.selectedTags.filter(id => id !== tagId)
      console.log('✅ New selectedTags after removal:', updatedTags) // Debug log
      
      return {
        ...currentData,
        selectedTags: updatedTags,
        _forceUpdateKey: Math.random() // Force re-render with random key
      }
    })
  }, [formData.selectedTags])

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

    // Combine date and time with proper timezone handling
    let combinedDateTime = null;
    if (formData.dueDate) {
      if (formData.dueTime) {
        // Create local datetime and convert to ISO string (UTC)
        const [hours, minutes] = formData.dueTime.split(':');
        const localDate = new Date(formData.dueDate);
        localDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        combinedDateTime = localDate.toISOString();
        console.log('🕐 DateTime conversion:', {
          userInput: `${formData.dueDate} ${formData.dueTime}`,
          localDate: localDate.toString(),
          utcForStorage: combinedDateTime
        });
      } else {
        // If no time specified, set to end of day in local timezone
        const localDate = new Date(formData.dueDate);
        localDate.setHours(23, 59, 59, 999);
        combinedDateTime = localDate.toISOString();
        console.log('🕐 DateTime conversion (end of day):', {
          userInput: formData.dueDate,
          localDate: localDate.toString(),
          utcForStorage: combinedDateTime
        });
      }
    }

    // Prepare task data - ensure priority is never "OVERDUE"
    const validPriority = formData.priority === 'OVERDUE' ? 'HIGH' : formData.priority;
    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: validPriority,
      status: formData.status,
      categoryId: formData.categoryId || null,
      tags: formData.selectedTags
    }

    // Always include the dueDate for updates - simpler and more reliable
    taskData.dueDate = combinedDateTime

    createTaskMutation.mutate(taskData)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
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
              {isEditing ? `Edit Task` : 'Create New Task ✨'}
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
                <div className="min-w-0">
                  <TimeDropdown
                    value={formData.dueTime}
                    onChange={(time) => handleChange('dueTime', time)}
                    disabled={!formData.dueDate}
                  />
                </div>
              </div>
                            <div className="flex items-start space-x-2 mt-2">
                <p className="text-gray-500 text-xs">
                  💡 Time is optional - without it, tasks are due at end of day. Click dropdown or type directly (e.g., 14:30).
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
                  console.log(`🏷️ Tag ${tag.name} (${tag.id}): selected = ${isSelected}`) // Debug log
                  return (
                    <div key={`tag-${tag.id}-${isSelected}-${formData._forceUpdateKey || 0}`} className="relative">
                      {isSelected ? (
                        <div className="relative flex items-center bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 overflow-hidden">
                          {/* Main clickable area for unselecting */}
                          <button
                            type="button"
                            onClick={(e) => {
                              console.log(`↩️ Unselecting tag: ${tag.name} (${tag.id})`) // Debug log
                              unselectTag(tag.id, e)
                            }}
                            className="flex items-center px-3 py-2 pr-8 hover:bg-white hover:bg-opacity-10 transition-all duration-200 flex-1"
                            title="Click to unselect tag (keep tag in system)"
                          >
                            <span>{tag.name}</span>
                          </button>
                          {/* Delete button overlay */}
                          <button
                            type="button"
                            onClick={(e) => {
                              console.log(`🗑️ Deleting tag: ${tag.name} (${tag.id})`) // Debug log
                              deleteTag(tag.id, tag.name, e)
                            }}
                            className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center text-white hover:text-red-200 hover:bg-red-500 hover:bg-opacity-80 transition-all duration-200"
                            title="Delete tag permanently from system"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            console.log(`➕ Adding tag: ${tag.name} (${tag.id})`) // Debug log
                            toggleTag(tag.id)
                          }}
                          className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105"
                        >
                          {tag.name}
                        </button>
                      )}
                    </div>
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
              disabled={createTaskMutation.isLoading}
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

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={closeConfirmModal}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous={confirmModal.isDangerous}
        />
      </motion.div>
    </motion.div>
  )
}

export default TaskForm 