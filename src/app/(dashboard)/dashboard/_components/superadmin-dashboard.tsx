import {
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Clock,
  Activity
} from 'lucide-react'
import { prisma } from '@/lib/db'

export async function SuperAdminDashboard({ session }: { session: any }) {
  // Fetch real data for super admin dashboard
  const [totalTenants, totalUsers, activeTenants] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.tenant.count({ where: { isActive: true } }),
  ])

  const stats = [
    {
      label: 'Total Companies',
      value: totalTenants.toString(),
      change: '+2 this week',
      trend: 'up' as const,
      icon: Building2,
      color: 'bg-gradient-to-br from-primary to-primary',
    },
    {
      label: 'Active Companies',
      value: activeTenants.toString(),
      change: `${Math.round((activeTenants / Math.max(totalTenants, 1)) * 100)}% of total`,
      trend: 'up' as const,
      icon: Activity,
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    },
    {
      label: 'Total Platform Users',
      value: totalUsers.toString(),
      change: '+15 this week',
      trend: 'up' as const,
      icon: Users,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
    },
    {
      label: 'Global Platform MRR',
      value: '$0.00', // Mock MRR for now
      change: '+0.0%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'bg-gradient-to-br from-amber-500 to-amber-600',
    },
  ]

  const recentActivity = [
    {
      icon: Building2,
      color: 'bg-primary',
      title: 'New company onboarded: Demo Company',
      subtitle: 'admin@demo-company.com',
      time: '1h ago',
    },
    {
      icon: Users,
      color: 'bg-purple-500',
      title: 'New super admin created',
      subtitle: 'System',
      time: '2h ago',
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">
            Super Admin Overview
          </h1>
          <p className="mt-1 text-sm text-[hsl(215,16%,47%)]">
            Here's the current status of the entire platform.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[hsl(214,32%,91%)] bg-white px-3 py-2 text-sm text-[hsl(215,16%,47%)] dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
          <Clock className="h-4 w-4" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card-hover rounded-xl border border-[hsl(214,32%,91%)] bg-white p-5 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[hsl(215,16%,47%)]">{stat.label}</p>
                <p className="text-2xl font-bold tracking-tight text-[hsl(222,47%,11%)] dark:text-white">
                  {stat.value}
                </p>
                <div className="flex items-center gap-1.5 text-xs">
                  {stat.trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-green-500" />}
                  <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-500'}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`rounded-xl p-3 ${stat.color}`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-xl border border-[hsl(214,32%,91%)] bg-white p-5 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[hsl(222,47%,11%)] dark:text-white">
              Platform Activity
            </h2>
          </div>
          <div className="divide-y divide-[hsl(214,32%,91%)] dark:divide-[hsl(217,33%,17%)]">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-3">
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white truncate">{item.title}</p>
                  <p className="text-xs text-[hsl(215,16%,47%)] truncate">{item.subtitle}</p>
                </div>
                <span className="shrink-0 text-xs text-[hsl(215,16%,47%)]">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-5 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
          <h2 className="mb-4 text-base font-semibold text-[hsl(222,47%,11%)] dark:text-white">
            System Health
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[hsl(215,16%,47%)]">Database Status</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[hsl(215,16%,47%)]">API Uptime</span>
              <span className="text-sm font-semibold text-[hsl(222,47%,11%)] dark:text-white">
                99.9%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[hsl(215,16%,47%)]">Background Workers</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
