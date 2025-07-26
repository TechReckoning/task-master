import { useState, useMemo, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckSquare, ListBullets, Tag, Warning, Minus, Clock, CalendarDots, CalendarX, Bell } from "@phosphor-icons/react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { useKV } from "@github/spark/hooks"
import { Task, Category, Priority, ReminderType, Reminder } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import TaskItem from "@/components/TaskItem"
import AddTaskForm from "@/components/AddTaskForm"
import CategoryManager from "@/components/CategoryManager"
import { isOverdue, calculateReminderTime, formatReminderTime } from "@/lib/utils"
import { toast } from "sonner"

function App() {
  const [tasks, setTasks] = useKV<Task[]>("tasks", [])
  const [categories, setCategories] = useKV<Category[]>("categories", [])
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [reminders, setReminders] = useKV<Reminder[]>("reminders", [])
  const [reminderPermission, setReminderPermission] = useKV<string>("reminder-permission", "default")

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setReminderPermission(permission)
      if (permission === 'granted') {
        toast.success("Notifications enabled! You'll receive reminders for your tasks.")
      }
      return permission === 'granted'
    }
    return false
  }, [setReminderPermission])

  // Create or update reminder for a task
  const createReminder = useCallback((task: Task, reminderType: ReminderType) => {
    if (!task.dueDate || reminderType === 'none') {
      // Remove existing reminder if any
      setReminders(current => current.filter(r => r.taskId !== task.id))
      return
    }

    const reminderTime = calculateReminderTime(task.dueDate, reminderType)
    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      taskId: task.id,
      reminderTime,
      type: reminderType,
      triggered: false
    }

    setReminders(current => {
      // Remove any existing reminder for this task
      const filtered = current.filter(r => r.taskId !== task.id)
      return [...filtered, newReminder]
    })
  }, [setReminders])

  // Show notification for a reminder
  const showNotification = useCallback((task: Task, reminder: Reminder) => {
    if (reminderPermission === 'granted' && 'Notification' in window) {
      const notification = new Notification(`Task Reminder: ${task.title}`, {
        body: task.dueDate ? `Due ${formatReminderTime(task.dueDate)}` : 'No due date set',
        icon: '/favicon.ico',
        tag: `task-${task.id}`,
        requireInteraction: true
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000)
    }

    // Also show toast notification
    toast(`⏰ Task Reminder: ${task.title}`, {
      description: task.dueDate ? `Due ${formatReminderTime(task.dueDate)}` : 'No due date set',
      duration: 10000,
      action: {
        label: 'Snooze 15min',
        onClick: () => {
          const snoozeUntil = Date.now() + (15 * 60 * 1000)
          setReminders(current =>
            current.map(r =>
              r.id === reminder.id
                ? { ...r, snoozedUntil: snoozeUntil, triggered: false }
                : r
            )
          )
          toast.success(`Reminder snoozed for 15 minutes`)
        }
      }
    })
  }, [reminderPermission, setReminders])

  // Check for due reminders
  const checkReminders = useCallback(() => {
    setReminders(currentReminders => {
      const now = Date.now()
      let hasChanges = false
      
      const updatedReminders = currentReminders.map(reminder => {
        // Skip if already triggered or snoozed
        if (reminder.triggered || (reminder.snoozedUntil && reminder.snoozedUntil > now)) {
          return reminder
        }

        // Skip if reminder time hasn't arrived yet
        if (reminder.reminderTime > now) {
          return reminder
        }

        // Find the corresponding task
        const task = tasks.find(t => t.id === reminder.taskId)
        if (!task || task.completed) {
          return reminder
        }

        // Show notification and mark as triggered
        showNotification(task, reminder)
        hasChanges = true
        return { ...reminder, triggered: true }
      })
      
      return hasChanges ? updatedReminders : currentReminders
    })
  }, [tasks, showNotification, setReminders])

  // Clean up reminders for completed or deleted tasks
  const cleanupReminders = useCallback(() => {
    setReminders(currentReminders => {
      const taskIds = new Set(tasks.map(t => t.id))
      const filteredReminders = currentReminders.filter(r => {
        const task = tasks.find(t => t.id === r.taskId)
        return taskIds.has(r.taskId) && task && !task.completed
      })
      
      // Only return new array if there are changes
      return filteredReminders.length !== currentReminders.length ? filteredReminders : currentReminders
    })
  }, [tasks, setReminders])

  // Set up interval to check reminders
  useEffect(() => {
    const interval = setInterval(() => {
      checkReminders()
      cleanupReminders()
    }, 60000) // Check every 60 seconds instead of 30

    // Check immediately
    checkReminders()
    cleanupReminders()

    return () => clearInterval(interval)
  }, [checkReminders, cleanupReminders])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const addTask = (title: string, categoryId?: string, priority: Priority = 'medium', dueDate?: number, notes?: string, reminderType: ReminderType = 'none') => {
    const maxOrder = Math.max(...tasks.map(t => t.order || 0), 0)
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      category: categoryId || "",
      createdAt: Date.now(),
      order: maxOrder + 1,
      priority,
      dueDate,
      notes,
      reminderType: dueDate ? reminderType : 'none'
    }
    
    setTasks(currentTasks => [...currentTasks, newTask])
    
    // Create reminder if needed
    if (dueDate && reminderType !== 'none') {
      createReminder(newTask, reminderType)
    }
    
    toast.success("Task added!")
  }

  const toggleTask = (id: string) => {
    setTasks(currentTasks =>
      currentTasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    )
  }

  const deleteTask = (id: string) => {
    setTasks(currentTasks => currentTasks.filter(task => task.id !== id))
    toast.success("Task deleted")
  }

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(currentTasks =>
      currentTasks.map(task =>
        task.id === id ? { ...task, ...updates } : task
      )
    )
    toast.success("Task updated!")
  }

  const handleReminderUpdate = (task: Task, reminderType: ReminderType) => {
    createReminder(task, reminderType)
  }

  const addCategory = (name: string) => {
    if (categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Category already exists")
      return
    }
    
    const newCategory: Category = {
      id: crypto.randomUUID(),
      name
    }
    
    setCategories(currentCategories => [...currentCategories, newCategory])
    toast.success("Category created!")
  }

  const deleteCategory = (id: string) => {
    setCategories(currentCategories => currentCategories.filter(cat => cat.id !== id))
    setTasks(currentTasks =>
      currentTasks.map(task =>
        task.category === id ? { ...task, category: "" } : task
      )
    )
    toast.success("Category deleted")
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setTasks(currentTasks => {
        // Get the current filtered tasks for reordering
        const tasksWithDefaults = currentTasks.map((task, index) => ({
          ...task,
          order: task.order ?? index,
          priority: task.priority || 'medium' as Priority
        }))

        let filteredTasks = tasksWithDefaults

        if (activeFilter === "completed") {
          filteredTasks = filteredTasks.filter(task => task.completed)
        } else if (activeFilter === "pending") {
          filteredTasks = filteredTasks.filter(task => !task.completed)
        } else if (activeFilter === "high" || activeFilter === "medium" || activeFilter === "low") {
          filteredTasks = filteredTasks.filter(task => task.priority === activeFilter)
        } else if (activeFilter === "overdue") {
          filteredTasks = filteredTasks.filter(task => task.dueDate && isOverdue(task.dueDate) && !task.completed)
        } else if (activeFilter === "today") {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          filteredTasks = filteredTasks.filter(task => {
            if (!task.dueDate) return false
            const dueDate = new Date(task.dueDate)
            dueDate.setHours(0, 0, 0, 0)
            return dueDate.getTime() === today.getTime()
          })
        } else if (activeFilter === "no-due-date") {
          filteredTasks = filteredTasks.filter(task => !task.dueDate)
        } else if (activeFilter !== "all") {
          filteredTasks = filteredTasks.filter(task => task.category === activeFilter)
        }
        
        const oldIndex = filteredTasks.findIndex(task => task.id === active.id)
        const newIndex = filteredTasks.findIndex(task => task.id === over.id)
        
        if (oldIndex === -1 || newIndex === -1) return currentTasks
        
        const reorderedFiltered = arrayMove(filteredTasks, oldIndex, newIndex)
        
        // Update the order field based on new positions
        const updatedFiltered = reorderedFiltered.map((task, index) => ({
          ...task,
          order: index
        }))
        
        // Merge back with non-filtered tasks
        const nonFilteredTasks = currentTasks.filter(task => 
          !filteredTasks.some(filtered => filtered.id === task.id)
        )
        
        return [...nonFilteredTasks, ...updatedFiltered]
      })
      
      toast.success("Task reordered!")
    }
  }

  const filteredTasks_memo = useMemo(() => {
    // Ensure all tasks have order field and priority for backward compatibility
    const tasksWithDefaults = tasks.map((task, index) => ({
      ...task,
      order: task.order ?? index,
      priority: task.priority || 'medium' as Priority
    }))

    let filtered = tasksWithDefaults

    if (activeFilter === "completed") {
      filtered = filtered.filter(task => task.completed)
    } else if (activeFilter === "pending") {
      filtered = filtered.filter(task => !task.completed)
    } else if (activeFilter === "high" || activeFilter === "medium" || activeFilter === "low") {
      filtered = filtered.filter(task => task.priority === activeFilter)
    } else if (activeFilter === "overdue") {
      filtered = filtered.filter(task => task.dueDate && isOverdue(task.dueDate) && !task.completed)
    } else if (activeFilter === "today") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false
        const dueDate = new Date(task.dueDate)
        dueDate.setHours(0, 0, 0, 0)
        return dueDate.getTime() === today.getTime()
      })
    } else if (activeFilter === "no-due-date") {
      filtered = filtered.filter(task => !task.dueDate)
    } else if (activeFilter !== "all") {
      filtered = filtered.filter(task => task.category === activeFilter)
    }

    return filtered.sort((a, b) => {
      // First sort by completion status
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      // Then by overdue status
      const aOverdue = a.dueDate ? isOverdue(a.dueDate) : false
      const bOverdue = b.dueDate ? isOverdue(b.dueDate) : false
      if (aOverdue !== bOverdue) {
        return aOverdue ? -1 : 1
      }
      // Then by due date (soonest first)
      if (a.dueDate && b.dueDate) {
        if (a.dueDate !== b.dueDate) {
          return a.dueDate - b.dueDate
        }
      } else if (a.dueDate || b.dueDate) {
        return a.dueDate ? -1 : 1
      }
      // Then by priority (high > medium > low)
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      if (a.priority !== b.priority) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      // Finally by order for drag-and-drop positioning
      return (a.order || 0) - (b.order || 0)
    })
  }, [tasks, activeFilter])

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(task => task.completed).length
    const pending = total - completed
    const high = tasks.filter(task => (task.priority || 'medium') === 'high').length
    const medium = tasks.filter(task => (task.priority || 'medium') === 'medium').length
    const low = tasks.filter(task => (task.priority || 'medium') === 'low').length
    const overdue = tasks.filter(task => task.dueDate && isOverdue(task.dueDate) && !task.completed).length
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dueToday = tasks.filter(task => {
      if (!task.dueDate || task.completed) return false
      const dueDate = new Date(task.dueDate)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() === today.getTime()
    }).length
    const noDueDate = tasks.filter(task => !task.dueDate).length
    const withReminders = tasks.filter(task => task.reminderType && task.reminderType !== 'none' && task.dueDate && !task.completed).length
    return { total, completed, pending, high, medium, low, overdue, dueToday, noDueDate, withReminders }
  }, [tasks])

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CheckSquare className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">TaskFlow</h1>
          </div>
          <p className="text-muted-foreground">Organize your day, one task at a time</p>
          
          {/* Notification permission button */}
          {reminderPermission !== 'granted' && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={requestNotificationPermission}
                className="text-sm"
              >
                <Bell className="w-4 h-4 mr-2" />
                Enable Notifications for Reminders
              </Button>
            </div>
          )}
        </header>

        <div className="grid gap-6 md:grid-cols-6 mb-8">
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-accent">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.dueToday}</div>
            <div className="text-sm text-muted-foreground">Due Today</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.withReminders}</div>
            <div className="text-sm text-muted-foreground">With Reminders</div>
          </Card>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ListBullets className="w-5 h-5" />
              Add New Task
            </h2>
            <CategoryManager
              categories={categories}
              onAdd={addCategory}
              onDelete={deleteCategory}
            />
          </div>
          <AddTaskForm onAdd={addTask} categories={categories} />
        </Card>

        <Card className="p-6">
          <Tabs value={activeFilter} onValueChange={setActiveFilter}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Your Tasks</h2>
              <TabsList className="grid w-fit grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </div>

            {(categories.length > 0 || tasks.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge
                  variant={activeFilter === "all" ? "default" : "outline"}
                  className="cursor-pointer transition-colors"
                  onClick={() => setActiveFilter("all")}
                >
                  All
                </Badge>
                {/* Due date filters */}
                {stats.overdue > 0 && (
                  <Badge
                    variant={activeFilter === "overdue" ? "default" : "outline"}
                    className="cursor-pointer transition-colors text-red-600 border-red-200"
                    onClick={() => setActiveFilter("overdue")}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Overdue ({stats.overdue})
                  </Badge>
                )}
                {stats.dueToday > 0 && (
                  <Badge
                    variant={activeFilter === "today" ? "default" : "outline"}
                    className="cursor-pointer transition-colors text-orange-600 border-orange-200"
                    onClick={() => setActiveFilter("today")}
                  >
                    <CalendarDots className="w-3 h-3 mr-1" />
                    Due Today ({stats.dueToday})
                  </Badge>
                )}
                {stats.noDueDate > 0 && (
                  <Badge
                    variant={activeFilter === "no-due-date" ? "default" : "outline"}
                    className="cursor-pointer transition-colors text-gray-600 border-gray-200"
                    onClick={() => setActiveFilter("no-due-date")}
                  >
                    <CalendarX className="w-3 h-3 mr-1" />
                    No Due Date ({stats.noDueDate})
                  </Badge>
                )}
                {/* Priority filters */}
                <Badge
                  variant={activeFilter === "high" ? "default" : "outline"}
                  className="cursor-pointer transition-colors text-red-600 border-red-200"
                  onClick={() => setActiveFilter("high")}
                >
                  <Warning className="w-3 h-3 mr-1" />
                  High Priority
                </Badge>
                <Badge
                  variant={activeFilter === "medium" ? "default" : "outline"}
                  className="cursor-pointer transition-colors text-yellow-600 border-yellow-200"
                  onClick={() => setActiveFilter("medium")}
                >
                  <Minus className="w-3 h-3 mr-1" />
                  Medium Priority
                </Badge>
                <Badge
                  variant={activeFilter === "low" ? "default" : "outline"}
                  className="cursor-pointer transition-colors text-green-600 border-green-200"
                  onClick={() => setActiveFilter("low")}
                >
                  <CheckSquare className="w-3 h-3 mr-1" />
                  Low Priority
                </Badge>
                {/* Category filters */}
                {categories.map(category => (
                  <Badge
                    key={category.id}
                    variant={activeFilter === category.id ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => setActiveFilter(category.id)}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {category.name}
                  </Badge>
                ))}
              </div>
            )}

            <TabsContent value={activeFilter} className="mt-0">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredTasks_memo.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <div className="text-muted-foreground">
                          {tasks.length === 0 ? (
                            <>
                              <CheckSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                              <p className="text-lg mb-2">No tasks yet!</p>
                              <p className="text-sm">Add your first task above to get started.</p>
                            </>
                          ) : (
                            <>
                              <p className="text-lg mb-2">No tasks match this filter</p>
                              <p className="text-sm">Try selecting a different category or status.</p>
                            </>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <SortableContext
                        items={filteredTasks_memo.map(task => task.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {filteredTasks_memo.map(task => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            onToggle={toggleTask}
                            onDelete={deleteTask}
                            onUpdate={updateTask}
                            onReminderUpdate={handleReminderUpdate}
                            categories={categories}
                          />
                        ))}
                      </SortableContext>
                    )}
                  </AnimatePresence>
                </div>
              </DndContext>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}

export default App