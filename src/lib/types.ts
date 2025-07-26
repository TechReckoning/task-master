export type Priority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  completed: boolean
  category: string
  createdAt: number
  order: number
  priority: Priority
}

export interface Category {
  id: string
  name: string
  color?: string
}