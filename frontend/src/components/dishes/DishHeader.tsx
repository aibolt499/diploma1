import { Button } from '@/components/ui/Button'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'

interface DishHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  backLabel?: string
  showAddButton?: boolean
  addButtonHref?: string
  addButtonLabel?: string
}

export function DishHeader({
  title,
  subtitle,
  backHref = '/profile',
  backLabel = 'Назад',
  showAddButton = false,
  addButtonHref = '/dishes/add',
  addButtonLabel = 'Додати нову страву'
}: DishHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {backHref && (
          <Link href={backHref}>
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              {backLabel}
            </Button>
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {showAddButton && (
        <Link href={addButtonHref}>
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            {addButtonLabel}
          </Button>
        </Link>
      )}
    </div>
  )
}