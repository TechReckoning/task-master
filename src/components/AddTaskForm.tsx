import { useState, lazy, Suspense } from "react"
import { CalendarDots, Plus, NotePencil, Bell } from "@phosphor-icons/react"
import { Category, Priority, ReminderType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { formatDate, getReminderLabel } from "@/lib/utils"

const MDEditor = lazy(() => import('@uiw/react-md-editor'))

export default function AddTaskForm({ 
  onAdd, 
  categories 
}: {
  onAdd: (title: string, categoryId?: string, priority?: Priority, dueDate?: number, notes?: string, reminderType?: ReminderType) => void
  categories: Category[]
}) {
  const [title, setTitle] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedPriority, setSelectedPriority] = useState<Priority>("medium")
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [notes, setNotes] = useState<string>("")
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [reminderType, setReminderType] = useState<ReminderType>("none")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onAdd(
        title.trim(), 
        selectedCategory || undefined, 
        selectedPriority,
        dueDate?.getTime(),
        notes.trim() || undefined,
        reminderType
      )
      setTitle("")
      setSelectedCategory("")
      setSelectedPriority("medium")
      setDueDate(undefined)
      setNotes("")
      setIsNotesOpen(false)
      setReminderType("none")
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    setDueDate(date)
    setIsCalendarOpen(false)
  }

  const clearDueDate = () => {
    setDueDate(undefined)
    setReminderType("none") // Clear reminder when due date is cleared
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            id="new-task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a new task..."
            className="border-input focus:border-primary transition-colors"
          />
        </div>
        <Select value={selectedPriority} onValueChange={(value: Priority) => setSelectedPriority(value)}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        {categories.length > 0 && (
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No category</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      <div className="flex gap-2 items-center">
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              type="button"
              className="flex-1 justify-start text-left font-normal"
            >
              <CalendarDots className="mr-2 h-4 w-4" />
              {dueDate ? formatDate(dueDate.getTime()) : "Set due date (optional)"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {dueDate && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearDueDate}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Reminder selection - only show if due date is set */}
      {dueDate && (
        <div className="flex gap-2 items-center">
          <Select value={reminderType} onValueChange={(value: ReminderType) => setReminderType(value)}>
            <SelectTrigger className="flex-1">
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

      <Collapsible open={isNotesOpen} onOpenChange={setIsNotesOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            type="button"
            className="w-full justify-start text-left font-normal"
          >
            <NotePencil className="mr-2 h-4 w-4" />
            {notes ? "Edit notes" : "Add notes (optional)"}
            {notes && <span className="ml-auto text-xs text-muted-foreground">Has content</span>}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div data-color-mode="light">
            <Suspense fallback={<div className="h-48 bg-muted rounded animate-pulse" />}>
              <MDEditor
                value={notes}
                onChange={(val) => setNotes(val || "")}
                preview="edit"
                hideToolbar={false}
                visibleDragBar={false}
                textareaProps={{
                  placeholder: "Add detailed notes, descriptions, or instructions for this task...",
                  style: { minHeight: 120 }
                }}
                height={200}
              />
            </Suspense>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex justify-end">
        <Button type="submit" className="px-6">
          <Plus className="w-4 h-4 mr-1" />
          Add Task
        </Button>
      </div>
    </form>
  )
}