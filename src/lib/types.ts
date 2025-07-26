export interface Task {
  id: string
  title: string
  completed: boolean
  category: string
  createdAt: number
}

export interface Category {
  id: string
  name: string
  color?: string
}