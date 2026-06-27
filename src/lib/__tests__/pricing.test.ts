import { calculateHourlyBilling, getDayPassAmount, isOverstay } from '../pricing'

describe('Pricing Logic', () => {
  describe('calculateHourlyBilling', () => {
    it('should charge ₹50 for 0-1 hour', () => {
      const entryTime = new Date('2025-01-01T10:00:00')
      const exitTime = new Date('2025-01-01T10:30:00')
      expect(calculateHourlyBilling(entryTime, exitTime)).toBe(50)
    })

    it('should charge ₹50 for exactly 1 hour', () => {
      const entryTime = new Date('2025-01-01T10:00:00')
      const exitTime = new Date('2025-01-01T11:00:00')
      expect(calculateHourlyBilling(entryTime, exitTime)).toBe(50)
    })

    it('should charge ₹100 for 1-3 hours', () => {
      const entryTime = new Date('2025-01-01T10:00:00')
      const exitTime = new Date('2025-01-01T12:00:00')
      expect(calculateHourlyBilling(entryTime, exitTime)).toBe(100)
    })

    it('should charge ₹100 for exactly 2 hours', () => {
      const entryTime = new Date('2025-01-01T10:00:00')
      const exitTime = new Date('2025-01-01T12:00:00')
      expect(calculateHourlyBilling(entryTime, exitTime)).toBe(100)
    })

    it('should charge ₹150 for 3-6 hours', () => {
      const entryTime = new Date('2025-01-01T10:00:00')
      const exitTime = new Date('2025-01-01T14:00:00')
      expect(calculateHourlyBilling(entryTime, exitTime)).toBe(150)
    })

    it('should charge ₹200 for 6+ hours (daily cap)', () => {
      const entryTime = new Date('2025-01-01T10:00:00')
      const exitTime = new Date('2025-01-01T18:00:00')
      expect(calculateHourlyBilling(entryTime, exitTime)).toBe(200)
    })

    it('should charge ₹200 for 24 hours', () => {
      const entryTime = new Date('2025-01-01T10:00:00')
      const exitTime = new Date('2025-01-02T10:00:00')
      expect(calculateHourlyBilling(entryTime, exitTime)).toBe(200)
    })
  })

  describe('getDayPassAmount', () => {
    it('should return ₹150 for day pass', () => {
      expect(getDayPassAmount()).toBe(150)
    })
  })

  describe('isOverstay', () => {
    it('should return false for less than 6 hours', () => {
      const entryTime = new Date('2025-01-01T10:00:00')
      const exitTime = new Date('2025-01-01T15:00:00')
      expect(isOverstay(entryTime, exitTime)).toBe(false)
    })

    it('should return false for exactly 6 hours', () => {
      const entryTime = new Date('2025-01-01T10:00:00')
      const exitTime = new Date('2025-01-01T16:00:00')
      expect(isOverstay(entryTime, exitTime)).toBe(false)
    })

    it('should return true for more than 6 hours', () => {
      const entryTime = new Date('2025-01-01T10:00:00')
      const exitTime = new Date('2025-01-01T17:00:00')
      expect(isOverstay(entryTime, exitTime)).toBe(true)
    })

    it('should return true for 24 hours', () => {
      const entryTime = new Date('2025-01-01T10:00:00')
      const exitTime = new Date('2025-01-02T10:00:00')
      expect(isOverstay(entryTime, exitTime)).toBe(true)
    })
  })
})
