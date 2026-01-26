import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface OptionCardProps {
  label: string
  description?: string
  imageSrc?: string | null
  colorHex?: string | null
  isSelected?: boolean
  onClick?: () => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function OptionCard({
  label,
  description,
  imageSrc,
  colorHex,
  isSelected = false,
  onClick,
  disabled = false,
  size = 'md',
}: OptionCardProps) {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  const imageSizes = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex flex-col items-center text-center rounded-lg border-2 transition-all',
        sizeClasses[size],
        isSelected
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}

      {/* Image or color swatch */}
      {imageSrc ? (
        <div className={cn('mb-2 rounded bg-gray-100 flex items-center justify-center', imageSizes[size])}>
          <img
            src={imageSrc}
            alt={label}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : colorHex ? (
        <div
          className={cn('mb-2 rounded border border-gray-300', imageSizes[size])}
          style={{ backgroundColor: colorHex }}
        />
      ) : null}

      {/* Label */}
      <span
        className={cn(
          'font-medium',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-lg'
        )}
      >
        {label}
      </span>

      {/* Description */}
      {description && (
        <span className="text-xs text-gray-500 mt-1 line-clamp-2">{description}</span>
      )}
    </button>
  )
}

interface OptionGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4 | 5
}

export function OptionGrid({ children, columns = 3 }: OptionGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
  }

  return <div className={cn('grid gap-4', gridCols[columns])}>{children}</div>
}
