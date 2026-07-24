import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ----------------------------------------------------------------
// DataTable
// ----------------------------------------------------------------

type Column<T> = {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  accessor?: (row: T) => React.ReactNode
  className?: string
}

type DataTableProps<T extends { id: string }> = {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading,
  emptyMessage = 'No records found',
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-[hsl(214,32%,91%)] bg-white shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(214,32%,91%)] bg-[hsl(210,40%,98%)] dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(217,33%,17%)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)]',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(214,32%,91%)] dark:divide-[hsl(217,33%,17%)]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-[hsl(210,40%,93%)] dark:bg-[hsl(217,33%,20%)]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-[hsl(215,16%,47%)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors',
                    onRowClick &&
                      'cursor-pointer hover:bg-[hsl(210,40%,98%)] dark:hover:bg-[hsl(217,33%,15%)]'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3 text-[hsl(222,47%,11%)] dark:text-white', col.className)}
                    >
                      {col.render ? col.render(row) : col.accessor ? col.accessor(row) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Pagination
// ----------------------------------------------------------------

type PaginationProps = {
  page: number
  totalPages: number
  total: number
  perPage: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, perPage, onPageChange }: PaginationProps) {
  const from = (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  return (
    <div className="flex items-center justify-between px-1 pt-3 text-sm">
      <span className="text-[hsl(215,16%,47%)]">
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[hsl(214,32%,91%)] text-[hsl(215,16%,47%)] transition-all hover:bg-[hsl(210,40%,96%)] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[hsl(217,33%,17%)] dark:hover:bg-[hsl(217,33%,17%)]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = i + 1
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium transition-all',
                p === page
                  ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white'
                  : 'border-[hsl(214,32%,91%)] text-[hsl(215,16%,47%)] hover:bg-[hsl(210,40%,96%)] dark:border-[hsl(217,33%,17%)] dark:hover:bg-[hsl(217,33%,17%)]'
              )}
            >
              {p}
            </button>
          )
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[hsl(214,32%,91%)] text-[hsl(215,16%,47%)] transition-all hover:bg-[hsl(210,40%,96%)] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[hsl(217,33%,17%)] dark:hover:bg-[hsl(217,33%,17%)]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Page header
// ----------------------------------------------------------------

type PageHeaderProps = {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumbs?: Array<{ label: string; href?: string }>
}

export function PageHeader({ title, description, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        {breadcrumbs && (
          <nav className="mb-2 flex items-center gap-1.5 text-xs text-[hsl(215,16%,47%)]">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span>/</span>}
                {b.href ? (
                  <a href={b.href} className="hover:text-[hsl(var(--primary))] transition-colors">
                    {b.label}
                  </a>
                ) : (
                  <span className="text-[hsl(222,47%,11%)] font-medium dark:text-white">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-bold text-[hsl(222,47%,11%)] dark:text-white">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-[hsl(215,16%,47%)]">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

// ----------------------------------------------------------------
// Empty state
// ----------------------------------------------------------------

type EmptyStateProps = {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(210,40%,96%)] dark:bg-[hsl(217,33%,17%)]">
          <span className="text-[hsl(215,16%,47%)]">{icon}</span>
        </div>
      )}
      <h3 className="text-base font-semibold text-[hsl(222,47%,11%)] dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-[hsl(215,16%,47%)]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ----------------------------------------------------------------
// Stat card (reusable from dashboard)
// ----------------------------------------------------------------

type StatCardProps = {
  label: string
  value: string | number
  icon?: React.ReactNode
  color?: string
  suffix?: string
}

export function StatCard({ label, value, icon, color = 'bg-primary', suffix }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-4 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[hsl(215,16%,47%)]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">
            {value}
            {suffix && <span className="ml-1 text-sm font-normal text-[hsl(215,16%,47%)]">{suffix}</span>}
          </p>
        </div>
        {icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${color}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
