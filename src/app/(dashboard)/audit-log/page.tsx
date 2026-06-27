'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, ChevronLeft, ChevronRight, Shield } from 'lucide-react'
import Notification, { useNotification } from '@/components/Notification'

interface AuditEntry {
  id: string
  action: string
  details: string | null
  createdAt: string
  operator: { name: string; username: string } | null
}

export default function AuditLogPage() {
  const router = useRouter()
  const { notifications } = useNotification()
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionFilter, setActionFilter] = useState('')

  useEffect(() => {
    checkAuth()
    loadLogs()
  }, [page, actionFilter])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check')
      if (!response.ok) router.push('/')
    } catch {
      router.push('/')
    }
  }

  const loadLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' })
      if (actionFilter) params.set('action', actionFilter)
      const response = await fetch(`/api/audit-logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error loading audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes('exit')) return 'text-red-600 bg-red-50'
    if (action.includes('entry')) return 'text-green-600 bg-green-50'
    if (action.includes('update') || action.includes('edit')) return 'text-blue-600 bg-blue-50'
    return 'text-purple-600 bg-purple-50'
  }

  return (
    <div className="space-y-6">
      <Notification notifications={notifications} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-600 mt-1">Track all operator actions in the system</p>
        </div>
        <FileText className="h-8 w-8 text-purple-600" />
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">Filter by action:</span>
          {['', 'entry', 'exit', 'update', 'delete'].map(a => (
            <button
              key={a}
              onClick={() => { setActionFilter(a); setPage(1) }}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                actionFilter === a
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {a || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/20 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Operator</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Action</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Details</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4].map(j => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-shimmer w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 text-purple-600 mr-2" />
                        <span className="font-medium text-gray-900">
                          {log.operator?.name || 'System'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                      {log.details || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
