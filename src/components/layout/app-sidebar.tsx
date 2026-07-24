'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UserSearch,
  Package,
  FileText,
  ShoppingCart,
  Factory,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  Building2,
  Store,
  Zap,
  ChevronRight,
  Bell,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@prisma/client'

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  roles?: UserRole[]
  badge?: string
}

const NAV_SECTIONS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }, // Accessible to all
      { label: 'Overview Board', href: '/dashboard/overview', icon: LayoutDashboard },
    ],
  },
  {
    title: 'CRM',
    items: [
      { label: 'Inbox', href: '/dashboard/inbox', icon: MessageSquare, roles: ['COMPANY_ADMIN', 'SALES_REP', 'DESIGNER'] },
      { label: 'Clients', href: '/dashboard/customers', icon: Users, roles: ['COMPANY_ADMIN', 'SALES_REP'] },
      { label: 'Leads', href: '/dashboard/leads', icon: UserSearch, roles: ['COMPANY_ADMIN', 'SALES_REP'] },
      { label: 'Sample Boxes', href: '/dashboard/samples', icon: Package, roles: ['COMPANY_ADMIN', 'SALES_REP'] },
    ],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Quotes', href: '/dashboard/quotes', icon: FileText, roles: ['COMPANY_ADMIN', 'SALES_REP'] },
      { label: 'Orders', href: '/dashboard/orders', icon: ShoppingCart, roles: ['COMPANY_ADMIN', 'SALES_REP', 'PRODUCTION_MANAGER'] },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', href: '/dashboard/products', icon: Package, roles: ['COMPANY_ADMIN', 'SALES_REP', 'PRODUCTION_MANAGER'] },
    ],
  },
  {
    title: 'Production',
    items: [
      { label: 'Production', href: '/dashboard/production', icon: Factory, roles: ['COMPANY_ADMIN', 'PRODUCTION_MANAGER', 'DESIGNER'] },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Invoices', href: '/dashboard/invoices', icon: Receipt, roles: ['COMPANY_ADMIN', 'FINANCE_STAFF'] },
      { label: 'Payments', href: '/dashboard/payments', icon: CreditCard, roles: ['COMPANY_ADMIN', 'FINANCE_STAFF'] },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Reports', href: '/dashboard/reports', icon: BarChart3, roles: ['COMPANY_ADMIN'] },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'Company Stores', href: '/dashboard/stores', icon: Store, roles: ['COMPANY_ADMIN'] },
      { label: 'Team', href: '/dashboard/users', icon: Users, roles: ['COMPANY_ADMIN'] },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['COMPANY_ADMIN'] },
    ],
  },
]

const SUPER_ADMIN_NAV_SECTIONS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Overview',
    items: [
      { label: 'Platform Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Platform Management',
    items: [
      { label: 'Companies (Tenants)', href: '/dashboard/tenants', icon: Building2 },
      { label: 'All Users', href: '/dashboard/users', icon: Users },
      { label: 'System Settings', href: '/dashboard/system', icon: Settings },
    ],
  },
]

type Props = {
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string }
}

export function AppSidebar({ user }: Props) {
  const pathname = usePathname()

  return (
    <aside
      className="flex h-screen w-[260px] shrink-0 flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-bg))]"
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-[hsl(var(--sidebar-border))] px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-[15px] font-bold tracking-tight text-[hsl(var(--foreground))]">CRM</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3">
        {(user?.role === 'SUPER_ADMIN' ? SUPER_ADMIN_NAV_SECTIONS : NAV_SECTIONS)
          .map((section) => {
            // Filter items in the section based on role
            const filteredItems = section.items.filter(item => 
              !item.roles || item.roles.includes((user?.role as UserRole) || 'CUSTOMER')
            )
            
            // Skip section if empty
            if (filteredItems.length === 0) return null

            return (
              <div key={section.title} className="mb-5">
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-[hsl(215,20%,40%)]">
                  {section.title}
                </p>
                <ul className="space-y-0.5">
                  {filteredItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                            isActive
                              ? 'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-fg))] shadow-sm'
                              : 'text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-[hsl(var(--sidebar-active-fg))]'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                              isActive ? 'text-[hsl(var(--sidebar-active-fg))]' : 'text-[hsl(var(--sidebar-fg))]'
                            )}
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600">
                              {item.badge}
                            </span>
                          )}
                          {isActive && <ChevronRight className="h-3 w-3 opacity-60" />}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
      </nav>

      {/* User footer */}
      <div className="border-t border-[hsl(var(--sidebar-border))] p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-hover-bg))] text-xs font-semibold text-[hsl(var(--sidebar-fg))]">
            {user?.name?.slice(0, 2).toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-[hsl(var(--sidebar-fg))] dark:text-white">{user?.name || 'Unknown User'}</p>
            <p className="truncate text-xs text-[hsl(215,16%,47%)]">{user?.email || 'No Email'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
