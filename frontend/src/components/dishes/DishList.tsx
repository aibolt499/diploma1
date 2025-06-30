import { Dish } from '@/types/dish'
import { DishCard } from './DishCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ChefHat, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface DishListProps {
  dishes: Dish[]
  isLoading: boolean
  isOwner?: boolean
  isDeleting?: string | null
  isSubmitting?: string | null
  onDelete?: (dishId: string) => void
  onSubmitForReview?: (dishId: string) => void
  onViewDetails?: (dishId: string) => void
  emptyTitle?: string
  emptyDescription?: string
  searchQuery?: string
  statusFilter?: string
  getTotalCookingTime: (dish: Dish) => number | null
  getDishCategories: (dish: Dish) => any[]
}

export function DishList({
  dishes,
  isLoading,
  isOwner = false,
  isDeleting,
  isSubmitting,
  onDelete,
  onSubmitForReview,
  onViewDetails,
  emptyTitle = 'Страви не знайдено',
  emptyDescription = 'Спробуйте змінити критерії пошуку або очистити фільтри',
  searchQuery = '',
  statusFilter = '',
  getTotalCookingTime,
  getDishCategories
}: DishListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Завантаження страв...</p>
        </div>
      </div>
    )
  }

  if (dishes.length === 0) {
    return (
      <div className="text-center py-12">
        <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {searchQuery || statusFilter ? emptyTitle : 'У вас ще немає страв'}
        </h3>
        <p className="text-gray-600 mb-6">
          {searchQuery || statusFilter 
            ? emptyDescription
            : 'Створіть свою першу страву прямо зараз!'
          }
        </p>
        {searchQuery || statusFilter ? (
          <Button
            variant="outline"
            onClick={() => {
              // This should be handled by the parent component
              // We're just rendering the button here
            }}
          >
            Очистити фільтри
          </Button>
        ) : (
          <Link href="/dishes/add">
            <Button leftIcon={<Plus className="w-4 h-4" />}>
              Створити першу страву
            </Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {dishes.map((dish) => (
        <DishCard
          key={dish.id}
          dish={dish}
          isOwner={isOwner}
          isDeleting={isDeleting === dish.id}
          isSubmitting={isSubmitting === dish.id}
          onDelete={onDelete ? () => onDelete(dish.id) : undefined}
          onSubmitForReview={onSubmitForReview ? () => onSubmitForReview(dish.id) : undefined}
          onViewDetails={onViewDetails ? () => onViewDetails(dish.id) : undefined}
          getTotalCookingTime={getTotalCookingTime}
          getDishCategories={getDishCategories}
        />
      ))}
    </div>
  )
}