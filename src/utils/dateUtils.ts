import { format, parseISO, differenceInDays, addDays, isToday, isBefore } from 'date-fns'
import { es } from 'date-fns/locale'

export const formatDate = (date: string | Date, fmt = 'dd/MM/yyyy'): string => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt, { locale: es })
  } catch {
    return date?.toString() ?? ''
  }
}

export const formatDateLong = (date: string): string =>
  formatDate(date, "d 'de' MMMM 'de' yyyy")

export const formatMonthYear = (month: string): string => {
  try {
    const [year, m] = month.split('-')
    const d = new Date(parseInt(year), parseInt(m) - 1)
    return format(d, 'MMM yyyy', { locale: es })
  } catch {
    return month
  }
}

export const today = (): string => format(new Date(), 'yyyy-MM-dd')

export const daysUntil = (dateStr: string): number => {
  try {
    return differenceInDays(parseISO(dateStr), new Date())
  } catch {
    return 0
  }
}

export const addDaysToDate = (dateStr: string, days: number): string => {
  try {
    return format(addDays(parseISO(dateStr), days), 'yyyy-MM-dd')
  } catch {
    return dateStr
  }
}

export const isExpired = (dateStr: string): boolean => {
  try {
    return isBefore(parseISO(dateStr), new Date())
  } catch {
    return false
  }
}

export const isExpiringWithin = (dateStr: string, days: number): boolean => {
  const d = daysUntil(dateStr)
  return d >= 0 && d <= days
}

export const currentYearMonth = (): { year: number; month: number } => {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export const monthOptions = (): { value: string; label: string }[] => {
  const months = []
  for (let m = 1; m <= 12; m++) {
    const d = new Date(2024, m - 1)
    months.push({
      value: String(m),
      label: format(d, 'MMMM', { locale: es }),
    })
  }
  return months
}

export { isToday }
