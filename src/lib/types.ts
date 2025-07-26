export type Priority = 'high' | 'medium' | 'low'
export type ReminderType = 'none' | '15min' | '30min' | '1hour' | '2hours' | '1day' | '3days' | '1week'

export interface Reminder {
  id: string
  taskId: string
  reminderTime: number // timestamp when reminder should fire
  type: ReminderType
  triggered: boolean
  snoozedUntil?: number // if snoozed, timestamp when to show again
}

export interface Task {
  id: string
  title: string
  completed: boolean
  category: string
  createdAt: number
  order: number
  priority: Priority
  dueDate?: number // timestamp for due date
  notes?: string // rich text notes/description in markdown format
  reminderType?: ReminderType // type of reminder set for this task
}

export interface Category {
  id: string
  name: string
  color?: string
}