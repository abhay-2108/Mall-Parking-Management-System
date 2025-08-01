export function convertToIST(date: Date): Date {
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000 // 5.5 hours in milliseconds
  return new Date(date.getTime() + istOffset)
}

export function convertFromIST(date: Date): Date {
  // Convert from IST to UTC
  const istOffset = 5.5 * 60 * 60 * 1000
  return new Date(date.getTime() - istOffset)
}

export function formatISTTime(date: Date): string {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

export function formatISTDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function getCurrentIST(): Date {
  return convertToIST(new Date())
}

export function parseISTDateTime(dateTimeString: string): Date {
  // Parse date time string in IST format
  const date = new Date(dateTimeString)
  return convertToIST(date)
} 