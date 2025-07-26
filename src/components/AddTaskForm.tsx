import { useState } from "react"
import { CalendarDots, Plus } from "@phosphor-icons/react"
import { Category, Priority } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { formatDate } from "@/lib/utils"

export default function AddTaskForm({ 
  onAdd, 
  categories 
}: {
  onAdd: (title: string, categoryId?: string, priority?: Priority, dueDate?: number) => void
  categories: Category[]
}) {
  const [title, setTitle] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedPriority, setSelectedPriority] = useState<Priority>("medium")
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onAdd(
        title.trim(), 
        selectedCategory || undefined, 
        selectedPriority,
        dueDate?.getTime()
      )
      setTitle("")
      setSelectedCategory("")
      setSelectedPriority("medium")
      setDueDate(undefined)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    setDueDate(date)
    setIsCalendarOpen(false)
  }

  const clearDueDate = () => {
    setDueDate(undefined)
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
        <Button type="submit" className="px-6">
          <Plus className="w-4 h-4 mr-1" />
          Add Task
        </Button>
      </div>
    </form>
  )
}