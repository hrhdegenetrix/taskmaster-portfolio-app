import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from 'react-query'
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Calendar,
  Coffee,
  Brain,
  Clock,
  Filter
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { analyticsService } from '../services/api'
import { useTask } from '../contexts/TaskContext'
import toast from 'react-hot-toast'

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  
  // Get the correct lifetime completed count from TaskContext (localStorage)
  const { lifetimeCompleted = 0, allTasks = [] } = useTask()
  const queryClient = useQueryClient()

  // Fetch analytics data using consolidated endpoint
  const { data: overview, isLoading: overviewLoading } = useQuery(
    ['analytics-overview', selectedPeriod],
    () => fetch(`/api/analytics?type=overview&period=${selectedPeriod}`).then(res => res.json()),
    {
      onError: () => toast.error('Failed to load analytics data 📊')
    }
  )

  const { data: trends, isLoading: trendsLoading } = useQuery(
    ['analytics-trends', selectedPeriod],
    () => fetch(`/api/analytics?type=trends&period=${selectedPeriod}&granularity=day`).then(res => res.json()),
    {
      onError: () => toast.error('Failed to load trend data 📈')
    }
  )

  const { data: productivity, isLoading: productivityLoading } = useQuery(
    ['analytics-productivity', selectedPeriod],
    () => fetch(`/api/analytics?type=productivity&period=${selectedPeriod}`).then(res => res.json()),
    {
      onError: () => toast.error('Failed to load productivity data 🚀')
    }
  )

  const { data: categories, isLoading: categoriesLoading } = useQuery(
    ['analytics-categories', selectedPeriod],
    () => fetch(`/api/analytics?type=categories&period=${selectedPeriod}`).then(res => res.json()),
    {
      onError: () => toast.error('Failed to load category data 📁')
    }
  )

  const isLoading = overviewLoading || trendsLoading || productivityLoading || categoriesLoading



  // Color schemes for charts
  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#84CC16']
  
  // Priority colors
  const PRIORITY_COLORS = {
    LOW: '#10B981',    // Green
    MEDIUM: '#06B6D4', // Blue  
    HIGH: '#F59E0B',   // Orange
    URGENT: '#EF4444'  // Red
  }

  const formatData = (data) => {
    if (!data) return []
    return data.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length]
    }))
  }

  const formatPriorityData = (data) => {
    if (!data) return []
    return data.map(item => ({
      ...item,
      fill: PRIORITY_COLORS[item.priority] || COLORS[0]
    }))
  }



  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Crunching Numbers... 🔢
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Analyzing your awesome productivity data!
          </p>
        </div>
      </div>
    )
  }



  // Invalidate analytics cache when tasks change
  React.useEffect(() => {
    // This will trigger a refetch of analytics data when tasks change
    if (allTasks.length > 0) {
      // Small delay to ensure the analytics reflect the latest changes
      const timer = setTimeout(() => {
        // Properly invalidate React Query caches
        queryClient.invalidateQueries(['analytics-overview'])
        queryClient.invalidateQueries(['analytics-trends'])
        queryClient.invalidateQueries(['analytics-productivity'])
        queryClient.invalidateQueries(['analytics-categories'])
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [allTasks.length, queryClient])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 via-accent-600 to-fun-600 bg-clip-text text-transparent">
            Analytics Dashboard 📊
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
            Your productivity insights and achievements! ✨
          </p>
        </div>
        
        {/* Period Selector */}
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>



      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        {overview?.priorityDistribution && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-primary-500" />
              Task Priority Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formatPriorityData(overview.priorityDistribution)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ priority, percent }) => `${priority} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="count"
                >
                  {formatPriorityData(overview.priorityDistribution).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Category Distribution */}
        {overview?.categoryDistribution && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-accent-500" />
              Tasks by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formatData(overview.categoryDistribution)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Productivity Insights */}
      {productivity && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="w-6 h-6" />
            <h2 className="text-xl font-bold">Productivity Insights 🧠</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-20 rounded-xl p-4">
              <Clock className="w-6 h-6 mb-2" />
              <h3 className="font-bold">Avg. Completion Time</h3>
              <p className="text-2xl font-bold">
                {productivity.avgCompletionTimeHours?.toFixed(1) || 0}h
              </p>
              <p className="text-sm opacity-90">Per task average</p>
            </div>
            
            <div className="bg-white bg-opacity-20 rounded-xl p-4">
              <Calendar className="w-6 h-6 mb-2" />
              <h3 className="font-bold">Most Productive Day</h3>
              <p className="text-2xl font-bold">
                {productivity.productiveDays?.[0]?.day || 'N/A'}
              </p>
              <p className="text-sm opacity-90">
                {productivity.productiveDays?.[0]?.completedTasks || 0} tasks completed
              </p>
            </div>
            
            <div className="bg-white bg-opacity-20 rounded-xl p-4">
              <Coffee className="w-6 h-6 mb-2" />
                             <h3 className="font-bold">Motivation Level</h3>
               <p className="text-2xl font-bold">
                 {lifetimeCompleted >= 20 ? 'Incredible! 🔥' : 
                  lifetimeCompleted >= 10 ? 'Amazing! 👍' : 
                  lifetimeCompleted >= 5 ? 'Great! 💪' : 
                  lifetimeCompleted >= 1 ? 'Getting Started! 🌱' : 'Ready to Begin! ✨'}
               </p>
               <p className="text-sm opacity-90">Based on total completions: {lifetimeCompleted}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Trends Chart */}
      {trends?.trends && trends.trends.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            Task Creation vs Completion Trends
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={trends.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="created"
                stackId="1"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.7}
                name="Created"
              />
              <Area
                type="monotone"
                dataKey="completed"
                stackId="2"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.7}
                name="Completed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  )
}

export default Analytics 