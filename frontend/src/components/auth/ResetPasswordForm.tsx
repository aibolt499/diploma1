import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Пароль повинен містити принаймні 6 символів'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Паролі не співпадають",
  path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

interface ResetPasswordFormProps {
  token: string
  redirectTo?: string
}

export function ResetPasswordForm({ token, redirectTo = '/auth/login' }: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { resetPassword, isResettingPassword } = useAuth()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    console.log('Submitting reset password form with token length:', token.length)
    const result = await resetPassword(token, data.password)
    
    if (result.success) {
      router.push(redirectTo)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        {...register('password')}
        type={showPassword ? 'text' : 'password'}
        label="Новий пароль"
        placeholder="Введіть новий пароль"
        error={errors.password?.message}
        leftIcon={<Lock className="w-4 h-4" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        }
        autoComplete="new-password"
      />

      <Input
        {...register('confirmPassword')}
        type={showConfirmPassword ? 'text' : 'password'}
        label="Підтвердіть новий пароль"
        placeholder="Підтвердіть новий пароль"
        error={errors.confirmPassword?.message}
        leftIcon={<Lock className="w-4 h-4" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        }
        autoComplete="new-password"
      />

      <Button
        type="submit"
        className="w-full"
        isLoading={isResettingPassword}
        disabled={isResettingPassword}
      >
        Скинути пароль
      </Button>
    </form>
  )
}