import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'purple'
  | 'outline'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[hsl(210,40%,93%)] text-[hsl(222,47%,20%)]',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  destructive: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  outline: 'border border-[hsl(214,32%,91%)] text-[hsl(215,16%,47%)] bg-transparent',
}

type Props = {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

export function Badge({ variant = 'default', children, className, dot }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', {
            'bg-current': true,
          })}
        />
      )}
      {children}
    </span>
  )
}

// Convenience: lead/order/quote status badge
export function LeadStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    NEW: 'info',
    CONTACTED: 'purple',
    QUALIFIED: 'warning',
    PROPOSAL: 'default',
    WON: 'success',
    LOST: 'destructive',
  }
  const labels: Record<string, string> = {
    NEW: 'New',
    CONTACTED: 'Contacted',
    QUALIFIED: 'Qualified',
    PROPOSAL: 'Proposal',
    WON: 'Won',
    LOST: 'Lost',
  }
  return <Badge variant={map[status] ?? 'default'} dot>{labels[status] ?? status}</Badge>
}

export function QuoteStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    DRAFT: 'outline',
    SENT: 'info',
    VIEWED: 'purple',
    APPROVED: 'success',
    REJECTED: 'destructive',
    EXPIRED: 'warning',
    CONVERTED: 'success',
  }
  const labels: Record<string, string> = {
    DRAFT: 'Draft', SENT: 'Sent', VIEWED: 'Viewed',
    APPROVED: 'Approved', REJECTED: 'Rejected', EXPIRED: 'Expired', CONVERTED: 'Converted',
  }
  return <Badge variant={map[status] ?? 'default'} dot>{labels[status] ?? status}</Badge>
}

export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    CONFIRMED: 'info',
    IN_PRODUCTION: 'purple',
    QUALITY_CHECK: 'warning',
    READY: 'success',
    SHIPPED: 'info',
    DELIVERED: 'success',
    CANCELLED: 'destructive',
  }
  const labels: Record<string, string> = {
    CONFIRMED: 'Confirmed', IN_PRODUCTION: 'In Production', QUALITY_CHECK: 'QC',
    READY: 'Ready', SHIPPED: 'Shipped', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
  }
  return <Badge variant={map[status] ?? 'default'} dot>{labels[status] ?? status}</Badge>
}

export function InvoiceStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    DRAFT: 'outline', SENT: 'info', PAID: 'success',
    PARTIALLY_PAID: 'warning', OVERDUE: 'destructive', CANCELLED: 'destructive',
  }
  const labels: Record<string, string> = {
    DRAFT: 'Draft', SENT: 'Sent', PAID: 'Paid',
    PARTIALLY_PAID: 'Partial', OVERDUE: 'Overdue', CANCELLED: 'Cancelled',
  }
  return <Badge variant={map[status] ?? 'default'} dot>{labels[status] ?? status}</Badge>
}

export function SampleStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    REQUESTED: 'info', SHIPPED: 'purple', DELIVERED: 'warning',
    CONVERTED: 'success', DECLINED: 'destructive',
  }
  const labels: Record<string, string> = {
    REQUESTED: 'Requested', SHIPPED: 'Shipped', DELIVERED: 'Delivered',
    CONVERTED: 'Converted', DECLINED: 'Declined',
  }
  return <Badge variant={map[status] ?? 'default'} dot>{labels[status] ?? status}</Badge>
}
