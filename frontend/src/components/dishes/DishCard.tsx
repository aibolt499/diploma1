import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Dish } from '@/types/dish'
import { formatRelativeTime } from '@/lib/utils'
import { 
  ChefHat, 
  Clock,
  Users,
  Heart,
  MessageCircle,
  Grid3X3,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import Link from 'next/link'

interface DishCardProps {
  dish: Dish
  isOwner?: boolean
  isDeleting?: boolean
  isSubmitting?: boolean
  onDelete?: (dishId: string) => void
  onSubmitForReview?: (dishId: string) => void
  onViewDetails?: () => void
  showActions?: boolean
  getTotalCookingTime: (dish: Dish) => number | null
  getDishCategories: (dish: Dish) => any[]
}

export function DishCard({ 
  dish, 
  isOwner = false,
  isDeleting = false,
  isSubmitting = false,
  onDelete,
  onSubmitForReview,
  onViewDetails,
  showActions = true,
  getTotalCookingTime,
  getDishCategories
}: DishCardProps) {
  const cookingTime = getTotalCookingTime(dish)
  const likesCount = dish.ratings?.filter(r => r.rating === 1 || r.rating === "1").length || 0
  const dishCategories = getDishCategories(dish)
  const hasIngredients = dish.ingredients && dish.ingredients.length > 0

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Чернетка', color: 'bg-gray-100 text-gray-800', icon: Clock },
      pending: { label: 'На розгляді', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { label: 'Схвалено', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'Відхилено', color: 'bg-red-100 text-red-800', icon: XCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(dish.id)
    }
  }

  const handleSubmitForReview = () => {
    if (onSubmitForReview) {
      onSubmitForReview(dish.id)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden group">
      {/* Image */}
      <div 
        className="aspect-video bg-gray-200 overflow-hidden relative"
        onClick={onViewDetails}
      >
        {dish.main_image_url ? (
          <img
            src={dish.main_image_url}
            alt={dish.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          {getStatusBadge(dish.status)}
        </div>
        
        {/* Nutrition Badge */}
        {hasIngredients && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Аналіз калорій
            </span>
          </div>
        )}
        
        {/* Rejection Reason */}
        {dish.status === 'rejected' && dish.rejection_reason && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-red-100 border border-red-200 rounded-lg p-2 text-xs text-red-800">
              <div className="flex items-start">
                <AlertTriangle className="w-3 h-3 text-red-600 mr-1 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Причина відхилення:</p>
                  <p className="line-clamp-2">{dish.rejection_reason}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">
            {dish.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">
            {dish.description}
          </p>
        </div>

        {/* Categories */}
        {dishCategories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {dishCategories.slice(0, 2).map((cat, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
              >
                <Grid3X3 className="w-3 h-3 mr-1" />
                {cat.dish_categories?.name || cat.name}
              </span>
            ))}
            {dishCategories.length > 2 && (
              <span className="text-xs text-gray-500">
                +{dishCategories.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {dish.servings}
            </div>
            {cookingTime && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {cookingTime}хв
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <Heart className="w-4 h-4 mr-1" />
              {likesCount}
            </div>
            <div className="flex items-center">
              <MessageCircle className="w-4 h-4 mr-1" />
              {dish.comments_count || 0}
            </div>
          </div>
        </div>

        {/* Author */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar
              src={dish.profiles?.avatar_url}
              name={dish.profiles?.full_name || dish.profiles?.email}
              size="sm"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {dish.profiles?.full_name || 'Невідомий автор'}
              </p>
              <p className="text-xs text-gray-500">
                {formatRelativeTime(dish.created_at)}
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          {showActions && (
            <div className="flex space-x-2">
              <Link href={`/dishes/${dish.id}`}>
                <Button 
                  variant="outline" 
                  size="sm"
                  leftIcon={<Eye className="w-4 h-4" />}
                >
                  Переглянути
                </Button>
              </Link>
              
              {isOwner && (
                <Link href={`/dishes/${dish.id}/edit`}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    leftIcon={<Edit className="w-4 h-4" />}
                  >
                    Редагувати
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
        
        {/* Owner-specific Actions */}
        {isOwner && showActions && (
          <div className="mt-3 space-y-2">
            {dish.status === 'draft' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitForReview}
                disabled={isSubmitting}
                leftIcon={isSubmitting ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
                className="w-full"
              >
                {isSubmitting ? 'Відправка...' : 'Відправити на модерацію'}
              </Button>
            )}
            
            {dish.status === 'rejected' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitForReview}
                disabled={isSubmitting}
                leftIcon={isSubmitting ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
                className="w-full"
              >
                {isSubmitting ? 'Відправка...' : 'Відправити повторно'}
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              leftIcon={isDeleting ? <LoadingSpinner size="sm" /> : <Trash2 className="w-4 h-4" />}
              className="w-full text-red-600 border-red-300 hover:bg-red-50"
            >
              {isDeleting ? 'Видалення...' : 'Видалити'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}