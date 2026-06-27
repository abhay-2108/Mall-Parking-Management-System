'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Calendar, Plus, Trash2, Save, X } from 'lucide-react'
import { useMall } from '@/context/MallContext'
import Notification, { useNotification } from '@/components/Notification'
import ConfirmDialog from '@/components/ConfirmDialog'

interface PricingRule {
  id: string
  name: string
  type: string
  priority: number
  multiplier: number
  daysOfWeek: string | null
  timeStart: string | null
  timeEnd: string | null
  minOccupancyPct: number | null
  dateStart: string | null
  dateEnd: string | null
  isActive: boolean
}

interface Holiday {
  id: string
  name: string
  date: string
  multiplier: number
  isActive: boolean
}

export default function PricingPage() {
  const router = useRouter()
  const { notifications, showNotification } = useNotification()
  const { currentMall } = useMall()
  const [activeTab, setActiveTab] = useState<'rules' | 'holidays'>('rules')
  const [rules, setRules] = useState<PricingRule[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [showHolidayForm, setShowHolidayForm] = useState(false)

  const [ruleForm, setRuleForm] = useState({
    name: '', type: 'peak', priority: 0, multiplier: 1.2,
    daysOfWeek: '', timeStart: '', timeEnd: '',
    minOccupancyPct: '', dateStart: '', dateEnd: '',
  })

  const [holidayForm, setHolidayForm] = useState({ name: '', date: '', multiplier: '1.5' })
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  useEffect(() => {
    const token = document.cookie.includes('token=')
    if (!token) { router.push('/'); return }
    if (currentMall?.id) loadData()
  }, [currentMall])

  const loadData = async () => {
    setLoading(true)
    try {
      const [rulesRes, holidaysRes] = await Promise.all([
        fetch(`/api/pricing-rules?mallId=${currentMall!.id}`),
        fetch(`/api/holidays?mallId=${currentMall!.id}`),
      ])
      if (rulesRes.ok) { const d = await rulesRes.json(); setRules(d.rules || []) }
      if (holidaysRes.ok) { const d = await holidaysRes.json(); setHolidays(d.holidays || []) }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRule = async () => {
    const data: Record<string, unknown> = {
      name: ruleForm.name,
      type: ruleForm.type,
      priority: ruleForm.priority,
      multiplier: ruleForm.multiplier,
      mallId: currentMall!.id,
    }
    if (ruleForm.daysOfWeek) data.daysOfWeek = ruleForm.daysOfWeek
    if (ruleForm.timeStart) data.timeStart = ruleForm.timeStart
    if (ruleForm.timeEnd) data.timeEnd = ruleForm.timeEnd
    if (ruleForm.minOccupancyPct) data.minOccupancyPct = parseFloat(ruleForm.minOccupancyPct)
    if (ruleForm.dateStart) data.dateStart = new Date(ruleForm.dateStart)
    if (ruleForm.dateEnd) data.dateEnd = new Date(ruleForm.dateEnd)

    try {
      const res = await fetch('/api/pricing-rules', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      if (res.ok) {
        showNotification('Rule created', 'success')
        setShowRuleForm(false)
        setRuleForm({ name: '', type: 'peak', priority: 0, multiplier: 1.2, daysOfWeek: '', timeStart: '', timeEnd: '', minOccupancyPct: '', dateStart: '', dateEnd: '' })
        loadData()
      }
    } catch {
      showNotification('Failed to create rule', 'error')
    }
  }

  const handleDeleteRule = (id: string) => {
    setConfirmDialog({
      isOpen: true, title: 'Delete Rule', message: 'Are you sure you want to delete this pricing rule?',
      onConfirm: async () => {
        await fetch(`/api/pricing-rules/${id}`, { method: 'DELETE' })
        showNotification('Rule deleted', 'success')
        loadData()
      },
    })
  }

  const handleCreateHoliday = async () => {
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: holidayForm.name, date: holidayForm.date, multiplier: parseFloat(holidayForm.multiplier), mallId: currentMall!.id }),
      })
      if (res.ok) {
        showNotification('Holiday added', 'success')
        setShowHolidayForm(false)
        setHolidayForm({ name: '', date: '', multiplier: '1.5' })
        loadData()
      } else {
        const err = await res.json()
        showNotification(err.error || 'Failed to add holiday', 'error')
      }
    } catch {
      showNotification('Failed to add holiday', 'error')
    }
  }

  const handleDeleteHoliday = (id: string) => {
    setConfirmDialog({
      isOpen: true, title: 'Delete Holiday', message: 'Are you sure you want to delete this holiday?',
      onConfirm: async () => {
        await fetch(`/api/holidays/${id}`, { method: 'DELETE' })
        showNotification('Holiday deleted', 'success')
        loadData()
      },
    })
  }

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = { peak: 'Peak Hours', holiday: 'Holiday', occupancy: 'Occupancy' }
    return labels[type] || type
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div>
      <Notification notifications={notifications} />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(d => ({ ...d, isOpen: false }))}
      />

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Zap className="h-8 w-8 text-purple-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pricing Management</h1>
            <p className="text-gray-500 text-sm mt-1">
              Configure surge pricing rules and holidays for {currentMall?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab('rules')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'rules' ? 'bg-white text-purple-700 shadow-lg' : 'text-gray-600 hover:text-gray-900'}`}>
          <Zap className="h-4 w-4 inline mr-1.5" />Pricing Rules
        </button>
        <button onClick={() => setActiveTab('holidays')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'holidays' ? 'bg-white text-purple-700 shadow-lg' : 'text-gray-600 hover:text-gray-900'}`}>
          <Calendar className="h-4 w-4 inline mr-1.5" />Holidays
        </button>
      </div>

      {activeTab === 'rules' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{rules.length} rule{rules.length !== 1 ? 's' : ''} configured</p>
            <button onClick={() => setShowRuleForm(true)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-bold hover:from-purple-700 hover:to-pink-700 transition-all">
              <Plus className="h-4 w-4 mr-1.5" />Add Rule
            </button>
          </div>

          {showRuleForm && (
            <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">New Pricing Rule</h3>
                <button onClick={() => setShowRuleForm(false)}><X className="h-5 w-5 text-gray-400 hover:text-gray-600" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Rule Name</label>
                  <input type="text" value={ruleForm.name} onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="Weekend Surge" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                  <select value={ruleForm.type} onChange={e => setRuleForm({ ...ruleForm, type: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                    <option value="peak">Peak Hours</option>
                    <option value="holiday">Holiday</option>
                    <option value="occupancy">Occupancy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Multiplier (e.g. 1.5)</label>
                  <input type="number" step="0.1" min="1" value={ruleForm.multiplier} onChange={e => setRuleForm({ ...ruleForm, multiplier: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Priority (lower = checked first)</label>
                  <input type="number" value={ruleForm.priority} onChange={e => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Days of Week (comma: 0,6 for weekends)</label>
                  <input type="text" value={ruleForm.daysOfWeek} onChange={e => setRuleForm({ ...ruleForm, daysOfWeek: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="0,1,2,3,4,5,6" />
                </div>
                {ruleForm.type === 'peak' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Time Start (HH:mm)</label>
                      <input type="time" value={ruleForm.timeStart} onChange={e => setRuleForm({ ...ruleForm, timeStart: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Time End (HH:mm)</label>
                      <input type="time" value={ruleForm.timeEnd} onChange={e => setRuleForm({ ...ruleForm, timeEnd: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                    </div>
                  </>
                )}
                {ruleForm.type === 'occupancy' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Min Occupancy %</label>
                    <input type="number" min="0" max="100" value={ruleForm.minOccupancyPct} onChange={e => setRuleForm({ ...ruleForm, minOccupancyPct: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="70" />
                  </div>
                )}
              </div>
              <button onClick={handleCreateRule}
                className="flex items-center px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-bold hover:from-purple-700 hover:to-pink-700 transition-all">
                <Save className="h-4 w-4 mr-1.5" />Create Rule
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Name</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Type</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Multiplier</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Schedule</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Priority</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                ) : rules.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No pricing rules configured</td></tr>
                ) : rules.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{r.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                        {typeLabel(r.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">{r.multiplier}x</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {r.type === 'peak' && r.daysOfWeek && (
                        <span>{r.daysOfWeek.split(',').map(d => dayNames[parseInt(d)]).join(', ')} {r.timeStart}-{r.timeEnd}</span>
                      )}
                      {r.type === 'occupancy' && r.minOccupancyPct && <span>&gt;{r.minOccupancyPct}% full</span>}
                      {r.type === 'holiday' && <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.priority}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${r.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {r.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDeleteRule(r.id)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'holidays' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{holidays.length} holiday{holidays.length !== 1 ? 's' : ''} configured</p>
            <button onClick={() => setShowHolidayForm(true)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-bold hover:from-purple-700 hover:to-pink-700 transition-all">
              <Plus className="h-4 w-4 mr-1.5" />Add Holiday
            </button>
          </div>

          {showHolidayForm && (
            <div className="mb-6 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">New Holiday</h3>
                <button onClick={() => setShowHolidayForm(false)}><X className="h-5 w-5 text-gray-400 hover:text-gray-600" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Holiday Name</label>
                  <input type="text" value={holidayForm.name} onChange={e => setHolidayForm({ ...holidayForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="Diwali" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                  <input type="date" value={holidayForm.date} onChange={e => setHolidayForm({ ...holidayForm, date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Multiplier</label>
                  <input type="number" step="0.1" min="1" value={holidayForm.multiplier} onChange={e => setHolidayForm({ ...holidayForm, multiplier: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                </div>
              </div>
              <button onClick={handleCreateHoliday}
                className="flex items-center px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-bold hover:from-orange-600 hover:to-red-600 transition-all">
                <Calendar className="h-4 w-4 mr-1.5" />Add Holiday
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Name</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Multiplier</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                ) : holidays.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No holidays configured</td></tr>
                ) : holidays.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{h.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{new Date(h.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{h.multiplier}x</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${h.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {h.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDeleteHoliday(h.id)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
