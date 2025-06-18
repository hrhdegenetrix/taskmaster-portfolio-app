import React from 'react'
import { FolderOpen } from 'lucide-react'

const Categories = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Categories Page
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Category management interface coming soon...
        </p>
      </div>
    </div>
  )
}

export default Categories 