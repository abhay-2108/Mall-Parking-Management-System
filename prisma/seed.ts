import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

const cityMalls = [
  { id: 'mall-city', name: 'City Mall', location: 'Main Street, City Center', timezone: 'Asia/Kolkata' },
  { id: 'mall-galaxy', name: 'Galaxy Mall', location: 'Sector 62, Noida', timezone: 'Asia/Kolkata' },
  { id: 'mall-metro', name: 'Metro Mall', location: 'MG Road, Bangalore', timezone: 'Asia/Kolkata' },
  { id: 'mall-central', name: 'Central Plaza', location: 'Connaught Place, New Delhi', timezone: 'Asia/Kolkata' },
]

async function createMallWithData(mallData: typeof cityMalls[0]) {
  const mall = await prisma.mall.upsert({
    where: { id: mallData.id },
    update: {},
    create: mallData,
  })
  console.log(`Mall created: ${mall.name} (${mall.location})`)

  // Pricing rates for this mall
  const existingRates = await prisma.parkingRate.count({ where: { mallId: mall.id } })
  if (existingRates === 0) {
    await prisma.parkingRate.createMany({
      data: [
        { name: '0-1 hour', mallId: mall.id, minHours: 0, maxHours: 1, amount: 50, type: 'hourly' },
        { name: '1-3 hours', mallId: mall.id, minHours: 1, maxHours: 3, amount: 100, type: 'hourly' },
        { name: '3-6 hours', mallId: mall.id, minHours: 3, maxHours: 6, amount: 150, type: 'hourly' },
        { name: '6+ hours cap', mallId: mall.id, minHours: 6, amount: 200, type: 'hourly' },
        { name: 'Day Pass', mallId: mall.id, amount: 150, type: 'dayPass' },
      ],
    })
    console.log(`  Pricing rates created for ${mall.name}`)
  }

  // Parking slots for this mall
  const existingSlots = await prisma.parkingSlot.count({ where: { mallId: mall.id } })
  if (existingSlots === 0) {
    const floors = ['1', '2', '3']
    const sections = ['A', 'B', 'C', 'D']
    const slotsPerSection = 20
    for (const floor of floors) {
      for (const section of sections) {
        for (let i = 1; i <= slotsPerSection; i++) {
          const slotNumber = `${section}${floor}-${String(i).padStart(2, '0')}`
          let slotType: string
          if (i % 10 === 0) slotType = 'Handicap'
          else if (i % 5 === 0) slotType = 'EV'
          else if (i % 3 === 0) slotType = 'Compact'
          else slotType = 'Regular'
          await prisma.parkingSlot.create({
            data: { slotNumber: `${mall.id}-${slotNumber}`, slotType: slotType as any, mallId: mall.id },
          })
        }
      }
    }
    console.log(`  240 parking slots created for ${mall.name}`)
  }

  return mall
}

async function main() {
  // Create all city malls
  const malls = []
  for (const mallData of cityMalls) {
    malls.push(await createMallWithData(mallData))
  }

  // Create admin operator (associated with first mall)
  const hashedPassword = await hashPassword('admin123')
  await prisma.operator.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Admin Operator',
      mallId: malls[0].id,
    },
  })
  console.log('Admin operator created')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
