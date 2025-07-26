import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckSquare, ListBullets, Tag } from "@phosphor-icons/react"
import { useKV } from "@github/spark/hooks"
import { Task, Category } from "@/lib/types"
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

  const addTask = (title: string, categoryId?: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      category: categoryId || "",
      createdAt: Date.now()
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

  const filteredTasks = useMemo(() => {
    let filtered = tasks

    if (activeFilter === "completed") {
      filtered = filtered.filter(task => task.completed)
    } else if (activeFilter === "pending") {
      filtered = filtered.filter(task => !task.completed)
    } else if (activeFilter !== "all") {
      filtered = filtered.filter(task => task.category === activeFilter)
    }

    return filtered.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      return b.createdAt - a.createdAt
    })
  }, [tasks, activeFilter])

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(task => task.completed).length
    const pending = total - completed
    return { total, completed, pending }
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

        <div className="grid gap-6 md:grid-cols-3 mb-8">
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

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge
                  variant={activeFilter === "all" ? "default" : "outline"}
                  className="cursor-pointer transition-colors"
                  onClick={() => setActiveFilter("all")}
                >
                  All Categories
                </Badge>
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
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredTasks.length === 0 ? (
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
                    filteredTasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onDelete={deleteTask}
                        categories={categories}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}

export default App