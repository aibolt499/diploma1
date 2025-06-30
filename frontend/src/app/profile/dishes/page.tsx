'use client'

import { DishHeader } from '@/components/dishes/DishHeader'
import { DishFilters } from '@/components/dishes/DishFilters'
import { DishList } from '@/components/dishes/DishList'
import { useUserDishes } from '@/hooks/useUserDishes'

export default function UserDishesPage() {
  const {
    filteredDishes,
    isLoading,
    searchQuery,
    statusFilter,
    isDeleting,
    isSubmitting,
    setSearchQuery,
    setStatusFilter,
    handleDeleteDish,
    handleSubmitForReview,
    getTotalCookingTime,
    getDishCategories
  } = useUserDishes()

  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <DishHeader 
        title="Мої страви"
        subtitle="Керуйте вашими стравами, редагуйте та публікуйте їх"
        backHref="/profile"
        backLabel="Назад до профілю"
        showAddButton={true}
        addButtonHref="/dishes/add"
        addButtonLabel="Додати нову страву"
      />

      {/* Filters */}
      <DishFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        showStatusFilter={true}
      />

      {/* Dishes List */}
      <DishList 
        dishes={filteredDishes}
        isLoading={isLoading}
        isOwner={true}
        isDeleting={isDeleting}
        isSubmitting={isSubmitting}
        onDelete={handleDeleteDish}
        onSubmitForReview={handleSubmitForReview}
        emptyTitle="Страви не знайдено"
        emptyDescription="Спробуйте змінити критерії пошуку або очистити фільтри"
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        getTotalCookingTime={getTotalCookingTime}
        getDishCategories={getDishCategories}
      />
    </div>
  )
}