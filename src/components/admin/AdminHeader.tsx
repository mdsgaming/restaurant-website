'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Menu,
  X,
  Bell,
  LogOut,
  UtensilsCrossed,
  LayoutDashboard,
  UtensilsCrossed as MenuIcon,
  Image,
  Settings,
  Truck,
  Users,
  ClipboardCheck,
  BarChart3,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { RoleBadge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['DEVELOPER', 'ADMIN', 'ASSISTANT'] },
  { label: 'Menu', href: '/admin/menu', icon: MenuIcon, roles: ['DEVELOPER', 'ADMIN', 'ASSISTANT'] },
  { label: 'Gallery', href: '/admin/gallery', icon: Image, roles: ['DEVELOPER', 'ADMIN', 'ASSISTANT'] },
  { label: 'Approvals', href: '/admin/approvals', icon: ClipboardCheck, roles: ['DEVELOPER', 'ADMIN'] },
  { label: 'Delivery', href: '/admin/delivery', icon: Truck, roles: ['DEVELOPER', 'ADMIN'] },
  { label: 'Settings', href: '/admin/settings', icon: Settings, roles: ['DEVELOPER', 'ADMIN'] },
  { label: 'Users', href: '/admin/users', icon: Users, roles: ['DEVELOPER', 'ADMIN'] },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, roles: ['DEVELOPER', 'ADMIN'] },
]

export function AdminHeader({
  title,
  pendingCount = 0,
}: {
  title?: string
  pendingCount?: number
}) {
  const [open, setOpen] = useState(false)
  const { appUser, role, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const visibleItems = NAV_ITEMS.filter((item) => role && item.roles.includes(role))

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    router.push('/')
  }

  return (
    <>
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Left: hamburger (mobile) + title */}
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 rounded-sm"
            onClick={() => setOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          {title && <h1 className="font-serif text-xl text-charcoal hidden sm:block">{title}</h1>}
        </div>

        {/* Right: bells + user */}
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <Link
              href="/admin/approvals"
              className="relative p-2 text-gray-500 hover:text-gray-700 rounded-sm hover:bg-gray-50 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-gold rounded-full text-charcoal text-xs font-bold flex items-center justify-center">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            </Link>
          )}
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-cream text-xs font-bold">{appUser?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="hidden sm:block">
              <p className="font-medium text-charcoal text-sm leading-none">{appUser?.name}</p>
              {role && <RoleBadge role={role} />}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-charcoal/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-charcoal flex flex-col">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gold rounded-sm flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4 text-charcoal" />
                </div>
                <span className="font-serif text-cream font-semibold">Admin</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-cream/50 hover:text-cream">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {visibleItems.map(({ label, href, icon: Icon }) => {
                const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-cream'
                        : 'text-cream/60 hover:text-cream hover:bg-white/5'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {href === '/admin/approvals' && pendingCount > 0 && (
                      <span className="ml-auto bg-gold text-charcoal text-xs font-bold px-1.5 py-0.5 rounded-full">
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            <div className="p-4 border-t border-white/5 space-y-2">
              <Link href="/" target="_blank"
                className="flex items-center gap-3 px-3 py-2 text-sm text-cream/40 hover:text-cream rounded-sm hover:bg-white/5 transition-colors">
                <ExternalLink className="w-4 h-4" /> View Website
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2 text-sm text-cream/40 hover:text-red-400 rounded-sm hover:bg-white/5 transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
