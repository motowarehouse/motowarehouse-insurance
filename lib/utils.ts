import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, formatDistanceToNow, format } from 'date-fns'
import { AGE_THRESHOLDS } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the number of days since statusChangedAt.
 */
export function getDaysInStatus(statusChangedAt: Date | string): number {
  return differenceInDays(new Date(), new Date(statusChangedAt))
}

/**
 * Returns 'green' | 'amber' | 'red' based on days in current status.
 */
export function getAgeColor(days: number): 'green' | 'amber' | 'red' {
  if (days <= AGE_THRESHOLDS.OK) return 'green'
  if (days <= AGE_THRESHOLDS.WARNING) return 'amber'
  return 'red'
}

/**
 * Format a date for display.
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'dd/MM/yyyy')
}

/**
 * Format a date with relative time (e.g. "3 days ago").
 */
export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

/**
 * Normalize a plate number: uppercase, remove spaces.
 */
export function normalizePlate(plate: string): string {
  return plate.trim().toUpperCase().replace(/\s+/g, '')
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Check if a file type is an image.
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}
