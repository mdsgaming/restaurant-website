'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Activity, User, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAuditLogs,
  getMenuItems,
  getGalleryItems,
  getAllUsers,
  getPendingChanges,
} from '@/lib/firestore'
import { formatDateTime } from '@/lib/utils'
import { RoleBadge } from '@/components/ui/Badge'
import type { AuditLog } from '@/types'
import { SectionLoader } from '@/components/ui/LoadingSpinner'

export default function AnalyticsPage() {
  const { isDeveloper } = useAuth()
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState({
    menuItems: 0,
    galleryItems: 0,
    users: 0,
    pendingChanges: 0,
  })

  useEffect(() => {
    async function load() {
      try {
        const [allLogs, menuItems, galleryItems, users, pendingChanges] =
          await Promise.all([
            getAuditLogs(100),
            getMenuItems(),
            getGalleryItems(),
            getAllUsers(),
            getPendingChanges('PENDING'),
          ])
        setLogs(allLogs)
        setStats({
          menuItems: menuItems.length,
          galleryItems: galleryItems.length,
          users: users.length,
          pendingChanges: pendingChanges.length,
        })
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const actionFrequency = logs.reduce((acc, log) => {
    const key = log.action
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topActions = Object.entries(actionFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const userActivity = logs.reduce((acc, log) => {
    acc[log.userName] = (acc[log.userName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topUsers = Object.entries(userActivity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-serif text-2xl text-charcoal">Analytics & Activity</h1>
        <p className="text-sm text-charcoal/50 mt-0.5">
          Monitor website content and team activity.
        </p>
      </div>

      {loading ? (
        <SectionLoader />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Menu Items', value: stats.menuItems, icon: '🍽' },
              { label: 'Gallery Items', value: stats.galleryItems, icon: '📸' },
              { label: 'Team Members', value: stats.users, icon: '👥' },
              { label: 'Pending Changes', value: stats.pendingChanges, icon: '⏳' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="admin-card text-center">
                <span className="text-3xl">{icon}</span>
                <p className="text-2xl font-bold text-charcoal mt-2">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top actions */}
            <div className="admin-card">
              <h2 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Top Actions
              </h2>
              {topActions.length === 0 ? (
                <p className="text-sm text-gray-400">No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {topActions.map(([action, count]) => {
                    const max = topActions[0][1]
                    return (
                      <div key={action}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-charcoal capitalize">{action}</span>
                          <span className="text-gray-400 font-medium">{count}x</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Most active users */}
            <div className="admin-card">
              <h2 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Most Active Users
              </h2>
              {topUsers.length === 0 ? (
                <p className="text-sm text-gray-400">No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {topUsers.map(([name, count]) => (
                    <div key={name} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary text-xs font-bold">{name?.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="flex-1 text-sm text-charcoal">{name}</span>
                      <span className="text-xs text-gray-400">{count} actions</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity feed */}
          <div className="admin-card">
            <h2 className="font-semibold text-charcoal mb-5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Activity Log
            </h2>
            {logs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No activity recorded yet</p>
            ) : (
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-gray-500">{log.userName?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-charcoal text-sm">{log.userName}</span>
                        <RoleBadge role={log.userRole} />
                        <span className="text-sm text-charcoal/60">{log.action}</span>
                        {log.resource && (
                          <span className="text-xs text-gray-400">· {log.resource}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(log.createdAt)}</p>
                    </div>
                    {isDeveloper && log.details && (
                      <details className="text-xs text-gray-400 ml-auto">
                        <summary className="cursor-pointer hover:text-gray-600">Details</summary>
                        <pre className="mt-1 text-xs bg-gray-50 p-2 rounded max-w-xs overflow-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
