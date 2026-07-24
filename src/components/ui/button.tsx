import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm hover:opacity-90 hover:shadow-md focus-visible:ring-[hsl(var(--ring))]',
  secondary:
    'bg-[hsl(210,40%,96%)] text-[hsl(222,47%,11%)] hover:bg-[hsl(210,40%,92%)] dark:bg-[hsl(217,33%,17%)] dark:text-white dark:hover:bg-[hsl(217,33%,22%)]',
  outline:
    'border border-[hsl(214,32%,91%)] bg-transparent text-[hsl(222,47%,11%)] hover:bg-[hsl(210,40%,96%)] dark:border-[hsl(217,33%,17%)] dark:text-white dark:hover:bg-[hsl(217,33%,17%)]',
  ghost:
    'bg-transparent text-[hsl(222,47%,11%)] hover:bg-[hsl(210,40%,96%)] dark:text-white dark:hover:bg-[hsl(217,33%,17%)]',
  destructive:
    'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-sm gap-2',
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  iconRight,
  className,
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icon
      )}
      {children}
      {!loading && iconRight}
    </button>
  )
}
