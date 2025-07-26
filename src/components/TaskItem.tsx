import { useState, useRef, useEffect, lazy, Suspense } from "react"
import { motion } from "framer-motion"
import { Plus, Tag, Check, Trash2, DotsSixVertical, Warning, Minus, CalendarDots, Clock, PencilSimple, X, NotePencil, CaretDown, CaretRight, Bell } from "@phosphor-icons/react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useKV } from "@github/spark/hooks"
import { Task, Category, Priority, ReminderType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { formatDate, isOverdue, getDaysUntilDue, getReminderLabel } from "@/lib/utils"
import { toast } from "sonner"

const MDEditor = lazy(() => import('@uiw/react-md-editor'))

export default function TaskItem({ task, onToggle, onDelete, onUpdate, categories, onReminderUpdate }: {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Task>) => void
  categories: Category[]
  onReminderUpdate?: (task: Task, reminderType: ReminderType) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editNotes, setEditNotes] = useState(task.notes || "")
  const inputRef = useRef<HTMLInputElement>(null)
  const category = categories.find(c => c.id === task.category)
  
  const getPriorityConfig = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200',
          icon: Warning,
          label: 'High'
        }
      case 'medium':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50 border-yellow-200',
          icon: Minus,
          label: 'Medium'
        }
      case 'low':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200',
          icon: Check,
          label: 'Low'
        }
    }
  }

  const getDueDateInfo = () => {
    if (!task.dueDate) return null
    
    const overdue = isOverdue(task.dueDate)
    const daysUntil = getDaysUntilDue(task.dueDate)
    
    if (overdue) {
      return {
        text: `Overdue (${Math.abs(daysUntil)} days)`,
        className: 'text-red-600 border-red-200 bg-red-50',
        icon: Clock
      }
    } else if (daysUntil === 0) {
      return {
        text: 'Due today',
        className: 'text-orange-600 border-orange-200 bg-orange-50',
        icon: CalendarDots
      }
    } else if (daysUntil === 1) {
      return {
        text: 'Due tomorrow',
        className: 'text-yellow-600 border-yellow-200 bg-yellow-50',
        icon: CalendarDots
      }
    } else {
      return {
        text: formatDate(task.dueDate),
        className: 'text-blue-600 border-blue-200 bg-blue-50',
        icon: CalendarDots
      }
    }
  }

  const priorityConfig = getPriorityConfig(task.priority || 'medium')
  const dueDateInfo = getDueDateInfo()

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditTitle(task.title)
  }

  const handleSaveEdit = () => {
    const trimmedTitle = editTitle.trim()
    if (trimmedTitle && trimmedTitle !== task.title) {
      onUpdate(task.id, { title: trimmedTitle })
    }
    setIsEditing(false)
    setEditTitle(task.title)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditTitle(task.title)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const handleStartEditNotes = () => {
    setIsEditingNotes(true)
    setEditNotes(task.notes || "")
    setIsNotesOpen(true)
  }

  const handleSaveNotes = () => {
    onUpdate(task.id, { notes: editNotes.trim() || undefined })
    setIsEditingNotes(false)
    toast.success("Notes updated!")
  }

  const handleCancelEditNotes = () => {
    setIsEditingNotes(false)
    setEditNotes(task.notes || "")
  }
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  
  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`group ${isDragging ? 'z-50' : ''}`}
    >
      <Card className={`p-4 hover:shadow-md transition-all duration-200 border border-border/50 ${
        isDragging ? 'shadow-lg rotate-2 bg-card/95' : ''
      } ${task.priority === 'high' ? 'border-l-4 border-l-red-500' : ''} ${
        dueDateInfo?.text.includes('Overdue') ? 'border-l-4 border-l-red-500' : ''
      }`}>
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors touch-none"
          >
            <DotsSixVertical className="w-4 h-4" />
          </div>
          <div className={`w-2 h-2 rounded-full ${priorityConfig.color} flex-shrink-0`} />
          <Checkbox
            id={`task-${task.id}`}
            checked={task.completed}
            onCheckedChange={() => onToggle(task.id)}
            className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
          />
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="text-sm font-medium border-primary/50 focus:border-primary"
                  placeholder="Task title..."
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveEdit}
                  className="h-8 w-8 p-0 hover:bg-accent/10 hover:text-accent"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="group/title flex items-center gap-2">
                <p 
                  className={`font-medium transition-all duration-200 cursor-pointer flex-1 ${
                    task.completed 
                      ? 'line-through text-muted-foreground' 
                      : 'text-card-foreground hover:text-primary'
                  }`}
                  onClick={handleStartEdit}
                  title="Click to edit"
                >
                  {task.title}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleStartEdit}
                  className="h-6 w-6 p-0 opacity-0 group-hover/title:opacity-100 transition-opacity hover:bg-accent/10 hover:text-accent"
                >
                  <PencilSimple className="w-3 h-3" />
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge 
                variant="outline" 
                className={`text-xs ${priorityConfig.textColor} border-current`}
              >
                <priorityConfig.icon className="w-3 h-3 mr-1" />
                {priorityConfig.label}
              </Badge>
              {category && (
                <Badge variant="secondary" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {category.name}
                </Badge>
              )}
              {dueDateInfo && (
                <Badge variant="outline" className={`text-xs ${dueDateInfo.className}`}>
                  <dueDateInfo.icon className="w-3 h-3 mr-1" />
                  {dueDateInfo.text}
                </Badge>
              )}
              {task.reminderType && task.reminderType !== 'none' && task.dueDate && (
                <Badge variant="outline" className="text-xs text-purple-600 border-purple-200">
                  <Bell className="w-3 h-3 mr-1" />
                  {getReminderLabel(task.reminderType)}
                </Badge>
              )}
              {task.notes && (
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                  <NotePencil className="w-3 h-3 mr-1" />
                  Has notes
                </Badge>
              )}
            </div>
            {task.notes && (
              <Collapsible open={isNotesOpen} onOpenChange={setIsNotesOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-auto p-2 text-left justify-start w-full hover:bg-accent/5"
                  >
                    {isNotesOpen ? (
                      <CaretDown className="w-3 h-3 mr-1" />
                    ) : (
                      <CaretRight className="w-3 h-3 mr-1" />
                    )}
                    <NotePencil className="w-3 h-3 mr-1" />
                    {isNotesOpen ? "Hide notes" : "Show notes"}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  {isEditingNotes ? (
                    <div className="space-y-2">
                      <div data-color-mode="light">
                        <Suspense fallback={<div className="h-32 bg-muted rounded animate-pulse" />}>
                          <MDEditor
                            value={editNotes}
                            onChange={(val) => setEditNotes(val || "")}
                            preview="edit"
                            hideToolbar={false}
                            visibleDragBar={false}
                            height={150}
                            textareaProps={{
                              placeholder: "Add detailed notes, descriptions, or instructions for this task...",
                            }}
                          />
                        </Suspense>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveNotes}>
                          <Check className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEditNotes}>
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group/notes">
                      <div 
                        data-color-mode="light" 
                        className="prose prose-sm max-w-none p-3 bg-muted/20 rounded-md border cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={handleStartEditNotes}
                      >
                        <Suspense fallback={<div className="h-16 bg-muted rounded animate-pulse" />}>
                          <MDEditor.Markdown source={task.notes} />
                        </Suspense>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleStartEditNotes}
                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover/notes:opacity-100 transition-opacity hover:bg-accent/10 hover:text-accent"
                      >
                        <PencilSimple className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
            {!task.notes && !isNotesOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartEditNotes}
                className="mt-2 h-auto p-2 text-left justify-start opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent/5"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add notes
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent/10 hover:text-accent"
                  disabled={isEditing}
                >
                  <PencilSimple className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Task</DialogTitle>
                </DialogHeader>
                <TaskEditDialog 
                  task={task} 
                  categories={categories} 
                  onUpdate={onUpdate}
                  onReminderUpdate={onReminderUpdate}
                />
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
              disabled={isEditing}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// Task edit dialog component
function TaskEditDialog({ task, categories, onUpdate, onReminderUpdate }: {
  task: Task
  categories: Category[]
  onUpdate: (id: string, updates: Partial<Task>) => void
  onReminderUpdate?: (task: Task, reminderType: ReminderType) => void
}) {
  const [title, setTitle] = useState(task.title)
  const [priority, setPriority] = useState<Priority>(task.priority || 'medium')
  const [category, setCategory] = useState(task.category || '')
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task.dueDate ? new Date(task.dueDate) : undefined
  )
  const [reminderType, setReminderType] = useState<ReminderType>(task.reminderType || 'none')
  const [notes, setNotes] = useState(task.notes || '')

  const handleSave = () => {
    const updates: Partial<Task> = {
      title: title.trim(),
      priority,
      category: category || '',
      dueDate: dueDate?.getTime(),
      reminderType: dueDate ? reminderType : 'none',
      notes: notes.trim() || undefined
    }

    onUpdate(task.id, updates)
    
    // Update reminder if callback is provided
    if (onReminderUpdate && dueDate) {
      onReminderUpdate({ ...task, ...updates } as Task, reminderType)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-2 block">Task Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Priority</label>
          <Select value={priority} onValueChange={(value: Priority) => setPriority(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="No category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No category</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Due Date</label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 justify-start text-left font-normal"
              >
                <CalendarDots className="mr-2 h-4 w-4" />
                {dueDate ? formatDate(dueDate.getTime()) : "Set due date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={(date) => {
                  setDueDate(date)
                  if (!date) setReminderType('none')
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {dueDate && (
            <Button
              variant="ghost"
              onClick={() => {
                setDueDate(undefined)
                setReminderType('none')
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {dueDate && (
        <div>
          <label className="text-sm font-medium mb-2 block">Reminder</label>
          <Select value={reminderType} onValueChange={(value: ReminderType) => setReminderType(value)}>
            <SelectTrigger>
              <div className="flex items-center">
                <Bell className="mr-2 h-4 w-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No reminder</SelectItem>
              <SelectItem value="15min">15 minutes before</SelectItem>
              <SelectItem value="30min">30 minutes before</SelectItem>
              <SelectItem value="1hour">1 hour before</SelectItem>
              <SelectItem value="2hours">2 hours before</SelectItem>
              <SelectItem value="1day">1 day before</SelectItem>
              <SelectItem value="3days">3 days before</SelectItem>
              <SelectItem value="1week">1 week before</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <label className="text-sm font-medium mb-2 block">Notes</label>
        <div data-color-mode="light">
          <Suspense fallback={<div className="h-48 bg-muted rounded animate-pulse" />}>
            <MDEditor
              value={notes}
              onChange={(val) => setNotes(val || "")}
              preview="edit"
              hideToolbar={false}
              visibleDragBar={false}
              height={200}
              textareaProps={{
                placeholder: "Add detailed notes, descriptions, or instructions for this task..."
              }}
            />
          </Suspense>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}