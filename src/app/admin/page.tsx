'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  UtensilsCrossed,
  Image,
  ClipboardCheck,
  Users,
  ArrowRight,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getMenuItems,
  getGalleryItems,
  getPendingChanges,
  getAuditLogs,
  getAllUsers,
} from '@/lib/firestore'
import { formatDateTime } from '@/lib/utils'
import type { AuditLog } from '@/types'
import { SectionLoader } from '@/components/ui/LoadingSpinner'

interface Stats {
  menuItems: number
  galleryItems: number
  pendingChanges: number
  totalUsers: number
}

const QUICK_LINKS = [
  { label: 'Edit Menu', href: '/admin/menu', icon: UtensilsCrossed, color: 'bg-orange-50 text-orange-600' },
  { label: 'Upload Photos', href: '/admin/gallery', icon: Image, color: 'bg-blue-50 text-blue-600' },
  { label: 'Review Changes', href: '/admin/approvals', icon: ClipboardCheck, color: 'bg-amber-50 text-amber-600' },
  { label: 'Manage Users', href: '/admin/users', icon: Users, color: 'bg-purple-50 text-purple-600' },
]

export default function AdminDashboard() {
  const { appUser, role } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [menuItems, galleryItems, pendingChanges, users, recentLogs] =
          await Promise.all([
            getMenuItems(),
            getGalleryItems(),
            getPendingChanges('PENDING'),
            getAllUsers(),
            getAuditLogs(5),
          ])
        setStats({
          menuItems: menuItems.length,
          galleryItems: galleryItems.length,
          pendingChanges: pendingChanges.length,
          totalUsers: users.length,
        })
        setLogs(recentLogs)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome */}
      <div>
        <h1 className="font-serif text-3xl text-charcoal">
          {greeting()}, {appUser?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-charcoal/55 mt-1 text-sm">
          Here's what's happening with your restaurant today.
        </p>
      </div>

      {loading ? (
        <SectionLoader />
      ) : (
        <>
          {/* Stats */}
          {(role === 'ADMIN' || role === 'DEVELOPER') && stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard
                label="Menu Items"
                value={stats.menuItems}
                icon={UtensilsCrossed}
                href="/admin/menu"
                color="text-orange-600"
                bg="bg-orange-50"
              />
              <StatCard
                label="Gallery Items"
                value={stats.galleryItems}
                icon={Image}
                href="/admin/gallery"
                color="text-blue-600"
                bg="bg-blue-50"
              />
              <StatCard
                label="Pending Approvals"
                value={stats.pendingChanges}
                icon={ClipboardCheck}
                href="/admin/approvals"
                color="text-amber-600"
                bg="bg-amber-50"
                highlight={stats.pendingChanges > 0}
              />
              <StatCard
                label="Team Members"
                value={stats.totalUsers}
                icon={Users}
                href="/admin/users"
                color="text-purple-600"
                bg="bg-purple-50"
              />
            </div>
          )}

          {/* Quick actions */}
          <div className="admin-card">
            <h2 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {QUICK_LINKS.filter((ql) => {
                if (role === 'ASSISTANT') return ql.href !== '/admin/users' && ql.href !== '/admin/approvals'
                return true
              }).map(({ label, href, icon: Icon, color }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-2.5 p-5 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
                >
                  <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-charcoal text-center">{label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          {(role === 'ADMIN' || role === 'DEVELOPER') && logs.length > 0 && (
            <div className="admin-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-charcoal flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Recent Activity
                </h2>
                <Link href="/admin/analytics" className="text-xs text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-gray-500">
                        {log.userName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-charcoal">
                        <span className="font-medium">{log.userName}</span>{' '}
                        <span className="text-charcoal/60">{log.action}</span>
                      </p>
                      <p className="text-xs text-charcoal/40 mt-0.5">
                        {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {role === 'ASSISTANT' && (
            <div className="admin-card bg-amber-50 border-amber-200">
              <h2 className="font-semibold text-amber-800 mb-2">Assistant Mode</h2>
              <p className="text-sm text-amber-700">
                Changes you submit will be sent for Admin review before going live on the website.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  color,
  bg,
  highlight = false,
}: {
  label: string
  value: number
  icon: React.ElementType
  href: string
  color: string
  bg: string
  highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className={`admin-card hover:shadow-md transition-shadow cursor-pointer ${
        highlight ? 'ring-2 ring-amber-400' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold text-charcoal">{value}</p>
          <p className="text-xs text-charcoal/50 mt-1">{label}</p>
        </div>
        <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${color}`} style={{ width: 18, height: 18 }} />
        </div>
      </div>
    </Link>
  )
}
