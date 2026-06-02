'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  UtensilsCrossed,
  Image as ImageIcon,
  Settings,
  Truck,
  Users,
  ClipboardCheck,
  BarChart3,
  LogOut,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles: string[]
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['DEVELOPER', 'ADMIN', 'ASSISTANT'] },
  { label: 'Menu', href: '/admin/menu', icon: UtensilsCrossed, roles: ['DEVELOPER', 'ADMIN', 'ASSISTANT'] },
  { label: 'Gallery', href: '/admin/gallery', icon: ImageIcon, roles: ['DEVELOPER', 'ADMIN', 'ASSISTANT'] },
  { label: 'Approvals', href: '/admin/approvals', icon: ClipboardCheck, roles: ['DEVELOPER', 'ADMIN'] },
  { label: 'Delivery', href: '/admin/delivery', icon: Truck, roles: ['DEVELOPER', 'ADMIN'] },
  { label: 'Settings', href: '/admin/settings', icon: Settings, roles: ['DEVELOPER', 'ADMIN'] },
  { label: 'Users', href: '/admin/users', icon: Users, roles: ['DEVELOPER', 'ADMIN'] },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, roles: ['DEVELOPER', 'ADMIN'] },
]

export function Sidebar({ pendingCount = 0, logoUrl }: { pendingCount?: number; logoUrl?: string }) {
  const pathname = usePathname()
  const { appUser, role, signOut } = useAuth()
  const router = useRouter()

  const visibleItems = NAV_ITEMS.filter((item) => role && item.roles.includes(role)).map(
    (item) =>
      item.href === '/admin/approvals' ? { ...item, badge: pendingCount } : item
  )

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    router.push('/')
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-charcoal min-h-screen border-r border-white/5">
      {/* Brand */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <Image src={logoUrl} alt="Logo" width={32} height={32} className="rounded-sm object-contain" />
          ) : (
            <div className="w-8 h-8 bg-gold rounded-sm flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-charcoal" />
            </div>
          )}
          <div>
            <p className="font-serif text-cream text-sm font-semibold">Big Treats</p>
            <p className="text-cream/40 text-xs">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map(({ label, href, icon: Icon, badge }) => {
          const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-cream'
                  : 'text-cream/60 hover:text-cream hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge != null && badge > 0 && (
                <span className="bg-gold text-charcoal text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2 text-sm text-cream/40 hover:text-cream rounded-sm hover:bg-white/5 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View Website
        </Link>

        <div className="px-3 py-2 flex items-center gap-3">
          <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center shrink-0">
            <span className="text-cream text-xs font-bold">{appUser?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-cream text-xs font-medium truncate">{appUser?.name}</p>
            <p className="text-cream/40 text-xs capitalize truncate">{role?.toLowerCase()}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-cream/40 hover:text-red-400 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
