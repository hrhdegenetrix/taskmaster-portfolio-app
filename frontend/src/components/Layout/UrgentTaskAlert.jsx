import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Clock, X, ArrowRight } from 'lucide-react'
import { useTask } from '../../contexts/TaskContext'
import { Link } from 'react-router-dom'
import { format, isToday } from 'date-fns'

const UrgentTaskAlert = () => {
  const { tasks } = useTask()
  const [isDismissed, setIsDismissed] = React.useState(false)

  // Find urgent and overdue tasks
  const criticalTasks = tasks.filter(task => 
    (task.priority === 'URGENT' || task.priority === 'OVERDUE') && 
    task.dueDate && 
    !task.completed &&
    (task.priority === 'OVERDUE' || isToday(new Date(task.dueDate)))
  )

  // Don't show if no critical tasks or dismissed
  if (criticalTasks.length === 0 || isDismissed) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 dark:from-red-800 dark:via-red-900 dark:to-red-950 text-white shadow-lg border-b border-red-800 dark:border-red-900"
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold flex items-center">
                  {criticalTasks.some(t => t.priority === 'OVERDUE') ? '💀' : '🚨'} 
                  {criticalTasks.some(t => t.priority === 'OVERDUE') ? ' Overdue' : ' Urgent'} Task{criticalTasks.length > 1 ? 's' : ''} Need Attention!
                </h3>
                <div className="mt-1">
                  {criticalTasks.slice(0, 2).map((task, index) => (
                    <div key={task.id} className="flex items-center space-x-2 text-sm">
                      <span className="text-xs">
                        {task.priority === 'OVERDUE' ? '💀' : '🚨'}
                      </span>
                      <span className="font-medium">{task.title}</span>
                      {task.dueDate && (
                        <span className="opacity-90">
                          • {task.priority === 'OVERDUE' ? 'Overdue' : `Due ${format(new Date(task.dueDate), 'h:mm a')}`}
                        </span>
                      )}
                    </div>
                  ))}
                  {criticalTasks.length > 2 && (
                    <div className="text-sm opacity-90 mt-1">
                      +{criticalTasks.length - 2} more critical task{criticalTasks.length - 2 > 1 ? 's' : ''}
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