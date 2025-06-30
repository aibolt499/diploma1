'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { apiClient } from '@/lib/api'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { Dish } from '@/types/dish'
import { DishList } from '@/components/dishes/DishList'
import { DishFilters } from '@/components/dishes/DishFilters'
import { DishHeader } from '@/components/dishes/DishHeader'
import { 
  ChefHat, 
  Search, 
  Plus, 
  Clock,
  Users,
  Heart,
  MessageCircle,
  Filter,
  Grid3X3,
  Eye,
  X,
  LogIn,
  UserPlus,
  Image as ImageIcon,
  Activity,
  Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  description?: string
}

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

interface DishDetailsModalProps {
  dish: Dish | null
  isOpen: boolean
  onClose: () => void
}

function DishDetailsModal({ dish, isOpen, onClose }: DishDetailsModalProps) {
  const { isAuthenticated } = useAuthStore()
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null)
  const [isAnalyzingNutrition, setIsAnalyzingNutrition] = useState(false)

  if (!isOpen || !dish) return null

  const likesCount = dish.ratings?.filter(r => r.rating === 1 || r.rating === "1").length || 0
  const totalCookingTime = dish.steps?.reduce((total, step) => total + (step.duration_minutes || 0), 0) || 0

  const handleAuthAction = (action: string) => {
    toast.error(`Щоб ${action}, потрібно зареєструватися або увійти в систему`, {
      duration: 5000,
    })
  }

  const analyzeNutrition = async () => {
    if (!dish.ingredients || dish.ingredients.length === 0) {
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
      } else {
        toast.error('Не вдалося розрахувати поживну цінність')
      }
    } catch (error) {
      console.error('Nutrition analysis error:', error)
      toast.error('Помилка аналізу поживності')
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

  const dishCategories = getDishCategories(dish)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          {/* Header Image */}
          {dish.main_image_url && (
            <div className="h-64 bg-gray-200 overflow-hidden rounded-t-xl">
              <img
                src={dish.main_image_url}
                alt={dish.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Dish Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{dish.title}</h2>
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
              <div className="flex items-center">
                <Heart className="w-4 h-4 mr-1" />
                {likesCount} лайків
              </div>
              <div className="flex items-center">
                <MessageCircle className="w-4 h-4 mr-1" />
                {dish.comments_count || 0} коментарів
              </div>
            </div>
          </div>

          {/* Categories */}
          {dishCategories.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Категорії</h4>
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
            </div>
          )}

          {/* Author */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <Avatar
              src={dish.profiles?.avatar_url}
              name={dish.profiles?.full_name || dish.profiles?.email}
              size="md"
            />
            <div>
              <p className="font-medium text-gray-900">
                {dish.profiles?.full_name || 'Невідомий автор'}
              </p>
              <p className="text-sm text-gray-500">
                @{dish.profiles?.profile_tag || 'user'}
              </p>
              <p className="text-xs text-gray-400">
                Опубліковано {formatRelativeTime(dish.created_at)}
              </p>
            </div>
          </div>

          {/* Nutrition Analysis */}
          {dish.ingredients && dish.ingredients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Поживна цінність
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={analyzeNutrition}
                    disabled={isAnalyzingNutrition}
                    leftIcon={isAnalyzingNutrition ? <LoadingSpinner size="sm" /> : <Zap className="w-4 h-4" />}
                  >
                    {isAnalyzingNutrition ? 'Аналізуємо...' : 'Розрахувати'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {nutritionData ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-primary-900">
                        {nutritionData.caloriesPerServing}
                      </div>
                      <div className="text-xs text-primary-700">ккал/порція</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-green-900">
                        {nutritionData.macrosPerServing?.protein.quantity || nutritionData.macros.protein.quantity}
                      </div>
                      <div className="text-xs text-green-700">г білків</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-blue-900">
                        {nutritionData.macrosPerServing?.carbs.quantity || nutritionData.macros.carbs.quantity}
                      </div>
                      <div className="text-xs text-blue-700">г вуглеводів</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-yellow-900">
                        {nutritionData.macrosPerServing?.fat.quantity || nutritionData.macros.fat.quantity}
                      </div>
                      <div className="text-xs text-yellow-700">г жирів</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">
                      Натисніть "Розрахувати", щоб дізнатися калорійність та поживну цінність
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Ingredients */}
          {dish.ingredients && dish.ingredients.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Інгредієнти</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {dish.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900 font-medium">{ingredient.name}</span>
                    <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                      {ingredient.amount} {ingredient.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Steps */}
          {dish.steps && dish.steps.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Кроки приготування</h4>
              <div className="space-y-6">
                {dish.steps.map((step, index) => (
                  <div key={index} className="flex space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 mb-3">{step.description}</p>
                      
                      {/* Step Image */}
                      {step.image_url && (
                        <div className="mb-3">
                          <img
                            src={step.image_url}
                            alt={`Крок ${index + 1}`}
                            className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                      
                      {step.duration_minutes && step.duration_minutes > 0 && (
                        <p className="text-sm text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {step.duration_minutes} хвилин
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auth Required Message */}
          {!isAuthenticated && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <LogIn className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-medium text-blue-800 mb-1">
                    Приєднайтеся до нашої спільноти!
                  </h5>
                  <p className="text-sm text-blue-700 mb-3">
                    Щоб ставити лайки стравам та залишати коментарі, потрібно зареєструватися або увійти в систему.
                  </p>
                  <div className="flex space-x-3">
                    <Link href="/auth/login">
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<LogIn className="w-4 h-4" />}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        Увійти
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button
                        size="sm"
                        leftIcon={<UserPlus className="w-4 h-4" />}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Зареєструватися
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <Link href={`/dishes/${dish.id}`} className="flex-1">
              <Button
                variant="primary"
                className="w-full"
                leftIcon={<Eye className="w-4 h-4" />}
              >
                Переглянути повну сторінку
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredDishes, setFilteredDishes] = useState<Dish[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const fetchDishes = async () => {
    setIsLoading(true)
    try {
      let url = '/dishes'
      const params = new URLSearchParams()
      
      if (selectedCategory) {
        params.append('category_id', selectedCategory)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await apiClient.get(url)
      if (response.success && response.dishes) {
        setDishes(response.dishes)
        setFilteredDishes(response.dishes)
      }
    } catch (error) {
      console.error('Failed to fetch dishes:', error)
      toast.error(error instanceof Error ? error.message : 'Не вдалося завантажити страви')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories =  async () => {
    try {
      const response = await apiClient.get('/categories')
      if (response.success && response.categories) {
        setCategories(response.categories)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleViewDish = async (dishId: string) => {
    try {
      const response = await apiClient.get(`/dishes/${dishId}`)
      if (response.success && response.dish) {
        setSelectedDish(response.dish)
        setShowDetailsModal(true)
      }
    } catch (error) {
      console.error('Failed to fetch dish details:', error)
      toast.error('Не вдалося завантажити деталі страви')
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchDishes()
  }, [selectedCategory])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = dishes.filter(dish =>
        dish.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredDishes(filtered)
    } else {
      setFilteredDishes(dishes)
    }
  }, [searchQuery, dishes])

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center">
                <ChefHat className="w-8 h-8 mr-3" />
                Страви
              </h1>
              <p className="text-primary-100 mt-1">
                Відкрийте для себе дивовижні страви з аналізом калорій від нашої спільноти
              </p>
            </div>
            <Link href="/dishes/add">
              <Button 
                variant="secondary" 
                leftIcon={<Plus className="w-4 h-4" />}
                className="bg-white text-primary-600 hover:bg-primary-50"
              >
                Додати страву
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <ChefHat className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всього страв</p>
                <p className="text-2xl font-bold text-gray-900">{dishes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Опубліковано</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dishes.filter(d => d.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">На розгляді</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dishes.filter(d => d.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">З аналізом калорій</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dishes.filter(d => d.ingredients && d.ingredients.length > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Пошук страв за назвою або описом..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="md:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Всі категорії</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Active filters display */}
          {(searchQuery || selectedCategory) && (
            <div className="flex flex-wrap items-center gap-2 pt-4">
              <span className="text-sm text-gray-500">Активні фільтри:</span>
              {searchQuery && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Пошук: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Категорія: {categories.find(c => c.id === selectedCategory)?.name}
                  <button
                    onClick={() => setSelectedCategory('')}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dishes Grid */}
      <DishList
        dishes={filteredDishes}
        isLoading={isLoading}
        onViewDetails={handleViewDish}
        emptyTitle="Страви не знайдено"
        emptyDescription="Спробуйте змінити критерії пошуку або очистити фільтри"
        searchQuery={searchQuery}
        getTotalCookingTime={getTotalCookingTime}
        getDishCategories={getDishCategories}
      />

      {/* Dish Details Modal */}
      <DishDetailsModal
        dish={selectedDish}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedDish(null)
        }}
      />
    </div>
  )
}