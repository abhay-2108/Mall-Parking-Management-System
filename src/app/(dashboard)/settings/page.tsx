'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, Edit, Trash2, Shield, Save, X, IndianRupee, Clock, Building2, Zap, Calendar } from 'lucide-react'
import Notification, { useNotification } from '@/components/Notification'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useMall } from '@/context/MallContext'

interface Operator {
  id: string; username: string; name: string; role: string
}

interface ParkingRate {
  id?: string; name: string; mallId?: string; minHours?: number; maxHours?: number; amount: number; type: string; isActive: boolean
}

interface Mall { id: string; name: string; location: string | null; timezone: string; isActive: boolean }
interface PricingRule { id?: string; name: string; type: string; priority: number; multiplier: number; daysOfWeek?: string; timeStart?: string; timeEnd?: string; minOccupancyPct?: number; isActive: boolean }
interface Holiday { id: string; name: string; date: string; multiplier: number; isActive: boolean }

export default function SettingsPage() {
  const router = useRouter()
  const { notifications, showNotification } = useNotification()
  const { currentMall } = useMall()
  const [activeTab, setActiveTab] = useState<'operators' | 'pricing' | 'malls' | 'rules' | 'holidays'>('operators')

  // Operators
  const [operators, setOperators] = useState<Operator[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null)
  const [formData, setFormData] = useState({ username: '', name: '', password: '', role: 'operator' })

  // Pricing
  const [rates, setRates] = useState<ParkingRate[]>([])
  const [ratesLoading, setRatesLoading] = useState(true)

  // Malls
  const [malls, setMalls] = useState<Mall[]>([])
  const [newMall, setNewMall] = useState({ name: '', location: '', timezone: 'Asia/Kolkata' })

  // Pricing Rules
  const [rules, setRules] = useState<PricingRule[]>([])

  // Holidays
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '', multiplier: '1.5' })

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  useEffect(() => { checkAuth(); loadAll() }, [])

  const checkAuth = async () => {
    try { const r = await fetch('/api/auth/check'); if (!r.ok) router.push('/') } catch { router.push('/') }
  }

  const loadAll = async () => {
    loadOperators(); loadRates(); loadMalls(); loadRules(); loadHolidays()
  }

  const loadOperators = async () => {
    try { const r = await fetch('/api/operators'); if (r.ok) setOperators((await r.json()).operators) } catch {}
  }
  const loadRates = async () => {
    setRatesLoading(true)
    try { const r = await fetch('/api/settings/rates'); if (r.ok) setRates((await r.json()).rates) } catch {}
    finally { setRatesLoading(false) }
  }
  const loadMalls = async () => {
    try { const r = await fetch('/api/malls'); if (r.ok) setMalls((await r.json()).malls) } catch {}
  }
  const loadRules = async () => {
    try {
      const params = currentMall?.id ? `?mallId=${currentMall.id}` : ''
      const r = await fetch(`/api/pricing-rules${params}`); if (r.ok) setRules((await r.json()).rules)
    } catch {}
  }
  const loadHolidays = async () => {
    try {
      const params = currentMall?.id ? `?mallId=${currentMall.id}` : ''
      const r = await fetch(`/api/holidays${params}`); if (r.ok) setHolidays((await r.json()).holidays)
    } catch {}
  }

  // Operator handlers
  const handleOperatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingOperator ? `/api/operators/${editingOperator.id}` : '/api/operators'
      const r = await fetch(url, { method: editingOperator ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      if (r.ok) { loadOperators(); setShowForm(false); setEditingOperator(null); setFormData({ username: '', name: '', password: '', role: 'operator' }); showNotification(editingOperator ? 'Operator updated!' : 'Operator created!', 'success') }
      else { const d = await r.json(); showNotification(d.error || 'Failed', 'error') }
    } catch { showNotification('Network error', 'error') }
  }

  const handleEdit = (operator: Operator) => { setEditingOperator(operator); setFormData({ username: operator.username, name: operator.name, password: '', role: operator.role }); setShowForm(true) }

  const handleDelete = (operator: Operator) => {
    setConfirmDialog({ isOpen: true, title: 'Delete Operator', message: `Delete "${operator.name}"?`,
      onConfirm: async () => {
        try { const r = await fetch(`/api/operators/${operator.id}`, { method: 'DELETE' }); if (r.ok) { loadOperators(); showNotification('Operator deleted!', 'success') } else { const d = await r.json(); showNotification(d.error || 'Failed', 'error') } }
        catch { showNotification('Network error', 'error') }
        setConfirmDialog(c => ({ ...c, isOpen: false }))
      }
    })
  }
  const resetForm = () => { setFormData({ username: '', name: '', password: '', role: 'operator' }); setEditingOperator(null); setShowForm(false) }

  // Pricing handlers
  const handleRateChange = (index: number, field: string, value: string | number | boolean) => { const u = [...rates]; u[index] = { ...u[index], [field]: value }; setRates(u) }
  const handleSaveRates = async () => {
    try { const r = await fetch('/api/settings/rates', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rates }) }); if (r.ok) { showNotification('Rates updated!', 'success'); loadRates() } else showNotification('Failed to update rates', 'error') }
    catch { showNotification('Network error', 'error') }
  }
  const addRate = () => { setRates([...rates, { name: '', minHours: 0, maxHours: 1, amount: 50, type: 'hourly', isActive: true }]) }

  // Mall handlers
  const createMall = async () => {
    try {
      const r = await fetch('/api/malls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMall) })
      if (r.ok) { showNotification('Mall created!', 'success'); loadMalls(); setNewMall({ name: '', location: '', timezone: 'Asia/Kolkata' }) }
      else showNotification('Failed to create mall', 'error')
    } catch { showNotification('Network error', 'error') }
  }

  // Rule handlers
  const addRule = async () => {
    try {
      if (!currentMall) return
      const r = await fetch('/api/pricing-rules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mallId: currentMall.id, name: 'New Rule', type: 'peak', priority: 0, multiplier: 1.2, daysOfWeek: '5,6', timeStart: '11:00', timeEnd: '20:00', isActive: true }) })
      if (r.ok) { showNotification('Rule added!', 'success'); loadRules() }
      else showNotification('Failed to add rule', 'error')
    } catch { showNotification('Network error', 'error') }
  }

  const deleteRule = async (id: string) => {
    try { const r = await fetch(`/api/pricing-rules/${id}`, { method: 'DELETE' }); if (r.ok) { showNotification('Rule deleted', 'success'); loadRules() } } catch {}
  }

  // Holiday handlers
  const addHoliday = async () => {
    try {
      if (!currentMall || !newHoliday.date) return
      const r = await fetch('/api/holidays', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newHoliday, multiplier: parseFloat(newHoliday.multiplier), mallId: currentMall.id }) })
      if (r.ok) { showNotification('Holiday added!', 'success'); loadHolidays(); setNewHoliday({ name: '', date: '', multiplier: '1.5' }) }
      else showNotification('Failed to add holiday', 'error')
    } catch { showNotification('Network error', 'error') }
  }

  const deleteHoliday = async (id: string) => {
    try { const r = await fetch(`/api/holidays/${id}`, { method: 'DELETE' }); if (r.ok) { showNotification('Holiday deleted', 'success'); loadHolidays() } } catch {}
  }

  const tabs = [
    { id: 'operators', label: 'Operators', icon: <Users className="h-4 w-4" /> },
    { id: 'pricing', label: 'Pricing', icon: <IndianRupee className="h-4 w-4" /> },
    { id: 'malls', label: 'Malls', icon: <Building2 className="h-4 w-4" /> },
    { id: 'rules', label: 'Pricing Rules', icon: <Zap className="h-4 w-4" /> },
    { id: 'holidays', label: 'Holidays', icon: <Calendar className="h-4 w-4" /> },
  ] as const

  return (
    <div className="space-y-6">
      <Notification notifications={notifications} />
      <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message}
        confirmText="Delete" cancelText="Cancel" type="danger"
        onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} />

      <div><h1 className="text-3xl font-bold text-gray-900">Settings</h1><p className="text-gray-600 mt-1">Manage system configuration</p></div>

      <div className="flex flex-wrap gap-1 bg-white/60 rounded-2xl p-1 border border-gray-200">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === t.id ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-gray-600 hover:text-gray-900'
            }`}>{t.icon}<span className="ml-1.5">{t.label}</span></button>
        ))}
      </div>

      {/* OPERATORS TAB */}
      {activeTab === 'operators' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => { resetForm(); setShowForm(!showForm) }} className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg">
              <Plus className="h-4 w-4 mr-2" />Add Operator
            </button>
          </div>
          {showForm && (
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">{editingOperator ? 'Edit Operator' : 'Add New Operator'}</h2>
                <button onClick={resetForm} className="p-2 rounded-lg hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
              </div>
              <form onSubmit={handleOperatorSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Username</label><input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400" placeholder="Enter username" required /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400" placeholder="Enter full name" required /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Password {editingOperator && '(leave blank to keep current)'}</label><input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400" placeholder={editingOperator ? '••••••••' : 'Enter password'} required={!editingOperator} /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Role</label><select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400"><option value="operator">Operator</option><option value="admin">Admin</option></select></div>
                <div className="md:col-span-2 flex space-x-4">
                  <button type="submit" className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"><Save className="h-4 w-4 mr-2" />{editingOperator ? 'Update' : 'Create'}</button>
                  <button type="button" onClick={resetForm} className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
                </div>
              </form>
            </div>
          )}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center mb-6"><Users className="h-5 w-5 text-purple-600 mr-2" /><h2 className="text-lg font-bold text-gray-900">Operators ({operators.length})</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {operators.map(op => (
                <div key={op.id} className="p-4 bg-gradient-to-r from-white to-purple-50 rounded-2xl border border-purple-200/50 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mr-3"><Shield className="h-5 w-5 text-white" /></div>
                      <div><p className="font-bold text-gray-900">{op.name}</p><p className="text-sm text-gray-600">@{op.username}</p></div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${op.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{op.role}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEdit(op)} className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"><Edit className="h-4 w-4 mr-1" />Edit</button>
                    <button onClick={() => handleDelete(op)} className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100"><Trash2 className="h-4 w-4 mr-1" />Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* PRICING TAB */}
      {activeTab === 'pricing' && (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center"><IndianRupee className="h-5 w-5 text-purple-600 mr-2" /><h2 className="text-lg font-bold text-gray-900">Pricing Configuration</h2></div>
            <div className="flex space-x-2">
              <button onClick={addRate} className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"><Plus className="h-4 w-4 mr-1" />Add Bracket</button>
              <button onClick={handleSaveRates} className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 shadow-lg"><Save className="h-4 w-4 mr-2" />Save</button>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Configure hourly billing brackets and day pass amount.</p>
            <h3 className="text-sm font-semibold text-gray-700 flex items-center"><Clock className="h-4 w-4 mr-1" /> Hourly Brackets</h3>
            {ratesLoading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-shimmer" />)}</div> : (
              rates.filter(r => r.type === 'hourly').length === 0 ? <p className="text-sm text-gray-500 italic">No brackets configured</p> :
              rates.filter(r => r.type === 'hourly').map((rate, idx) => {
                const ri = rates.findIndex(r => r === rate)
                return (
                  <div key={rate.id || idx} className="flex items-center flex-wrap gap-3 p-3 bg-gray-50 rounded-xl">
                    <input type="text" value={rate.name} onChange={e => handleRateChange(ri, 'name', e.target.value)} className="px-3 py-2 border-2 border-gray-200 rounded-xl w-36 text-sm" placeholder="e.g. 0-1 hr" />
                    <div className="flex items-center gap-2 text-sm"><span>0 → </span><input type="number" value={rate.maxHours ?? 0} onChange={e => handleRateChange(ri, 'maxHours', parseFloat(e.target.value))} className="w-20 px-3 py-2 border-2 border-gray-200 rounded-xl" placeholder="Max" /><span>hrs</span></div>
                    <div className="flex items-center text-sm"><span>₹</span><input type="number" value={rate.amount} onChange={e => handleRateChange(ri, 'amount', parseFloat(e.target.value))} className="w-24 px-3 py-2 border-2 border-gray-200 rounded-xl" /></div>
                    <label className="flex items-center text-sm"><input type="checkbox" checked={rate.isActive} onChange={e => handleRateChange(ri, 'isActive', e.target.checked)} className="mr-1" />Active</label>
                  </div>
                )
              })
            )}
            <h3 className="text-sm font-semibold text-gray-700 flex items-center mt-6"><IndianRupee className="h-4 w-4 mr-1" /> Day Pass</h3>
            {rates.filter(r => r.type === 'dayPass').map((rate, idx) => {
              const ri = rates.findIndex(r => r === rate)
              return (
                <div key={rate.id || idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <input type="text" value={rate.name} onChange={e => handleRateChange(ri, 'name', e.target.value)} className="px-3 py-2 border-2 border-gray-200 rounded-xl w-36 text-sm" />
                  <div className="flex items-center text-sm"><span>₹</span><input type="number" value={rate.amount} onChange={e => handleRateChange(ri, 'amount', parseFloat(e.target.value))} className="w-24 px-3 py-2 border-2 border-gray-200 rounded-xl" /></div>
                  <label className="flex items-center text-sm"><input type="checkbox" checked={rate.isActive} onChange={e => handleRateChange(ri, 'isActive', e.target.checked)} className="mr-1" />Active</label>
                </div>
              )
            })}
            {rates.filter(r => r.type === 'dayPass').length === 0 && <p className="text-sm text-gray-500 italic">Default: ₹150</p>}
          </div>
        </div>
      )}

      {/* MALLS TAB */}
      {activeTab === 'malls' && (
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><Building2 className="h-5 w-5 text-purple-600 mr-2" />Create New Mall</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" value={newMall.name} onChange={e => setNewMall({ ...newMall, name: e.target.value })} className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Mall name" />
              <input type="text" value={newMall.location} onChange={e => setNewMall({ ...newMall, location: e.target.value })} className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Location (optional)" />
              <button onClick={createMall} disabled={!newMall.name} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 font-semibold"><Plus className="h-4 w-4 inline mr-1" />Create Mall</button>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4">All Malls ({malls.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {malls.map(mall => (
                <div key={mall.id} className={`p-4 rounded-2xl border-2 ${mall.id === currentMall?.id ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <div><p className="font-bold text-gray-900">{mall.name}</p><p className="text-sm text-gray-600">{mall.location || 'No location'}</p></div>
                    {mall.id === currentMall?.id && <span className="px-2 py-1 text-xs font-bold bg-purple-100 text-purple-700 rounded-full">Active</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PRICING RULES TAB */}
      {activeTab === 'rules' && (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center"><Zap className="h-5 w-5 text-purple-600 mr-2" />Surge Pricing Rules</h2>
            <button onClick={addRule} className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 shadow-lg"><Plus className="h-4 w-4 mr-1" />Add Rule</button>
          </div>
          {rules.length === 0 ? <p className="text-gray-500 text-sm">No pricing rules configured for this mall.</p> : (
            <div className="space-y-3">
              {rules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{rule.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                        rule.type === 'peak' ? 'bg-orange-100 text-orange-700' : rule.type === 'holiday' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>{rule.type}</span>
                      <span className="text-sm font-bold text-purple-700">{rule.multiplier}x</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {rule.type === 'peak' && `Days: ${rule.daysOfWeek || 'Any'} | ${rule.timeStart || '00:00'}-${rule.timeEnd || '23:59'}`}
                      {rule.type === 'occupancy' && `Triggers at ${rule.minOccupancyPct}% occupancy`}
                    </p>
                  </div>
                  <button onClick={() => rule.id && deleteRule(rule.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HOLIDAYS TAB */}
      {activeTab === 'holidays' && (
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><Calendar className="h-5 w-5 text-purple-600 mr-2" />Add Holiday</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input type="text" value={newHoliday.name} onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })} className="px-4 py-3 border-2 border-gray-200 rounded-xl" placeholder="Holiday name" />
              <input type="date" value={newHoliday.date} onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })} className="px-4 py-3 border-2 border-gray-200 rounded-xl" />
              <input type="number" step="0.1" value={newHoliday.multiplier} onChange={e => setNewHoliday({ ...newHoliday, multiplier: e.target.value })} className="px-4 py-3 border-2 border-gray-200 rounded-xl" placeholder="1.5x" />
              <button onClick={addHoliday} disabled={!newHoliday.name || !newHoliday.date} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 font-semibold"><Plus className="h-4 w-4 inline mr-1" />Add Holiday</button>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Holiday Calendar</h2>
            {holidays.length === 0 ? <p className="text-gray-500 text-sm">No holidays configured.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {holidays.map(h => (
                  <div key={h.id} className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl border border-red-200">
                    <div className="flex items-center justify-between">
                      <div><p className="font-bold text-gray-900">{h.name}</p><p className="text-sm text-gray-600">{new Date(h.date).toLocaleDateString('en-IN')}</p></div>
                      <div className="flex items-center gap-2"><span className="text-lg font-bold text-red-600">{h.multiplier}x</span><button onClick={() => deleteHoliday(h.id)} className="p-1 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="h-4 w-4" /></button></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
