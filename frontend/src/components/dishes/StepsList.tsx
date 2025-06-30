import { Dish } from '@/types/dish'
import { Clock } from 'lucide-react'

interface StepsListProps {
  steps: Dish['steps']
  className?: string
}

export function StepsList({ steps, className = '' }: StepsListProps) {
  if (!steps || steps.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <h4 className="font-medium text-gray-900 mb-3">Кроки приготування</h4>
      <div className="space-y-6">
        {steps.map((step, index) => (
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
  )
}