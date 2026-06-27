'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, Edit, Trash2, Shield, Save, X, IndianRupee, Clock } from 'lucide-react'
import Notification, { useNotification } from '@/components/Notification'
import ConfirmDialog from '@/components/ConfirmDialog'

interface Operator {
  id: string
  username: string
  name: string
  role: string
}

interface ParkingRate {
  id?: string
  name: string
  minHours?: number
  maxHours?: number
  amount: number
  type: string
  isActive: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const { notifications, showNotification } = useNotification()
  const [activeTab, setActiveTab] = useState<'operators' | 'pricing'>('operators')

  // Operator state
  const [operators, setOperators] = useState<Operator[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    role: 'operator'
  })

  // Pricing state
  const [rates, setRates] = useState<ParkingRate[]>([])
  const [ratesLoading, setRatesLoading] = useState(true)

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  useEffect(() => {
    loadOperators()
    loadRates()
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check')
      if (!response.ok) router.push('/')
    } catch {
      router.push('/')
    }
  }

  const loadOperators = async () => {
    try {
      const response = await fetch('/api/operators')
      if (response.ok) {
        const data = await response.json()
        setOperators(data.operators)
      }
    } catch (error) {
      console.error('Error loading operators:', error)
    }
  }

  const loadRates = async () => {
    setRatesLoading(true)
    try {
      const response = await fetch('/api/settings/rates')
      if (response.ok) {
        const data = await response.json()
        setRates(data.rates)
      }
    } catch (error) {
      console.error('Error loading rates:', error)
    } finally {
      setRatesLoading(false)
    }
  }

  // Operator handlers
  const handleOperatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingOperator ? `/api/operators/${editingOperator.id}` : '/api/operators'
      const method = editingOperator ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        loadOperators()
        setShowForm(false)
        setEditingOperator(null)
        setFormData({ username: '', name: '', password: '', role: 'operator' })
        showNotification(editingOperator ? 'Operator updated!' : 'Operator created!', 'success')
      } else {
        const data = await response.json()
        showNotification(data.error || 'Operation failed', 'error')
      }
    } catch {
      showNotification('Network error', 'error')
    }
  }

  const handleEdit = (operator: Operator) => {
    setEditingOperator(operator)
    setFormData({
      username: operator.username,
      name: operator.name,
      password: '',
      role: operator.role
    })
    setShowForm(true)
  }

  const handleDelete = (operator: Operator) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Operator',
      message: `Are you sure you want to delete operator "${operator.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/operators/${operator.id}`, { method: 'DELETE' })
          if (response.ok) {
            loadOperators()
            showNotification('Operator deleted!', 'success')
          } else {
            const data = await response.json()
            showNotification(data.error || 'Failed to delete', 'error')
          }
        } catch {
          showNotification('Network error', 'error')
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false })
      }
    })
  }

  const resetForm = () => {
    setFormData({ username: '', name: '', password: '', role: 'operator' })
    setEditingOperator(null)
    setShowForm(false)
  }

  // Pricing handlers
  const handleRateChange = (index: number, field: string, value: string | number | boolean) => {
    const updated = [...rates]
    updated[index] = { ...updated[index], [field]: value }
    setRates(updated)
  }

  const handleSaveRates = async () => {
    try {
      const response = await fetch('/api/settings/rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates })
      })
      if (response.ok) {
        showNotification('Pricing rates updated!', 'success')
        loadRates()
      } else {
        showNotification('Failed to update rates', 'error')
      }
    } catch {
      showNotification('Network error', 'error')
    }
  }

  const addRate = () => {
    setRates([...rates, {
      name: '',
      minHours: 0,
      maxHours: 0,
      amount: 50,
      type: 'hourly',
      isActive: true
    }])
  }

  return (
    <div className="space-y-6">
      <Notification notifications={notifications} />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage operators and system settings</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/60 rounded-2xl p-1 border border-gray-200 w-fit">
        <button
          onClick={() => setActiveTab('operators')}
          className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'operators' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-gray-600 hover:text-gray-900'
          }`}
        ><Users className="h-4 w-4 inline mr-2" />Operators</button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'pricing' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-gray-600 hover:text-gray-900'
          }`}
        ><IndianRupee className="h-4 w-4 inline mr-2" />Pricing</button>
      </div>

      {/* Operators Tab */}
      {activeTab === 'operators' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => { resetForm(); setShowForm(!showForm) }}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Operator
            </button>
          </div>

          {showForm && (
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingOperator ? 'Edit Operator' : 'Add New Operator'}
                </h2>
                <button onClick={resetForm} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleOperatorSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                  <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400" placeholder="Enter username" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400" placeholder="Enter full name" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password {editingOperator && '(leave blank to keep current)'}</label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400"
                    placeholder={editingOperator ? '••••••••' : 'Enter password'} required={!editingOperator} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400">
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex space-x-4">
                  <button type="submit" className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg">
                    <Save className="h-4 w-4 mr-2" />{editingOperator ? 'Update Operator' : 'Create Operator'}
                  </button>
                  <button type="button" onClick={resetForm} className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center mb-6">
              <Users className="h-5 w-5 text-purple-600 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">Operators ({operators.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {operators.map(operator => (
                <div key={operator.id} className="p-4 bg-gradient-to-r from-white to-purple-50 rounded-2xl border border-purple-200/50 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mr-3">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{operator.name}</p>
                        <p className="text-sm text-gray-600">@{operator.username}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${operator.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {operator.role}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEdit(operator)} className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
                      <Edit className="h-4 w-4 mr-1" />Edit
                    </button>
                    <button onClick={() => handleDelete(operator)} className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all">
                      <Trash2 className="h-4 w-4 mr-1" />Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <IndianRupee className="h-5 w-5 text-purple-600 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">Pricing Configuration</h2>
            </div>
            <div className="flex space-x-2">
              <button onClick={addRate} className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
                <Plus className="h-4 w-4 mr-1" />Add Bracket
              </button>
              <button onClick={handleSaveRates} className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg">
                <Save className="h-4 w-4 mr-2" />Save Changes
              </button>
            </div>
          </div>

          {ratesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-shimmer" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Configure hourly billing brackets and day pass amount. Changes take effect immediately.
              </p>

              {/* Hourly Brackets */}
              <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                <Clock className="h-4 w-4 mr-1" /> Hourly Billing Brackets
              </h3>
              {rates.filter(r => r.type === 'hourly').length === 0 && (
                <p className="text-sm text-gray-500 italic">No hourly brackets configured</p>
              )}
              {rates
                .filter(r => r.type === 'hourly')
                .map((rate, idx) => {
                  const realIdx = rates.findIndex(r => r === rate)
                  return (
                    <div key={rate.id || idx} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <input
                        type="text"
                        value={rate.name}
                        onChange={(e) => handleRateChange(realIdx, 'name', e.target.value)}
                        className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 w-40"
                        placeholder="e.g. 0-1 hr"
                      />
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">0</span>
                        <input
                          type="number"
                          value={rate.maxHours ?? 0}
                          onChange={(e) => handleRateChange(realIdx, 'maxHours', parseFloat(e.target.value))}
                          className="w-20 px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                          placeholder="Max hrs"
                        />
                        <span className="text-sm text-gray-600">hrs</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 mr-1">₹</span>
                        <input
                          type="number"
                          value={rate.amount}
                          onChange={(e) => handleRateChange(realIdx, 'amount', parseFloat(e.target.value))}
                          className="w-24 px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={rate.isActive}
                          onChange={(e) => handleRateChange(realIdx, 'isActive', e.target.checked)}
                          className="mr-1"
                        />
                        Active
                      </label>
                    </div>
                  )
                })}

              {/* Day Pass */}
              <h3 className="text-sm font-semibold text-gray-700 flex items-center mt-6">
                <IndianRupee className="h-4 w-4 mr-1" /> Day Pass
              </h3>
              {rates
                .filter(r => r.type === 'dayPass')
                .map((rate, idx) => {
                  const realIdx = rates.findIndex(r => r === rate)
                  return (
                    <div key={rate.id || idx} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <input
                        type="text"
                        value={rate.name}
                        onChange={(e) => handleRateChange(realIdx, 'name', e.target.value)}
                        className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 w-40"
                        placeholder="Day Pass"
                      />
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 mr-1">₹</span>
                        <input
                          type="number"
                          value={rate.amount}
                          onChange={(e) => handleRateChange(realIdx, 'amount', parseFloat(e.target.value))}
                          className="w-24 px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={rate.isActive}
                          onChange={(e) => handleRateChange(realIdx, 'isActive', e.target.checked)}
                          className="mr-1"
                        />
                        Active
                      </label>
                    </div>
                  )
                })}
              {rates.filter(r => r.type === 'dayPass').length === 0 && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <input
                    type="text"
                    value="Day Pass"
                    className="px-3 py-2 border-2 border-gray-200 rounded-xl w-40 bg-gray-100"
                    disabled
                  />
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-1">₹</span>
                    <input
                      type="number"
                      value={150}
                      disabled
                      className="w-24 px-3 py-2 border-2 border-gray-200 rounded-xl bg-gray-100"
                    />
                  </div>
                  <span className="text-xs text-gray-500">Default: ₹150 (add a day pass rate to customize)</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
