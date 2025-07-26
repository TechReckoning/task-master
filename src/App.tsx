import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckSquare, ListBullets, Tag, Warning, Minus } from "@phosphor-icons/react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { useKV } from "@github/spark/hooks"
import { Task, Category, Priority } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Toaster } from "@/components/ui/sonner"
import TaskItem from "@/components/TaskItem"
import AddTaskForm from "@/components/AddTaskForm"
import CategoryManager from "@/components/CategoryManager"
import { toast } from "sonner"

function App() {
  const [tasks, setTasks] = useKV<Task[]>("tasks", [])
  const [categories, setCategories] = useKV<Category[]>("categories", [])
  const [activeFilter, setActiveFilter] = useState<string>("all")

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

  const addTask = (title: string, categoryId?: string, priority: Priority = 'medium') => {
    const maxOrder = Math.max(...tasks.map(t => t.order || 0), 0)
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      category: categoryId || "",
      createdAt: Date.now(),
      order: maxOrder + 1,
      priority
    }
    
    setTasks(currentTasks => [...currentTasks, newTask])
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
        const filteredTasks = filteredTasks_memo
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
    } else if (activeFilter !== "all") {
      filtered = filtered.filter(task => task.category === activeFilter)
    }

    return filtered.sort((a, b) => {
      // First sort by completion status
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
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
    return { total, completed, pending, high, medium, low }
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
        </header>

        <div className="grid gap-6 md:grid-cols-5 mb-8">
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
            <div className="text-2xl font-bold text-red-600">{stats.high}</div>
            <div className="text-sm text-muted-foreground">High Priority</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
            <div className="text-sm text-muted-foreground">Medium Priority</div>
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