import type { SessionUser } from '@/lib/auth-helpers'
import {
  Users,
  UserSearch,
  FileText,
  ShoppingCart,
  Factory,
  Receipt,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Clock,
} from 'lucide-react'

// Stat card component
function StatCard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="card-hover rounded-xl border border-[hsl(214,32%,91%)] bg-white p-5 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[hsl(215,16%,47%)]">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-[hsl(222,47%,11%)] dark:text-white">
            {value}
          </p>
          <div className="flex items-center gap-1.5 text-xs">
            {trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-green-500" />}
            {trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
            <span
              className={
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                    ? 'text-red-500'
                    : 'text-[hsl(215,16%,47%)]'
              }
            >
              {change}
            </span>
            <span className="text-[hsl(215,16%,47%)]">vs last month</span>
          </div>
        </div>
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  )
}

// Activity item
function ActivityItem({
  icon: Icon,
  color,
  title,
  subtitle,
  time,
}: {
  icon: React.ElementType
  color: string
  title: string
  subtitle: string
  time: string
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white truncate">{title}</p>
        <p className="text-xs text-[hsl(215,16%,47%)] truncate">{subtitle}</p>
      </div>
      <span className="shrink-0 text-xs text-[hsl(215,16%,47%)]">{time}</span>
    </div>
  )
}

export async function TenantDashboard({ session }: { session: any }) {
  const stats = [
    {
      label: 'Total Revenue',
      value: '$84,250',
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    },
    {
      label: 'Active Leads',
      value: '47',
      change: '+8',
      trend: 'up' as const,
      icon: UserSearch,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
    },
    {
      label: 'Open Quotes',
      value: '23',
      change: '-3',
      trend: 'down' as const,
      icon: FileText,
      color: 'bg-gradient-to-br from-amber-500 to-amber-600',
    },
    {
      label: 'Orders in Production',
      value: '18',
      change: '+5',
      trend: 'up' as const,
      icon: Factory,
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    },
    {
      label: 'Active Customers',
      value: '312',
      change: '+14',
      trend: 'up' as const,
      icon: Users,
      color: 'bg-gradient-to-br from-sky-500 to-sky-600',
    },
    {
      label: 'Outstanding Invoices',
      value: '$12,840',
      change: '-$2,100',
      trend: 'down' as const,
      icon: Receipt,
      color: 'bg-gradient-to-br from-rose-500 to-rose-600',
    },
  ]

  const recentActivity = [
    {
      icon: ShoppingCart,
      color: 'bg-blue-500',
      title: 'New order ORD-00123 created',
      subtitle: 'Acme Corp · $4,200',
      time: '2m ago',
    },
    {
      icon: FileText,
      color: 'bg-purple-500',
      title: 'Quote QT-00089 approved',
      subtitle: 'Global Print Co · $8,650',
      time: '14m ago',
    },
    {
      icon: Receipt,
      color: 'bg-emerald-500',
      title: 'Invoice INV-00456 paid',
      subtitle: 'Stellar Brands · $2,100',
      time: '1h ago',
    },
    {
      icon: UserSearch,
      color: 'bg-amber-500',
      title: 'Lead converted: TechStart Inc',
      subtitle: 'Assigned to John Doe',
      time: '2h ago',
    },
    {
      icon: AlertCircle,
      color: 'bg-rose-500',
      title: 'Invoice INV-00441 overdue',
      subtitle: 'Creative Agency · $3,300',
      time: '3h ago',
    },
    {
      icon: Factory,
      color: 'bg-sky-500',
      title: 'Artwork approved for ORD-00118',
      subtitle: 'Ready for production',
      time: '4h ago',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">
            Good {getGreeting()},{' '}
            <span className="gradient-text">
              {session?.user?.name?.split(' ')[0] ?? 'there'}
            </span>{' '}
            👋
          </h1>
          <p className="mt-1 text-sm text-[hsl(215,16%,47%)]">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[hsl(214,32%,91%)] bg-white px-3 py-2 text-sm text-[hsl(215,16%,47%)] dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
          <Clock className="h-4 w-4" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-xl border border-[hsl(214,32%,91%)] bg-white p-5 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[hsl(222,47%,11%)] dark:text-white">
              Recent Activity
            </h2>
            <button className="text-xs text-[hsl(221,83%,53%)] hover:underline">View all</button>
          </div>
          <div className="divide-y divide-[hsl(214,32%,91%)] dark:divide-[hsl(217,33%,17%)]">
            {recentActivity.map((item, i) => (
              <ActivityItem key={i} {...item} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-5 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
          <h2 className="mb-4 text-base font-semibold text-[hsl(222,47%,11%)] dark:text-white">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'New Lead', icon: UserSearch, color: 'from-purple-500 to-purple-600', href: '/dashboard/leads/new' },
              { label: 'New Quote', icon: FileText, color: 'from-blue-500 to-blue-600', href: '/dashboard/quotes/new' },
              { label: 'New Customer', icon: Users, color: 'from-sky-500 to-sky-600', href: '/dashboard/customers/new' },
              { label: 'New Order', icon: ShoppingCart, color: 'from-emerald-500 to-emerald-600', href: '/dashboard/orders/new' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl bg-gradient-to-br ${action.color} p-4 text-white shadow-sm transition-all hover:shadow-md hover:scale-105`}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{action.label}</span>
              </a>
            ))}
          </div>

          {/* Production overview */}
          <div className="mt-4 rounded-lg bg-[hsl(210,40%,96%)] p-3 dark:bg-[hsl(217,33%,17%)]">
            <p className="text-xs font-semibold text-[hsl(215,16%,47%)] uppercase tracking-wide mb-2">
              Production Status
            </p>
            {[
              { label: 'Artwork Pending', count: 4, color: 'bg-amber-400' },
              { label: 'In Production', count: 11, color: 'bg-blue-400' },
              { label: 'Quality Check', count: 3, color: 'bg-purple-400' },
              { label: 'Ready to Ship', count: 5, color: 'bg-emerald-400' },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${s.color}`} />
                  <span className="text-xs text-[hsl(215,16%,47%)]">{s.label}</span>
                </div>
                <span className="text-xs font-semibold text-[hsl(222,47%,11%)] dark:text-white">
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
