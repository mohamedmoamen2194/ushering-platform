"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Camera, X, User } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/i18n"

interface PhotoUploadProps {
  userId: number
  userRole: string
  currentPhotoUrl?: string
  onPhotoUploaded?: (photoUrl: string) => void
  onPhotoRemoved?: () => void
  disabled?: boolean
  size?: "sm" | "md" | "lg"
  showRemoveButton?: boolean
}

export function PhotoUpload({
  userId,
  userRole,
  currentPhotoUrl,
  onPhotoUploaded,
  onPhotoRemoved,
  disabled = false,
  size = "md",
  showRemoveButton = true
}: PhotoUploadProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { language, isRTL } = useLanguage()
  const { t } = useTranslation(language)

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError(language === 'ar' ? 'نوع الملف غير مدعوم. يُسمح فقط بصور JPEG و PNG و WebP' : 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError(language === 'ar' ? 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت' : 'File size too large. Maximum size is 5MB.')
      return
    }

    uploadPhoto(file)
  }

  const uploadPhoto = async (file: File) => {
    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('photo', file)
      formData.append('userId', userId.toString())
      formData.append('userRole', userRole)

      const response = await fetch('/api/upload/photo', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setPhotoUrl(result.photoUrl)
      onPhotoUploaded?.(result.photoUrl)
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('Photo upload error:', error)
      setError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemovePhoto = async () => {
    try {
      // Here you could add an API call to remove the photo from the server
      setPhotoUrl(null)
      onPhotoRemoved?.()
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error removing photo:', error)
    }
  }

  const triggerFileSelect = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${isRTL ? 'text-right' : 'text-left'}`}>
      {/* Photo Display */}
      <div className="relative">
        <Avatar className={`${sizeClasses[size]} border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors`}>
          <AvatarImage 
            src={photoUrl || undefined} 
            alt={language === 'ar' ? 'صورة المستخدم' : 'User photo'} 
          />
          <AvatarFallback className="bg-gray-50">
            <User className="w-8 h-8 text-gray-400" />
          </AvatarFallback>
        </Avatar>

        {/* Remove button */}
        {photoUrl && showRemoveButton && !disabled && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
            onClick={handleRemovePhoto}
          >
            <X className="w-3 h-3" />
          </Button>
        )}

        {/* Upload overlay for empty state */}
        {!photoUrl && (
          <div 
            className={`absolute inset-0 flex items-center justify-center cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            onClick={triggerFileSelect}
          >
            <Camera className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex flex-col items-center space-y-2">
        <Button
          variant={photoUrl ? "outline" : "default"}
          size="sm"
          onClick={triggerFileSelect}
          disabled={disabled || isUploading}
          className="flex items-center space-x-2"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              <span>{language === 'ar' ? 'جاري الرفع...' : 'Uploading...'}</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>
                {photoUrl 
                  ? (language === 'ar' ? 'تغيير الصورة' : 'Change Photo')
                  : (language === 'ar' ? 'رفع صورة' : 'Upload Photo')
                }
              </span>
            </>
          )}
        </Button>

        {/* File size info */}
        <p className="text-xs text-gray-500 text-center">
          {language === 'ar' 
            ? 'JPEG، PNG، WebP - حد أقصى 5 ميجابايت'
            : 'JPEG, PNG, WebP - Max 5MB'
          }
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="w-full max-w-sm">
          <CardContent className="p-3">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  )
}
