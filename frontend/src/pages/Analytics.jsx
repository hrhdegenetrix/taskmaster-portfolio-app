import React from 'react'
import { BarChart3 } from 'lucide-react'

const Analytics = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Analytics Page
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Productivity insights and charts coming soon...
        </p>
      </div>
    </div>
  )
}

export default Analytics 