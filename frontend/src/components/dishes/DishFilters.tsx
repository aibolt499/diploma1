import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Search } from 'lucide-react'

interface DishFiltersProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  statusFilter?: string
  setStatusFilter?: (status: string) => void
  showStatusFilter?: boolean
}

export function DishFilters({ 
  searchQuery, 
  setSearchQuery, 
  statusFilter = '', 
  setStatusFilter,
  showStatusFilter = false
}: DishFiltersProps) {
  return (
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
          
          {showStatusFilter && setStatusFilter && (
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Всі статуси</option>
                <option value="draft">Чернетки</option>
                <option value="pending">На розгляді</option>
                <option value="approved">Схвалено</option>
                <option value="rejected">Відхилено</option>
              </select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}