import { useState } from "react"
import { Plus, Tag, Trash2 } from "@phosphor-icons/react"
import { Category } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export default function CategoryManager({
  categories,
  onAdd,
  onDelete
}: {
  categories: Category[]
  onAdd: (name: string) => void
  onDelete: (id: string) => void
}) {
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newCategoryName.trim()) {
      onAdd(newCategoryName.trim())
      setNewCategoryName("")
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Tag className="w-4 h-4 mr-1" />
          Manage Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              id="new-category"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name..."
              className="flex-1"
            />
            <Button type="submit" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </form>
          
          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No categories yet. Create one above.
              </p>
            ) : (
              categories.map(category => (
                <Card key={category.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      <Tag className="w-3 h-3 mr-1" />
                      {category.name}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(category.id)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}