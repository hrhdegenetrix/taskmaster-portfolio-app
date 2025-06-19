import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from 'react-query'
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Calendar,
  Trophy,
  Zap,
  Flame,
  Star,
  Award,
  Crown,
  Rocket,
  Heart,
  Coffee,
  Brain,
  CheckCircle,
  Clock,
  Sparkles,
  ChevronDown,
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
import toast from 'react-hot-toast'

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [showAchievements, setShowAchievements] = useState(true)

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

  // Achievement system - calculate achievements based on data
  const getAchievements = () => {
    if (!overview?.overview) return []
    
    // Use lifetime data for achievements (not period-filtered data)
    const { lifetimeTotalTasks, lifetimeCompletedTasks, lifetimeCompletionRate } = overview.overview
    const currentStreak = productivity?.streaks?.current || 0
    const longestStreak = productivity?.streaks?.longest || 0
    
    const achievements = [
      {
        id: 'first-task',
        title: 'Getting Started! 🌱',
        description: 'Created your first task',
        icon: Sparkles,
        unlocked: lifetimeTotalTasks >= 1,
        progress: Math.min(lifetimeTotalTasks, 1),
        max: 1,
        color: 'from-green-400 to-green-600'
      },
      {
        id: 'task-creator',
        title: 'Task Creator 📝',
        description: 'Created 10 tasks',
        icon: CheckCircle,
        unlocked: lifetimeTotalTasks >= 10,
        progress: Math.min(lifetimeTotalTasks, 10),
        max: 10,
        color: 'from-blue-400 to-blue-600'
      },
      {
        id: 'productivity-ninja',
        title: 'Productivity Ninja 🥷',
        description: 'Created 50 tasks',
        icon: Zap,
        unlocked: lifetimeTotalTasks >= 50,
        progress: Math.min(lifetimeTotalTasks, 50),
        max: 50,
        color: 'from-purple-400 to-purple-600'
      },
      {
        id: 'task-master',
        title: 'Task Master 👑',
        description: 'Created 100 tasks',
        icon: Crown,
        unlocked: lifetimeTotalTasks >= 100,
        progress: Math.min(lifetimeTotalTasks, 100),
        max: 100,
        color: 'from-yellow-400 to-yellow-600'
      },
      {
        id: 'completionist',
        title: 'Completionist ✅',
        description: 'Completed 25 tasks',
        icon: Trophy,
        unlocked: lifetimeCompletedTasks >= 25,
        progress: Math.min(lifetimeCompletedTasks, 25),
        max: 25,
        color: 'from-emerald-400 to-emerald-600'
      },
      {
        id: 'high-achiever',
        title: 'High Achiever 🏆',
        description: 'Completed 100 tasks',
        icon: Award,
        unlocked: lifetimeCompletedTasks >= 100,
        progress: Math.min(lifetimeCompletedTasks, 100),
        max: 100,
        color: 'from-orange-400 to-orange-600'
      },
      {
        id: 'perfectionist',
        title: 'Perfectionist 💎',
        description: 'Achieve 90% completion rate',
        icon: Star,
        unlocked: lifetimeCompletionRate >= 90,
        progress: Math.min(lifetimeCompletionRate, 90),
        max: 90,
        color: 'from-pink-400 to-pink-600'
      },
      {
        id: 'streak-starter',
        title: 'On a Roll! 🔥',
        description: 'Complete tasks 3 days in a row',
        icon: Flame,
        unlocked: currentStreak >= 3,
        progress: Math.min(currentStreak, 3),
        max: 3,
        color: 'from-red-400 to-red-600'
      },
      {
        id: 'streak-master',
        title: 'Unstoppable! 🚀',
        description: 'Complete tasks 7 days in a row',
        icon: Rocket,
        unlocked: longestStreak >= 7,
        progress: Math.min(longestStreak, 7),
        max: 7,
        color: 'from-indigo-400 to-indigo-600'
      },
      {
        id: 'dedication',
        title: 'Dedicated Soul 💪',
        description: 'Complete tasks 30 days in a row',
        icon: Heart,
        unlocked: longestStreak >= 30,
        progress: Math.min(longestStreak, 30),
        max: 30,
        color: 'from-rose-400 to-rose-600'
      }
    ]
    
    return achievements.sort((a, b) => b.unlocked - a.unlocked)
  }

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

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-2xl bg-gradient-to-r ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-4 text-sm">
          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-green-500 font-medium">{trend}</span>
        </div>
      )}
    </motion.div>
  )

  const AchievementBadge = ({ achievement }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
        achievement.unlocked 
          ? `bg-gradient-to-r ${achievement.color} text-white border-transparent shadow-lg`
          : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'
      }`}
    >
      <div className="flex items-center space-x-3">
        <achievement.icon className={`w-6 h-6 ${achievement.unlocked ? 'text-white' : 'text-gray-400'}`} />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold truncate">{achievement.title}</h3>
          <p className="text-xs opacity-90 truncate">{achievement.description}</p>
          <div className="mt-2 bg-black bg-opacity-20 rounded-full h-2">
            <div 
              className="bg-white bg-opacity-80 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(achievement.progress / achievement.max) * 100}%` }}
            />
          </div>
        </div>
      </div>
      {achievement.unlocked && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
          <Trophy className="w-2 h-2 text-white" />
        </div>
      )}
    </motion.div>
  )

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

  const achievements = getAchievements()
  const unlockedCount = achievements.filter(a => a.unlocked).length

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

      {/* Overview Stats */}
      {overview?.overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Tasks"
            value={overview.overview.lifetimeTotalTasks}
            icon={CheckCircle}
            color="from-blue-500 to-blue-600"
            subtitle={`${overview.overview.totalTasks} this ${selectedPeriod}`}
          />
          <StatCard
            title="Completed"
            value={overview.overview.lifetimeCompletedTasks}
            icon={Trophy}
            color="from-green-500 to-green-600"
            subtitle={`${overview.overview.lifetimeCompletionRate}% lifetime rate`}
          />
          <StatCard
            title="In Progress"
            value={overview.overview.inProgressTasks}
            icon={Zap}
            color="from-yellow-500 to-yellow-600"
            subtitle="Active tasks"
          />
          <StatCard
            title="Current Streak"
            value={productivity?.streaks?.current || 0}
            icon={Flame}
            color="from-red-500 to-red-600"
            subtitle={`Best: ${productivity?.streaks?.longest || 0} days`}
          />
        </div>
      )}

      {/* Achievements Section */}
      {showAchievements && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Achievements 🏆
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {unlockedCount} of {achievements.length} unlocked
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAchievements(!showAchievements)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showAchievements ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.slice(0, 6).map(achievement => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </motion.div>
      )}

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
                 {overview?.overview?.lifetimeCompletionRate > 80 ? 'Excellent! 🔥' : 
                  overview?.overview?.lifetimeCompletionRate > 60 ? 'Great! 👍' : 
                  overview?.overview?.lifetimeCompletionRate > 40 ? 'Good! 💪' : 'Keep Going! 🌱'}
               </p>
               <p className="text-sm opacity-90">Based on lifetime completion rate</p>
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