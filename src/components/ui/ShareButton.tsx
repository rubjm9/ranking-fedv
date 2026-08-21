import React, { useState } from 'react'
import { Share2, Copy, Check, Twitter, Facebook, Linkedin } from 'lucide-react'

interface ShareButtonProps {
  url: string
  title?: string
  description?: string
  className?: string
  variant?: 'light' | 'dark'
  size?: 'default' | 'sm'
}

const ShareButton: React.FC<ShareButtonProps> = ({
  url,
  title,
  description,
  className = '',
  variant = 'light',
  size = 'default',
}) => {
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setIsOpen(false)
      }, 2000)
    } catch (err) {
      console.error('Error al copiar:', err)
    }
  }

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    const encodedUrl = encodeURIComponent(fullUrl)
    const encodedTitle = encodeURIComponent(title || '')

    let shareUrl = ''
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        break
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
      setIsOpen(false)
    }
  }

  const sizeClass =
    size === 'sm'
      ? 'gap-1.5 px-3 py-1.5 min-h-[44px] touch-manipulation text-xs rounded-lg'
      : 'gap-2 px-4 py-2 min-h-[44px] touch-manipulation text-sm rounded-xl'

  const iconClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  const triggerClass =
    variant === 'dark'
      ? `flex items-center font-medium text-white border border-white/20 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${sizeClass}`
      : `btn-outline bg-surface shadow-sm flex items-center ${sizeClass}`

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={triggerClass}
        aria-label="Compartir"
        aria-expanded={isOpen}
      >
        <Share2 className={iconClass} />
        <span>Compartir</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 mt-2 w-56 bg-surface rounded-xl shadow-lg border border-line z-20">
            <div className="py-1">
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-4 py-2 min-h-[44px] touch-manipulation text-sm text-content-muted hover:bg-surface-muted transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                    <span className="text-emerald-600 dark:text-emerald-300">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copiar enlace</span>
                  </>
                )}
              </button>
              <div className="border-t border-line my-1" />
              <button
                onClick={() => handleShare('twitter')}
                className="w-full flex items-center gap-3 px-4 py-2 min-h-[44px] touch-manipulation text-sm text-content-muted hover:bg-surface-muted transition-colors"
              >
                <Twitter className="h-4 w-4 text-content-muted" />
                <span>Twitter</span>
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="w-full flex items-center gap-3 px-4 py-2 min-h-[44px] touch-manipulation text-sm text-content-muted hover:bg-surface-muted transition-colors"
              >
                <Facebook className="h-4 w-4 text-content-muted" />
                <span>Facebook</span>
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="w-full flex items-center gap-3 px-4 py-2 min-h-[44px] touch-manipulation text-sm text-content-muted hover:bg-surface-muted transition-colors"
              >
                <Linkedin className="h-4 w-4 text-content-muted" />
                <span>LinkedIn</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ShareButton
