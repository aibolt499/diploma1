import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import { Dish } from '@/types/dish'
import toast from 'react-hot-toast'

interface NutritionData {
  calories: number
  caloriesPerServing: number
  macros: {
    protein: { quantity: number; unit: string }
    fat: { quantity: number; unit: string }
    carbs: { quantity: number; unit: string }
  }
  macrosPerServing?: {
    protein: { quantity: number; unit: string }
    fat: { quantity: number; unit: string }
    carbs: { quantity: number; unit: string }
  }
}

export function useDishDetails(dishId: string) {
  const [dish, setDish] = useState<Dish | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null)
  const [isAnalyzingNutrition, setIsAnalyzingNutrition] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDish = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get(`/dishes/${dishId}`)
      if (response.success && response.dish) {
        setDish(response.dish)
      } else {
        setError('Страву не знайдено')
        toast.error('Страву не знайдено')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Не вдалося завантажити страву'
      
      // Use console.warn for expected "not found" scenarios instead of console.error
      if (isNotFoundError(errorMessage)) {
        console.warn('Failed to fetch dish:', errorMessage)
      } else {
        console.error('Failed to fetch dish:', error)
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [dishId])

  const isNotFoundError = (errorMessage: string): boolean => {
    const notFoundIndicators = [
      'not found',
      'unable to fetch dish',
      'страву не знайдено',
      'dish not found'
    ]
    
    return notFoundIndicators.some(indicator => 
      errorMessage.toLowerCase().includes(indicator.toLowerCase())
    )
  }

  const analyzeNutrition = async () => {
    if (!dish?.ingredients || dish.ingredients.length === 0) {
      toast.error('Немає інгредієнтів для аналізу')
      return
    }

    setIsAnalyzingNutrition(true)
    try {
      const response = await apiClient.post('/edamam/analyze-nutrition', {
        ingredients: dish.ingredients,
        servings: dish.servings
      })

      if (response.success && response.nutrition) {
        setNutritionData(response.nutrition)
        toast.success('Поживну цінність розраховано!')
        return response.nutrition
      } else {
        toast.error(response.message || 'Не вдалося розрахувати поживну цінність')
        return null
      }
    } catch (error) {
      console.error('Nutrition analysis error:', error)
      
      // Handle rate limit errors specifically
      if (error instanceof Error && error.message.includes('rate limit exceeded')) {
        toast.error('Перевищено ліміт запитів до API. Будь ласка, спробуйте пізніше.')
      } else {
        toast.error('Помилка аналізу поживності')
      }
      
      return null
    } finally {
      setIsAnalyzingNutrition(false)
    }
  }

  const getDishCategories = (dish: Dish) => {
    if (!dish.categories || !Array.isArray(dish.categories)) return []
    
    return dish.categories
      .map(categoryRelation => {
        if (categoryRelation && typeof categoryRelation === 'object') {
          if (categoryRelation.dish_categories && categoryRelation.dish_categories.name) {
            return categoryRelation.dish_categories
          }
          if (categoryRelation.name) {
            return categoryRelation
          }
        }
        return null
      })
      .filter(Boolean)
  }

  const getTotalCookingTime = (dish: Dish): number => {
    return dish.steps?.reduce((total, step) => total + (step.duration_minutes || 0), 0) || 0
  }

  const getLikesCount = (dish: Dish): number => {
    return dish.ratings?.filter(r => r.rating === 1 || r.rating === "1").length || 0
  }

  useEffect(() => {
    if (dishId) {
      fetchDish()
    }
  }, [dishId, fetchDish])

  return {
    dish,
    isLoading,
    error,
    nutritionData,
    isAnalyzingNutrition,
    analyzeNutrition,
    getDishCategories,
    getTotalCookingTime,
    getLikesCount,
    fetchDish
  }
}