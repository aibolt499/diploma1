import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime } from '@/lib/utils'
import { User } from 'lucide-react'

interface DishAuthorCardProps {
  author: {
    full_name?: string
    email?: string
    profile_tag?: string
    avatar_url?: string
  }
  createdAt: string
  className?: string
}

export function DishAuthorCard({ author, createdAt, className = '' }: DishAuthorCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="w-5 h-5 mr-2" />
          Автор
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-3">
          <Avatar
            src={author.avatar_url}
            name={author.full_name || author.email}
            size="md"
          />
          <div>
            <p className="font-medium text-gray-900">
              {author.full_name || 'Невідомий автор'}
            </p>
            <p className="text-sm text-gray-500">
              @{author.profile_tag || 'user'}
            </p>
            <p className="text-xs text-gray-400">
              Опубліковано {formatRelativeTime(createdAt)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}