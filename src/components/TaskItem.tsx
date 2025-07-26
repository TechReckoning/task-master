import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Tag, Check, Trash2, DotsSixVertical, Warning, Minus } from "@phosphor-icons/react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useKV } from "@github/spark/hooks"
import { Task, Category, Priority } from "@/lib/types"
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

  const priorityConfig = getPriorityConfig(task.priority || 'medium')
  
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
      } ${task.priority === 'high' ? 'border-l-4 border-l-red-500' : ''}`}>
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
            <p className={`font-medium transition-all duration-200 ${
              task.completed 
                ? 'line-through text-muted-foreground' 
                : 'text-card-foreground'
            }`}>
              {task.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
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
            </div>
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