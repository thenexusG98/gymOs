export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount)

export const formatNumber = (n: number): string =>
  new Intl.NumberFormat('es-MX').format(n)

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const paymentMethodLabel = (method: string): string => {
  const map: Record<string, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    card: 'Tarjeta',
  }
  return map[method] ?? method
}

export const truncateText = (text: string, max = 30): string =>
  text.length > max ? `${text.slice(0, max)}...` : text
