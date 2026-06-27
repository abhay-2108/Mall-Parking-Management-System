import { prisma } from './db'

export async function getEffectiveMultiplier(mallId: string): Promise<number> {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  // Get active rules for this mall, ordered by priority
  const rules = await prisma.pricingRule.findMany({
    where: { mallId, isActive: true },
    orderBy: { priority: 'asc' }
  })

  let multiplier = 1.0

  for (const rule of rules) {
    if (rule.type === 'peak') {
      // Check day of week
      if (rule.daysOfWeek) {
        const days = rule.daysOfWeek.split(',').map(Number)
        if (!days.includes(dayOfWeek)) continue
      }
      // Check time range
      if (rule.timeStart && rule.timeEnd) {
        if (timeStr < rule.timeStart || timeStr > rule.timeEnd) continue
      }
      multiplier = Math.max(multiplier, rule.multiplier)
    }

    if (rule.type === 'holiday') {
      // Check holiday table
      const holiday = await prisma.holiday.findFirst({
        where: {
          mallId,
          isActive: true,
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          }
        }
      })
      if (holiday) {
        multiplier = Math.max(multiplier, holiday.multiplier)
      }
    }

    if (rule.type === 'occupancy') {
      if (rule.minOccupancyPct) {
        const totalSlots = await prisma.parkingSlot.count({ where: { mallId } })
        const occupiedSlots = await prisma.parkingSlot.count({ where: { mallId, status: 'Occupied' } })
        const pct = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0
        if (pct >= rule.minOccupancyPct) {
          multiplier = Math.max(multiplier, rule.multiplier)
        }
      }
    }
  }

  return multiplier
}

export async function getCurrentRateInfo(mallId: string): Promise<{
  baseHourly: number
  multiplier: number
  effectiveHourly: number
  dayPassAmount: number
  isSurge: boolean
  surgeReason: string | null
}> {
  const [dayPassRate] = await prisma.parkingRate.findMany({
    where: { mallId, type: 'dayPass', isActive: true },
    take: 1
  })

  const [firstHourly] = await prisma.parkingRate.findMany({
    where: { mallId, type: 'hourly', isActive: true, minHours: 0 },
    take: 1
  })

  const baseHourly = firstHourly?.amount ?? 50
  const dayPassAmount = dayPassRate?.amount ?? 150
  const multiplier = await getEffectiveMultiplier(mallId)
  const effectiveHourly = Math.round(baseHourly * multiplier)

  // Determine reason
  const isSurge = multiplier > 1.0
  let surgeReason: string | null = null
  if (isSurge) {
    const activeRules = await prisma.pricingRule.findMany({
      where: { mallId, isActive: true },
      orderBy: { priority: 'asc' }
    })
    for (const rule of activeRules) {
      if (rule.type === 'peak') surgeReason = 'Peak hours'
      if (rule.type === 'holiday') surgeReason = 'Holiday'
      if (rule.type === 'occupancy') surgeReason = 'High occupancy'
    }
  }

  return { baseHourly, multiplier, effectiveHourly, dayPassAmount, isSurge, surgeReason }
}
