import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date utility functions
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // Reset time for comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
  
  if (dateOnly.getTime() === todayOnly.getTime()) {
    return "Today"
  } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
    return "Tomorrow"
  } else {
    return date.toLocaleDateString()
  }
}

export function isOverdue(timestamp: number): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = new Date(timestamp)
  dueDate.setHours(0, 0, 0, 0)
  return dueDate < today
}

export function getDaysUntilDue(timestamp: number): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = new Date(timestamp)
  dueDate.setHours(0, 0, 0, 0)
  const diffTime = dueDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Reminder utility functions
import { ReminderType } from './types'

export function getReminderLabel(type: ReminderType): string {
  switch (type) {
    case 'none': return 'No reminder'
    case '15min': return '15 minutes before'
    case '30min': return '30 minutes before'
    case '1hour': return '1 hour before'
    case '2hours': return '2 hours before'
    case '1day': return '1 day before'
    case '3days': return '3 days before'
    case '1week': return '1 week before'
    default: return 'No reminder'
  }
}

export function getReminderMinutes(type: ReminderType): number {
  switch (type) {
    case '15min': return 15
    case '30min': return 30
    case '1hour': return 60
    case '2hours': return 120
    case '1day': return 1440
    case '3days': return 4320
    case '1week': return 10080
    default: return 0
  }
}

export function calculateReminderTime(dueDate: number, reminderType: ReminderType): number {
  if (reminderType === 'none') return 0
  const reminderMinutes = getReminderMinutes(reminderType)
  return dueDate - (reminderMinutes * 60 * 1000)
}

export function formatReminderTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  
  // If it's today, show time
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  // If it's tomorrow or yesterday, show that + time
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }
  
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }
  
  // Otherwise show date + time
  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}
