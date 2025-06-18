import React from 'react'
import { Settings as SettingsIcon } from 'lucide-react'

const Settings = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Settings Page
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          App preferences and configuration coming soon...
        </p>
      </div>
    </div>
  )
}

export default Settings 