import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import { Dish } from '@/types/dish'
import toast from 'react-hot-toast'

export function useUserDishes() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [filteredDishes, setFilteredDishes] = useState<Dish[]>([])
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null)

  const fetchUserDishes = useCallback(async () => {
    setIsLoading(true)
    try {
      // Use the endpoint for user's own dishes
      const response = await apiClient.get('/dishes/my-dishes')
      if (response.success && response.dishes) {
        setDishes(response.dishes)
        setFilteredDishes(response.dishes)
      }
    } catch (error) {
      console.error('Failed to fetch user dishes:', error)
      toast.error(error instanceof Error ? error.message : 'Не вдалося завантажити страви')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDeleteDish = async (dishId: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цю страву? Ця дія незворотна.')) {
      return false
    }

    setIsDeleting(dishId)
    try {
      const response = await apiClient.delete(`/dishes/${dishId}`)
      if (response.success) {
        toast.success('Страву успішно видалено')
        fetchUserDishes()
        return true
      } else {
        toast.error(response.error || 'Не вдалося видалити страву')
        return false
      }
    } catch (error) {
      console.error('Failed to delete dish:', error)
      toast.error(error instanceof Error ? error.message : 'Не вдалося видалити страву')
      return false
    } finally {
      setIsDeleting(null)
    }
  }

  const handleSubmitForReview = async (dishId: string) => {
    setIsSubmitting(dishId)
    try {
      const response = await apiClient.patch(`/dishes/${dishId}/status`, {
        action: 'submit_for_review'
      })
      
      if (response.success) {
        toast.success('Страву відправлено на модерацію')
        fetchUserDishes()
        return true
      } else {
        toast.error(response.error || 'Не вдалося відправити страву на модерацію')
        return false
      }
    } catch (error) {
      console.error('Failed to submit dish for review:', error)
      toast.error(error instanceof Error ? error.message : 'Не вдалося відправити страву на модерацію')
      return false
    } finally {
      setIsSubmitting(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Чернетка', color: 'bg-gray-100 text-gray-800', icon: 'Clock' },
      pending: { label: 'На розгляді', color: 'bg-yellow-100 text-yellow-800', icon: 'Clock' },
      approved: { label: 'Схвалено', color: 'bg-green-100 text-green-800', icon: 'CheckCircle' },
      rejected: { label: 'Відхилено', color: 'bg-red-100 text-red-800', icon: 'XCircle' }
    }

    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
  }

  const getTotalCookingTime = (dish: Dish) => {
    if (!dish.steps || !Array.isArray(dish.steps)) return null
    const total = dish.steps.reduce((sum, step) => sum + (step.duration_minutes || 0), 0)
    return total > 0 ? total : null
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

  // Apply filters when search query or status filter changes
  useEffect(() => {
    let filtered = dishes

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(dish =>
        dish.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(dish => dish.status === statusFilter)
    }

    setFilteredDishes(filtered)
  }, [searchQuery, statusFilter, dishes])

  // Fetch user dishes on mount
  useEffect(() => {
    fetchUserDishes()
  }, [fetchUserDishes])

  return {
    dishes,
    filteredDishes,
    isLoading,
    searchQuery,
    statusFilter,
    isDeleting,
    isSubmitting,
    setSearchQuery,
    setStatusFilter,
    fetchUserDishes,
    handleDeleteDish,
    handleSubmitForReview,
    getStatusBadge,
    getTotalCookingTime,
    getDishCategories
  }
}