import { Dish } from '@/types/dish'

interface IngredientsListProps {
  ingredients: Dish['ingredients']
  className?: string
}

export function IngredientsList({ ingredients, className = '' }: IngredientsListProps) {
  if (!ingredients || ingredients.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <h4 className="font-medium text-gray-900 mb-3">Інгредієнти</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-900 font-medium">{ingredient.name}</span>
            <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
              {ingredient.amount} {ingredient.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}