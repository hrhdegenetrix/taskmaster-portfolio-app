import React from 'react'
import { CheckSquare } from 'lucide-react'

const Tasks = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Tasks Page
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Task management interface coming soon...
        </p>
      </div>
    </div>
  )
}

export default Tasks 