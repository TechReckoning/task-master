import { useState } from "react"
import { Plus } from "@phosphor-icons/react"
import { Category, Priority } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AddTaskForm({ 
  onAdd, 
  categories 
}: {
  onAdd: (title: string, categoryId?: string, priority?: Priority) => void
  categories: Category[]
}) {
  const [title, setTitle] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedPriority, setSelectedPriority] = useState<Priority>("medium")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onAdd(title.trim(), selectedCategory || undefined, selectedPriority)
      setTitle("")
      setSelectedCategory("")
      setSelectedPriority("medium")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
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
      <Button type="submit" className="px-4">
        <Plus className="w-4 h-4 mr-1" />
        Add
      </Button>
    </form>
  )
}