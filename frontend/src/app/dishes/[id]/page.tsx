'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { CommentSection } from '@/components/dishes/CommentSection'
import { RatingSection } from '@/components/dishes/RatingSection'
import { AddToCollectionButton } from '@/components/dishes/AddToCollectionButton'
import { NutritionDisplay } from '@/components/dishes/NutritionDisplay'
import { IngredientsList } from '@/components/dishes/IngredientsList'
import { StepsList } from '@/components/dishes/StepsList'
import { DishAuthorCard } from '@/components/dishes/DishAuthorCard'
import { useDishDetails } from '@/hooks/useDishDetails'
import { useAuthStore } from '@/store/authStore'
import { 
  ChefHat, 
  Clock,
  Users,
  Heart,
  MessageCircle,
  Grid3X3,
  ArrowLeft,
  Share2,
  BookOpen
} from 'lucide-react'
import Link from 'next/link'

export default function DishDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const { isAuthenticated } = useAuthStore()
  
  const {
    dish,
    isLoading,
    error,
    nutritionData,
    isAnalyzingNutrition,
    analyzeNutrition,
    getDishCategories,
    getTotalCookingTime,
    getLikesCount
  } = useDishDetails(id)

  const handleShare = async () => {
    if (!dish) return
    
    const shareData = {
      title: dish.title || 'Страва',
      text: dish.description || 'Перегляньте цю страву',
      url: window.location.href
    }

    // Check if Web Share API is supported and can share this data
    if (navigator.share) {
      // Check if navigator.canShare is available and if the data can be shared
      if (navigator.canShare && !navigator.canShare(shareData)) {
        // If canShare returns false, fall back to clipboard
        fallbackToClipboard()
        return
      }

      try {
        await navigator.share(shareData)
      } catch (error) {
        // If sharing fails (permission denied, user cancelled, etc.), fall back to clipboard
        fallbackToClipboard()
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      fallbackToClipboard()
    }
  }

  const fallbackToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success('Посилання скопійовано в буфер обміну'))
      .catch(() => toast.error('Не вдалося скопіювати посилання'))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Завантаження страви...</p>
        </div>
      </div>
    )
  }

  if (error || !dish) {
    return (
      <div className="text-center py-12">
        <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Страву не знайдено</h2>
        <p className="text-gray-600 mb-6">
          Страва, яку ви шукаєте, не існує або була видалена
        </p>
        <Link href="/dishes">
          <Button leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Повернутися до списку страв
          </Button>
        </Link>
      </div>
    )
  }

  const totalCookingTime = getTotalCookingTime(dish)
  const likesCount = getLikesCount(dish)
  const dishCategories = getDishCategories(dish)
  const hasIngredients = dish.ingredients && dish.ingredients.length > 0

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/dishes">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Повернутися до списку страв
          </Button>
        </Link>
      </div>

      {/* Dish Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        {/* Header Image */}
        {dish.main_image_url && (
          <div className="h-64 bg-gray-200 overflow-hidden">
            <img
              src={dish.main_image_url}
              alt={dish.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{dish.title}</h1>
          <p className="text-gray-600 mb-4">{dish.description}</p>
          
          {/* Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {dish.servings} порцій
            </div>
            {totalCookingTime > 0 && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {totalCookingTime} хв
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Categories */}
          {dishCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Grid3X3 className="w-5 h-5 mr-2" />
                  Категорії
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dishCategories.map((cat, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      <Grid3X3 className="w-3 h-3 mr-1" />
                      {cat.dish_categories?.name || cat.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nutrition Analysis */}
          <NutritionDisplay
            nutritionData={nutritionData}
            isAnalyzing={isAnalyzingNutrition}
            onAnalyze={analyzeNutrition}
            hasIngredients={hasIngredients}
          />

          {/* Ingredients */}
          {hasIngredients && (
            <Card>
              <CardHeader>
                <CardTitle>Інгредієнти</CardTitle>
              </CardHeader>
              <CardContent>
                <IngredientsList ingredients={dish.ingredients} />
              </CardContent>
            </Card>
          )}

          {/* Steps */}
          {dish.steps && dish.steps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Кроки приготування</CardTitle>
              </CardHeader>
              <CardContent>
                <StepsList steps={dish.steps} />
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          <Card>
            <CardContent>
              <CommentSection dishId={id} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Author */}
          <DishAuthorCard 
            author={dish.profiles || {}}
            createdAt={dish.created_at}
          />

          {/* Rating Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                Рейтинг
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RatingSection dishId={id} />
            </CardContent>
          </Card>

          {/* Collection Section */}
          {isAuthenticated && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Колекції
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AddToCollectionButton dishId={id} />
              </CardContent>
            </Card>
          )}

          {/* Share Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Share2 className="w-5 h-5 mr-2" />
                Поділитися
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                leftIcon={<Share2 className="w-4 h-4" />}
                onClick={handleShare}
              >
                Поділитися стравою
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}