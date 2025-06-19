import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Clock, X, ArrowRight } from 'lucide-react'
import { useTask } from '../../contexts/TaskContext'
import { Link } from 'react-router-dom'
import { format, isToday } from 'date-fns'

const UrgentTaskAlert = () => {
  const { tasks } = useTask()
  const [isDismissed, setIsDismissed] = React.useState(false)

  // Find urgent tasks due today
  const urgentTasksToday = tasks.filter(task => 
    task.priority === 'URGENT' && 
    task.dueDate && 
    isToday(new Date(task.dueDate)) &&
    !task.completed
  )

  // Don't show if no urgent tasks or dismissed
  if (urgentTasksToday.length === 0 || isDismissed) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white shadow-lg border-b border-red-800"
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold flex items-center">
                  🚨 Urgent Task{urgentTasksToday.length > 1 ? 's' : ''} Due Today!
                </h3>
                <div className="mt-1">
                  {urgentTasksToday.slice(0, 2).map((task, index) => (
                    <div key={task.id} className="flex items-center space-x-2 text-sm">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">{task.title}</span>
                      {task.dueDate && (
                        <span className="opacity-90">
                          • Due {format(new Date(task.dueDate), 'h:mm a')}
                        </span>
                      )}
                    </div>
                  ))}
                  {urgentTasksToday.length > 2 && (
                    <div className="text-sm opacity-90 mt-1">
                      +{urgentTasksToday.length - 2} more urgent task{urgentTasksToday.length - 2 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                to="/tasks"
                className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
              >
                <span>View Tasks</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <button
                onClick={() => setIsDismissed(true)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
                title="Dismiss alert"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default UrgentTaskAlert 