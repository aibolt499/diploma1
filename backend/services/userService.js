export class UserService {
    constructor(supabase, logger, emailService = null) {
        this.supabase = supabase
        this.logger = logger
        this.emailService = emailService
        
        this.USER_ROLES = {
            USER: 'user',
            ADMIN: 'admin'
        }
        
        this.ERRORS = {
            PROFILE_NOT_FOUND: 'Profile not found',
            TAG_EXISTS: 'Profile tag already exists',
            INVALID_FILE_TYPE: 'Invalid file type',
            FILE_TOO_LARGE: 'File too large',
            INVALID_ROLE: 'Invalid role',
            INTERNAL_ERROR: 'Internal server error',
            UPLOAD_FAILED: 'Upload failed'
        }
        
        this.ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        this.MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    }

    _handleSuccess(data, message = null) {
        return {
            success: true,
            ...(message && { message }),
            ...data
        }
    }

    _handleError(error, defaultMessage, logContext = {}) {
        this.logger.error(defaultMessage, { error: error.message, ...logContext })
        return {
            success: false,
            error: defaultMessage,
            message: error.message || 'Unable to process request'
        }
    }

    _validateUserId(userId) {
        if (!userId || typeof userId !== 'string') {
            throw new Error('Valid user ID is required')
        }
    }

    _validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email || !emailRegex.test(email)) {
            throw new Error('Valid email is required')
        }
    }

    _validateRole(role) {
        if (!Object.values(this.USER_ROLES).includes(role)) {
            throw new Error(`Role must be one of: ${Object.values(this.USER_ROLES).join(', ')}`)
        }
    }

    _validateImageFile(fileBuffer, mimetype) {
        if (!this.ALLOWED_IMAGE_TYPES.includes(mimetype)) {
            throw new Error('Only JPG, PNG and WebP images are allowed')
        }
        
        if (fileBuffer.length > this.MAX_FILE_SIZE) {
            throw new Error('Image size must be less than 5MB')
        }
    }

    async _checkProfileTagExists(profileTag, excludeUserId = null) {
        let query = this.supabase
            .from('profiles')
            .select('id')
            .eq('profile_tag', profileTag)
            
        if (excludeUserId) {
            query = query.neq('id', excludeUserId)
        }
        
        const { data } = await query.maybeSingle()
        return !!data
    }

    async getProfile(userId) {
        try {
            this._validateUserId(userId)
            
            const { data: profile, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                if (error.code === 'PGRST116') {
                    return this._handleError(new Error('Profile not found'), this.ERRORS.PROFILE_NOT_FOUND, { userId })
                }
                return this._handleError(error, 'Unable to fetch profile', { userId })
            }

            return this._handleSuccess({ profile })
            
        } catch (error) {
            return this._handleError(error, this.ERRORS.INTERNAL_ERROR, { userId })
        }
    }

    async updateProfile(userId, email, profileData) {
        try {
            this._validateUserId(userId)
            this._validateEmail(email)
            
            const { full_name, profile_tag, avatar_url } = profileData

            if (profile_tag) {
                const tagExists = await this._checkProfileTagExists(profile_tag, userId)
                if (tagExists) {
                    return this._handleError(
                        new Error('Цей тег профілю вже зайнятий іншим користувачем'),
                        this.ERRORS.TAG_EXISTS
                    )
                }
            }

            const { data, error } = await this.supabase
                .from('profiles')
                .update({
                    email,
                    full_name,
                    profile_tag,
                    avatar_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single()

            if (error) {
                return this._handleError(error, 'Unable to update profile', { userId })
            }

            this.logger.info('Profile updated successfully', { userId })
            return this._handleSuccess({ profile: data }, 'Profile updated successfully')
            
        } catch (error) {
            return this._handleError(error, this.ERRORS.INTERNAL_ERROR, { userId })
        }
    }

    async getUserByTag(profileTag) {
        try {
            if (!profileTag) {
                throw new Error('Profile tag is required')
            }
            
            const { data: profile, error } = await this.supabase
                .from('profiles')
                .select('id, email, full_name, profile_tag, avatar_url, created_at')
                .eq('profile_tag', profileTag)
                .single()

            if (error) {
                if (error.code === 'PGRST116') {
                    return this._handleError(
                        new Error('No user found with this profile tag'),
                        'User not found',
                        { profileTag }
                    )
                }
                return this._handleError(error, 'Unable to search user', { profileTag })
            }

            return this._handleSuccess({ profile })
            
        } catch (error) {
            return this._handleError(error, this.ERRORS.INTERNAL_ERROR, { profileTag })
        }
    }

    async getPublicProfile(userId) {
        try {
            this._validateUserId(userId)
            
            const { data: profile, error } = await this.supabase
                .from('profiles')
                .select('id, full_name, avatar_url, created_at')
                .eq('id', userId)
                .single()

            if (error) {
                if (error.code === 'PGRST116') {
                    return this._handleError(
                        new Error('The requested user profile does not exist'),
                        'User not found',
                        { userId }
                    )
                }
                return this._handleError(error, 'Unable to fetch profile', { userId })
            }

            return this._handleSuccess({ profile })
            
        } catch (error) {
            return this._handleError(error, this.ERRORS.INTERNAL_ERROR, { userId })
        }
    }

    async getUserStats(user) {
        try {
            if (!user || !user.id) {
                throw new Error('Valid user object is required')
            }
            
            // Get count of dishes created by user
            const { count: recipesCreated, error: dishesError } = await this.supabase
                .from('dishes')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
            
            if (dishesError) {
                this.logger.error('Error fetching user dishes count', { error: dishesError.message, userId: user.id })
            }
            
            // Get count of likes given by user
            const { count: likesGiven, error: likesError } = await this.supabase
                .from('dish_ratings')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('rating', 1)
            
            if (likesError) {
                this.logger.error('Error fetching user likes count', { error: likesError.message, userId: user.id })
            }
            
            // Get count of favorite recipes (from collections)
            const { count: favoriteRecipes, error: favoritesError } = await this.supabase
                .from('dish_collection_items')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
            
            if (favoritesError) {
                this.logger.error('Error fetching user favorites count', { error: favoritesError.message, userId: user.id })
            }
            
            const stats = {
                recipesCreated: recipesCreated || 0,
                likesGiven: likesGiven || 0,
                favoriteRecipes: favoriteRecipes || 0,
                lastLogin: user.lastSignIn || 'Unknown',
                emailConfirmed: user.emailConfirmed
            }

            return this._handleSuccess({ stats })
            
        } catch (error) {
            return this._handleError(error, this.ERRORS.INTERNAL_ERROR, { userId: user?.id })
        }
    }

    async changePassword(email, currentPassword, newPassword) {
        try {
            this._validateEmail(email)
            
            if (!currentPassword || !newPassword) {
                throw new Error('Current password and new password are required')
            }
            
            if (newPassword.length < 6) {
                throw new Error('New password must be at least 6 characters long')
            }

            const { error: signInError } = await this.supabase.auth.signInWithPassword({
                email,
                password: currentPassword
            })

            if (signInError) {
                return this._handleError(
                    new Error('Please verify your current password'),
                    'Current password is incorrect'
                )
            }

            const { error: updateError } = await this.supabase.auth.updateUser({
                password: newPassword
            })

            if (updateError) {
                return this._handleError(updateError, 'Unable to update password', { email })
            }

            if (this.emailService) {
                try {
                    const { data: profile } = await this.supabase
                        .from('profiles')
                        .select('full_name')
                        .eq('email', email)
                        .single()

                    await this.emailService.sendPasswordChangeNotification(
                        email, 
                        profile?.full_name
                    )
                } catch (emailError) {
                    this.logger.warn('Failed to send password change notification', { 
                        error: emailError.message, 
                        email 
                    })
                }
            }

            this.logger.info('Password updated successfully', { email })
            return this._handleSuccess({}, 'Password updated successfully')
            
        } catch (error) {
            return this._handleError(error, this.ERRORS.INTERNAL_ERROR, { email })
        }
    }

    async uploadAvatar(userId, fileBuffer, mimetype, filename) {
        try {
            this._validateUserId(userId)
            this._validateImageFile(fileBuffer, mimetype)

            this.logger.info('Starting avatar upload to Supabase Storage', { 
                userId, 
                filename,
                fileSize: fileBuffer.length,
                mimetype
            })

            // Generate unique filename with user ID prefix for RLS
            const fileExtension = mimetype.split('/')[1]
            const uniqueFilename = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`

            // Use supabaseAdmin to bypass RLS
            const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from('avatars')
                .upload(uniqueFilename, fileBuffer, {
                    contentType: mimetype,
                    upsert: false
                })

            if (uploadError) {
                this.logger.error('Supabase avatar upload failed', { 
                    error: uploadError.message, 
                    code: uploadError.statusCode,
                    details: uploadError.details,
                    hint: uploadError.hint,
                    userId, 
                    filename: uniqueFilename 
                })
                return this._handleError(uploadError, 'Failed to upload avatar to Supabase Storage')
            }

            this.logger.info('Avatar uploaded to Supabase storage successfully', { 
                userId, 
                filename: uniqueFilename,
                path: uploadData.path 
            })

            // Get public URL
            const { data: urlData } = this.supabase.storage
                .from('avatars')
                .getPublicUrl(uniqueFilename)

            if (!urlData.publicUrl) {
                this.logger.error('Failed to get public URL from Supabase', { 
                    userId,
                    filename: uniqueFilename
                })
                return this._handleError(
                    new Error('Failed to get public URL'),
                    'Failed to get avatar URL'
                )
            }

            this.logger.info('Got public URL for avatar from Supabase', { 
                userId, 
                publicUrl: urlData.publicUrl 
            })

            // Update user profile with new avatar URL
            const { data: profile, error: updateError } = await this.supabase
                .from('profiles')
                .update({
                    avatar_url: urlData.publicUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single()

            if (updateError) {
                this.logger.error('Failed to update profile with avatar URL', { 
                    error: updateError.message, 
                    userId,
                    publicUrl: urlData.publicUrl 
                })
                
                // Try to clean up uploaded file
                await this.supabase.storage
                    .from('avatars')
                    .remove([uniqueFilename])
                    .catch(() => {}) // Ignore cleanup errors

                return this._handleError(updateError, 'Failed to update profile with avatar')
            }

            this.logger.info('Avatar uploaded successfully', { 
                userId, 
                filename: uniqueFilename,
                publicUrl: urlData.publicUrl 
            })

            return this._handleSuccess({
                avatarUrl: urlData.publicUrl,
                profile: profile
            }, 'Avatar uploaded successfully')
            
        } catch (error) {
            this.logger.error('Avatar upload error', { 
                error: error.message, 
                userId,
                stack: error.stack 
            })
            return this._handleError(error, 'Failed to upload avatar', { userId })
        }
    }

    // Admin methods
    async getAllUsers(page = 1, limit = 10, search = '') {
        try {
            const pageNum = Math.max(1, parseInt(page))
            const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
            const offset = (pageNum - 1) * limitNum
            
            let query = this.supabase
                .from('profiles')
                .select('*', { count: 'exact' })
                .range(offset, offset + limitNum - 1)
                .order('created_at', { ascending: false })

            if (search?.trim()) {
                const searchTerm = search.trim()
                query = query.or(`full_name.ilike.%${searchTerm}%,profile_tag.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
            }

            const { data: users, error, count } = await query

            if (error) {
                return this._handleError(error, 'Unable to fetch users')
            }

            return this._handleSuccess({
                users,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: count,
                    totalPages: Math.ceil(count / limitNum)
                }
            })
            
        } catch (error) {
            return this._handleError(error, this.ERRORS.INTERNAL_ERROR)
        }
    }

    async getUserDetailsForAdmin(userId) {
        try {
            this._validateUserId(userId)
            
            const { data: user, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                if (error.code === 'PGRST116') {
                    return this._handleError(new Error('User not found'), 'User not found', { userId })
                }
                return this._handleError(error, 'Unable to fetch user details', { userId })
            }

            return this._handleSuccess({ user })
            
        } catch (error) {
            return this._handleError(error, this.ERRORS.INTERNAL_ERROR, { userId })
        }
    }

    async updateUserRole(userId, role) {
        try {
            this._validateUserId(userId)
            this._validateRole(role)

            const { data: existingUser, error: checkError } = await this.supabase
                .from('profiles')
                .select('id, role')
                .eq('id', userId)
                .maybeSingle()

            if (checkError) {
                return this._handleError(checkError, 'Unable to check user', { userId })
            }

            if (!existingUser) {
                return this._handleError(
                    new Error('No user found with the provided ID'),
                    'User not found'
                )
            }

            const { data, error } = await this.supabase
                .from('profiles')
                .update({ role, updated_at: new Date().toISOString() })
                .eq('id', userId)
                .select()
                .single()

            if (error) {
                return this._handleError(error, 'Unable to update user role', { userId, role })
            }

            this.logger.info('User role updated successfully', { userId, role })
            return this._handleSuccess({ user: data }, 'User role updated successfully')
            
        } catch (error) {
            return this._handleError(error, this.ERRORS.INTERNAL_ERROR, { userId, role })
        }
    }

    async deleteUserByAdmin(userId, supabaseAdmin) {
        try {
            this._validateUserId(userId)
            
            const { data: existingUser, error: checkError } = await this.supabase
                .from('profiles')
                .select('id, email')
                .eq('id', userId)
                .single()
    
            if (checkError || !existingUser) {
                return this._handleError(
                    new Error('User not found'),
                    'User not found',
                    { userId }
                )
            }
    
            // Видаляємо всі пов'язані дані в правильному порядку
            // 1. Видаляємо коментарі користувача
            const { error: commentsError } = await this.supabase
                .from('comments')
                .delete()
                .eq('user_id', userId)
    
            if (commentsError) {
                this.logger.warn('Failed to delete user comments', { 
                    error: commentsError.message, 
                    userId 
                })
            }
    
            // 2. Видаляємо рейтинги користувача
            const { error: ratingsError } = await this.supabase
                .from('ratings')
                .delete()
                .eq('user_id', userId)
    
            if (ratingsError) {
                this.logger.warn('Failed to delete user ratings', { 
                    error: ratingsError.message, 
                    userId 
                })
            }
    
            // 3. Видаляємо зв'язки колекцій з стравами
            const { error: collectionDishesError } = await this.supabase
                .from('collection_dishes')
                .delete()
                .in('collection_id', 
                    this.supabase
                        .from('collections')
                        .select('id')
                        .eq('user_id', userId)
                )
    
            if (collectionDishesError) {
                this.logger.warn('Failed to delete collection dishes', { 
                    error: collectionDishesError.message, 
                    userId 
                })
            }
    
            // 4. Видаляємо колекції користувача
            const { error: collectionsError } = await this.supabase
                .from('collections')
                .delete()
                .eq('user_id', userId)
    
            if (collectionsError) {
                this.logger.warn('Failed to delete user collections', { 
                    error: collectionsError.message, 
                    userId 
                })
            }
    
            // 5. Видаляємо зв'язки категорій зі стравами користувача
            const { error: dishCategoriesError } = await this.supabase
                .from('dish_categories')
                .delete()
                .in('dish_id', 
                    this.supabase
                        .from('dishes')
                        .select('id')
                        .eq('user_id', userId)
                )
    
            if (dishCategoriesError) {
                this.logger.warn('Failed to delete dish categories', { 
                    error: dishCategoriesError.message, 
                    userId 
                })
            }
    
            // 6. Видаляємо інгредієнти страв користувача
            const { error: dishIngredientsError } = await this.supabase
                .from('dish_ingredients')
                .delete()
                .in('dish_id', 
                    this.supabase
                        .from('dishes')
                        .select('id')
                        .eq('user_id', userId)
                )
    
            if (dishIngredientsError) {
                this.logger.warn('Failed to delete dish ingredients', { 
                    error: dishIngredientsError.message, 
                    userId 
                })
            }
    
            // 7. Видаляємо кроки страв користувача
            const { error: dishStepsError } = await this.supabase
                .from('dish_steps')
                .delete()
                .in('dish_id', 
                    this.supabase
                        .from('dishes')
                        .select('id')
                        .eq('user_id', userId)
                )
    
            if (dishStepsError) {
                this.logger.warn('Failed to delete dish steps', { 
                    error: dishStepsError.message, 
                    userId 
                })
            }
    
            // 8. Видаляємо страви користувача
            const { error: dishesError } = await this.supabase
                .from('dishes')
                .delete()
                .eq('user_id', userId)
    
            if (dishesError) {
                this.logger.warn('Failed to delete user dishes', { 
                    error: dishesError.message, 
                    userId 
                })
            }
    
            // 9. Видаляємо користувача з auth (якщо є supabaseAdmin)
            if (supabaseAdmin) {
                const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
                if (authError) {
                    this.logger.error('Failed to delete user from auth', { 
                        error: authError.message, 
                        userId,
                        userEmail: existingUser.email 
                    })
                    return this._handleError(authError, 'Unable to delete user account', { userId })
                }
            }
    
            // 10. Нарешті видаляємо профіль користувача
            const { error: profileError } = await this.supabase
                .from('profiles')
                .delete()
                .eq('id', userId)
    
            if (profileError && profileError.code !== 'PGRST116') {
                this.logger.error('Profile deletion failed', { 
                    error: profileError.message, 
                    userId 
                })
                return this._handleError(profileError, 'Database error deleting user', { userId })
            }
            
            this.logger.info('User and all related data deleted successfully by admin', { 
                userId, 
                userEmail: existingUser.email 
            })
            return this._handleSuccess({}, 'Користувача та всі пов\'язані дані успішно видалено')
            
        } catch (error) {
            this.logger.error('Error in deleteUserByAdmin', { error: error.message, userId })
            return this._handleError(error, 'Database error deleting user', { userId })
        }
    }

    async getSystemStats() {
        try {
            const [usersResult, roleStatsResult] = await Promise.allSettled([
                this.supabase.from('profiles').select('*', { count: 'exact', head: true }),
                this.supabase.from('profiles').select('role')
            ])

            if (usersResult.status === 'rejected') {
                return this._handleError(usersResult.reason, 'Unable to fetch system stats')
            }

            if (roleStatsResult.status === 'rejected') {
                return this._handleError(roleStatsResult.reason, 'Unable to fetch role stats')
            }

            const { count: totalUsers } = usersResult.value
            const { data: roleStats } = roleStatsResult.value

            const roleCounts = roleStats.reduce((acc, user) => {
                acc[user.role] = (acc[user.role] || 0) + 1
                return acc
            }, {})

            return this._handleSuccess({
                stats: {
                    totalUsers,
                    roleDistribution: roleCounts,
                    generatedAt: new Date().toISOString()
                }
            })
            
        } catch (error) {
            return this._handleError(error, this.ERRORS.INTERNAL_ERROR)
        }
    }
}

export default UserService