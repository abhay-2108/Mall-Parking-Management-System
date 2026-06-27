import { prisma } from './db'

export async function getRates() {
  const rates = await prisma.parkingRate.findMany({ where: { isActive: true } })
  return rates
}

export async function getHourlyBrackets() {
  const rates = await prisma.parkingRate.findMany({
    where: { isActive: true, type: 'hourly' },
    orderBy: { minHours: 'asc' }
  })
  return rates
}

export async function getDayPassAmount(): Promise<number> {
  const rate = await prisma.parkingRate.findFirst({
    where: { isActive: true, type: 'dayPass' }
  })
  return rate?.amount ?? 150
}

export async function calculateHourlyBilling(entryTime: Date, exitTime: Date): Promise<number> {
  const totalMinutes = Math.ceil((exitTime.getTime() - entryTime.getTime()) / (1000 * 60))
  const totalHours = Math.ceil(totalMinutes / 60)

  const brackets = await getHourlyBrackets()
  if (brackets.length === 0) {
    if (totalHours <= 1) return 50
    if (totalHours <= 3) return 100
    if (totalHours <= 6) return 150
    return 200
  }

  for (const bracket of brackets) {
    if (totalHours <= (bracket.maxHours ?? Infinity)) {
      return bracket.amount
    }
  }

  const lastBracket = brackets[brackets.length - 1]
  return lastBracket?.amount ?? 200
}

export async function isOverstay(entryTime: Date, exitTime: Date): Promise<boolean> {
  const hours = (exitTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60)
  return hours > 6
}
