'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Settings, Menu, X, Shield, ChefHat, BookOpen, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { apiClient } from '@/lib/api'

const navigation = [
  { name: 'Профіль', href: '/profile', icon: User },
  { name: 'Страви', href: '/dishes', icon: ChefHat },
  { name: 'AI-шеф', href: '/ai-chef', icon: Sparkles },
  { name: 'Колекції', href: '/collections', icon: BookOpen },
]

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const pathname = usePathname()
  const { user, isAuthenticated, verifyToken } = useAuthStore()

  // Fetch user profile to get avatar
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isAuthenticated || !user) {
        setUserProfile(null)
        return
      }

      try {
        const response = await apiClient.get('/users/profile')
        if (response.success && response.profile) {
          setUserProfile(response.profile)
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
      }
    }

    fetchUserProfile()
  }, [user, isAuthenticated])

  // Check if user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!isAuthenticated || !user) {
        setIsAdmin(false)
        return
      }

      setIsCheckingAdmin(true)
      try {
        const response = await apiClient.get('/users/profile')
        if (response.success && response.profile) {
          setIsAdmin(response.profile.role === 'admin')
        }
      } catch (error) {
        console.error('Failed to check admin role:', error)
        
        // If it's an auth error, try to refresh token
        if (error instanceof Error && error.message.includes('увійдіть в систему')) {
          const refreshed = await verifyToken()
          if (refreshed) {
            // Retry after token refresh
            try {
              const response = await apiClient.get('/users/profile')
              if (response.success && response.profile) {
                setIsAdmin(response.profile.role === 'admin')
              }
            } catch (retryError) {
              console.error('Retry failed:', retryError)
              setIsAdmin(false)
            }
          } else {
            setIsAdmin(false)
          }
        } else {
          setIsAdmin(false)
        }
      } finally {
        setIsCheckingAdmin(false)
      }
    }

    checkAdminRole()
  }, [user, isAuthenticated, verifyToken])

  // Add admin navigation if user is admin
  const allNavigation = isAdmin 
    ? [...navigation, { name: 'Адміністрування', href: '/admin/users', icon: Shield }]
    : navigation

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Пошук Страв</span>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {allNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || 
                  (item.href === '/admin/users' && pathname.startsWith('/admin')) ||
                  (item.href === '/dishes' && pathname.startsWith('/dishes')) ||
                  (item.href === '/collections' && pathname.startsWith('/collections')) ||
                  (item.href === '/profile/dishes' && pathname === '/profile/dishes') ||
                  (item.href === '/ai-chef' && pathname === '/ai-chef')
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors',
                      isActive
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                    {item.name === 'Адміністрування' && isCheckingAdmin && (
                      <span className="ml-2 text-xs text-gray-400">...</span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden md:flex items-center space-x-3">
                <Avatar
                  src={userProfile?.avatar_url}
                  name={userProfile?.full_name || user.fullName || user.email}
                  size="sm"
                />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {userProfile?.full_name || user.fullName || 'Користувач'}
                  </p>
                  <p className="text-gray-500">{user.email}</p>
                </div>
              </div>
            )}

            <LogoutButton
              variant="outline"
              size="sm"
              className="hidden md:flex"
            />

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded="false"
            >
              <span className="sr-only">Відкрити головне меню</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {allNavigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (item.href === '/admin/users' && pathname.startsWith('/admin')) ||
                (item.href === '/dishes' && pathname.startsWith('/dishes')) ||
                (item.href === '/collections' && pathname.startsWith('/collections')) ||
                (item.href === '/profile/dishes' && pathname === '/profile/dishes') ||
                (item.href === '/ai-chef' && pathname === '/ai-chef')
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'block pl-3 pr-4 py-2 text-base font-medium border-l-4 transition-colors',
                    isActive
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <Icon className="w-4 h-4 mr-3" />
                    {item.name}
                  </div>
                </Link>
              )
            })}
          </div>
          
          {user && (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <Avatar
                  src={userProfile?.avatar_url}
                  name={userProfile?.full_name || user.fullName || user.email}
                  size="md"
                />
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {userProfile?.full_name || user.fullName || 'Користувач'}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {user.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <LogoutButton
                  variant="ghost"
                  size="sm"
                  className="w-full text-left justify-start px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}