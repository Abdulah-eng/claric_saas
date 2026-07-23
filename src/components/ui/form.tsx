import { cn } from '@/lib/utils'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[hsl(222,47%,20%)] dark:text-[hsl(210,40%,85%)]"
        >
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-[hsl(215,16%,47%)]">{leftIcon}</span>
          </div>
        )}
        <input
          id={id}
          className={cn(
            'flex h-9 w-full rounded-lg border border-[hsl(214,32%,91%)] bg-white px-3 py-2 text-sm text-[hsl(222,47%,11%)] placeholder:text-[hsl(215,16%,60%)] outline-none transition-all',
            'focus:border-[hsl(221,83%,53%)] focus:ring-2 focus:ring-[hsl(221,83%,53%)]/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(217,33%,17%)] dark:text-white dark:placeholder:text-[hsl(215,20%,40%)]',
            'dark:focus:border-[hsl(221,83%,60%)] dark:focus:ring-[hsl(221,83%,60%)]/20',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-[hsl(215,16%,47%)]">{rightIcon}</span>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-[hsl(215,16%,47%)]">{hint}</p>}
    </div>
  )
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
  hint?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export function Select({ label, error, hint, options, placeholder, className, id, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[hsl(222,47%,20%)] dark:text-[hsl(210,40%,85%)]"
        >
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <select
        id={id}
        className={cn(
          'flex h-9 w-full rounded-lg border border-[hsl(214,32%,91%)] bg-white px-3 py-2 text-sm text-[hsl(222,47%,11%)] outline-none transition-all',
          'focus:border-[hsl(221,83%,53%)] focus:ring-2 focus:ring-[hsl(221,83%,53%)]/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(217,33%,17%)] dark:text-white',
          error && 'border-red-400',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-[hsl(215,16%,47%)]">{hint}</p>}
    </div>
  )
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[hsl(222,47%,20%)] dark:text-[hsl(210,40%,85%)]"
        >
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border border-[hsl(214,32%,91%)] bg-white px-3 py-2 text-sm text-[hsl(222,47%,11%)] placeholder:text-[hsl(215,16%,60%)] outline-none transition-all resize-y',
          'focus:border-[hsl(221,83%,53%)] focus:ring-2 focus:ring-[hsl(221,83%,53%)]/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(217,33%,17%)] dark:text-white',
          error && 'border-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-[hsl(215,16%,47%)]">{hint}</p>}
    </div>
  )
}
