"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Camera, X, User } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/i18n"

interface RegistrationPhotoUploadProps {
  onPhotoSelected?: (file: File, previewUrl: string) => void
  onPhotoRemoved?: () => void
  disabled?: boolean
  size?: "sm" | "md" | "lg"
  showRemoveButton?: boolean
}

export function RegistrationPhotoUpload({
  onPhotoSelected,
  onPhotoRemoved,
  disabled = false,
  size = "md",
  showRemoveButton = true
}: RegistrationPhotoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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

    setError(null)

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

    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreviewUrl(result)
      setSelectedFile(file)
      onPhotoSelected?.(file, result)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setPreviewUrl(null)
    setSelectedFile(null)
    setError(null)
    onPhotoRemoved?.()
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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
            src={previewUrl || undefined} 
            alt={language === 'ar' ? 'صورة المستخدم' : 'User photo'} 
          />
          <AvatarFallback className="bg-gray-50">
            <User className="w-8 h-8 text-gray-400" />
          </AvatarFallback>
        </Avatar>

        {/* Remove button */}
        {previewUrl && showRemoveButton && !disabled && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
            onClick={handleRemovePhoto}
            type="button"
          >
            <X className="w-3 h-3" />
          </Button>
        )}

        {/* Upload overlay for empty state */}
        {!previewUrl && (
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
          type="button"
          variant={previewUrl ? "outline" : "default"}
          size="sm"
          onClick={triggerFileSelect}
          disabled={disabled}
          className="flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>
            {previewUrl 
              ? (language === 'ar' ? 'تغيير الصورة' : 'Change Photo')
              : (language === 'ar' ? 'رفع صورة' : 'Upload Photo')
            }
          </span>
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

      {/* Selected file info */}
      {selectedFile && (
        <div className="text-xs text-gray-600 text-center">
          <p>{selectedFile.name}</p>
          <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
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
