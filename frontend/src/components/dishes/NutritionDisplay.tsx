import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Activity, Zap } from 'lucide-react'

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

interface NutritionDisplayProps {
  nutritionData: NutritionData | null
  isAnalyzing: boolean
  onAnalyze: () => void
  hasIngredients: boolean
}

export function NutritionDisplay({
  nutritionData,
  isAnalyzing,
  onAnalyze,
  hasIngredients
}: NutritionDisplayProps) {
  if (!hasIngredients) {
    return null
  }
  
  return (
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
            onClick={onAnalyze}
            disabled={isAnalyzing}
            leftIcon={isAnalyzing ? <LoadingSpinner size="sm" /> : <Zap className="w-4 h-4" />}
          >
            {isAnalyzing ? 'Аналізуємо...' : 'Розрахувати'}
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
  )
}