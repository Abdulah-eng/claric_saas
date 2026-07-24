'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/data-table'
import { formatCurrency } from '@/lib/utils'
import { Users, ShoppingCart, DollarSign, Activity } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'

export default function ReportsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reports/dashboard')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse h-96 rounded-xl bg-[hsl(210,40%,93%)] dark:bg-[hsl(217,33%,17%)]" />
  if (!data) return <div className="py-20 text-center text-red-500">Failed to load report data.</div>

  const { kpis, productionStats, revenueChart } = data

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-[hsl(217,33%,17%)] p-6 rounded-2xl border border-[hsl(214,32%,91%)] dark:border-white/5 shadow-sm flex items-center gap-4">
      <div className={`p-4 rounded-xl ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-[hsl(215,16%,47%)]">{title}</p>
        <p className="text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">{value}</p>
      </div>
    </div>
  )

  return (
    <div className="pb-20 space-y-8">
      <PageHeader title="Reporting Dashboard" description="Key performance indicators and analytics." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Customers" value={kpis.totalCustomers} icon={Users} color="bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-400" />
        <StatCard title="Total Orders" value={kpis.totalOrders} icon={ShoppingCart} color="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400" />
        <StatCard title="Total Revenue" value={formatCurrency(kpis.totalRevenue)} icon={DollarSign} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" />
        <StatCard title="Active Jobs" value={productionStats.reduce((acc: number, curr: any) => acc + (curr.status !== 'DONE' && curr.status !== 'CANCELLED' ? curr.count : 0), 0)} icon={Activity} color="bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[hsl(217,33%,17%)] p-6 rounded-2xl border border-[hsl(214,32%,91%)] dark:border-white/5 shadow-sm">
          <h3 className="font-bold text-[hsl(222,47%,11%)] dark:text-white mb-6">Revenue Over Time</h3>
          <div className="h-[300px]">
            {revenueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[hsl(215,16%,47%)]">Not enough data to display chart.</div>
            )}
          </div>
        </div>

        {/* Production Jobs Bar Chart */}
        <div className="bg-white dark:bg-[hsl(217,33%,17%)] p-6 rounded-2xl border border-[hsl(214,32%,91%)] dark:border-white/5 shadow-sm">
          <h3 className="font-bold text-[hsl(222,47%,11%)] dark:text-white mb-6">Production Status</h3>
          <div className="h-[300px]">
            {productionStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productionStats.map((s: any) => ({ ...s, name: s.status.replace('_', ' ') }))} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} stroke="#64748b" fontSize={12} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[hsl(215,16%,47%)]">No production jobs active.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
