'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, Edit, Trash2, Shield, Save, X } from 'lucide-react'
import Notification, { useNotification } from '@/components/Notification'
import ConfirmDialog from '@/components/ConfirmDialog'

interface Operator {
  id: string
  username: string
  name: string
  role: string
}

export default function SettingsPage() {
  const router = useRouter()
  const { notifications, showNotification } = useNotification()
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null)

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    role: 'operator'
  })

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  useEffect(() => {
    loadOperators()
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
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
          const response = await fetch(`/api/operators/${operator.id}`, {
            method: 'DELETE'
          })

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">Loading settings...</p>
        </div>
      </div>
    )
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage operators and system settings</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Operator
        </button>
      </div>

      {/* Operator Form */}
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

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400"
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password {editingOperator && '(leave blank to keep current)'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400"
                placeholder={editingOperator ? '••••••••' : 'Enter password'}
                required={!editingOperator}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400"
              >
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="md:col-span-2 flex space-x-4">
              <button
                type="submit"
                className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingOperator ? 'Update Operator' : 'Create Operator'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Operators List */}
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
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  operator.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {operator.role}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(operator)}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(operator)}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
