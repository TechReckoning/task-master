import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Tag, Check, Trash2, DotsSixVertical } from "@phosphor-icons/react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useKV } from "@github/spark/hooks"
import { Task, Category } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function TaskItem({ task, onToggle, onDelete, categories }: {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  categories: Category[]
}) {
  const category = categories.find(c => c.id === task.category)
  
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
      }`}>
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors touch-none"
          >
            <DotsSixVertical className="w-4 h-4" />
          </div>
          <Checkbox
            id={`task-${task.id}`}
            checked={task.completed}
            onCheckedChange={() => onToggle(task.id)}
            className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
          />
          <div className="flex-1 min-w-0">
            <p className={`font-medium transition-all duration-200 ${
              task.completed 
                ? 'line-through text-muted-foreground' 
                : 'text-card-foreground'
            }`}>
              {task.title}
            </p>
            {category && (
              <Badge variant="secondary" className="mt-1 text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {category.name}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(task.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}