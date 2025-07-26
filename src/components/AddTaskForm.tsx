import { useState } from "react"
import { Plus } from "@phosphor-icons/react"
import { Category } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AddTaskForm({ 
  onAdd, 
  categories 
}: {
  onAdd: (title: string, categoryId?: string) => void
  categories: Category[]
}) {
  const [title, setTitle] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onAdd(title.trim(), selectedCategory || undefined)
      setTitle("")
      setSelectedCategory("")
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
      {categories.length > 0 && (
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-40">
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