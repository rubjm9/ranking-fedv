import React, { useState } from 'react'
import { Share2, Copy, Check, Twitter, Facebook, Linkedin } from 'lucide-react'

interface ShareButtonProps {
  url: string
  title?: string
  description?: string
  className?: string
  variant?: 'light' | 'dark'
}

const ShareButton: React.FC<ShareButtonProps> = ({
  url,
  title,
  description,
  className = '',
  variant = 'light',
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

  const triggerClass =
    variant === 'dark'
      ? 'flex items-center gap-2 px-4 py-2 text-sm font-medium text-white border border-white/20 rounded-xl hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500'
      : 'btn-outline bg-white shadow-sm flex items-center gap-2 text-sm'

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={triggerClass}
        aria-label="Compartir"
        aria-expanded={isOpen}
      >
        <Share2 className="h-4 w-4" />
        <span>Compartir</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-20">
            <div className="py-1">
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-600">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copiar enlace</span>
                  </>
                )}
              </button>
              <div className="border-t border-slate-200 my-1" />
              <button
                onClick={() => handleShare('twitter')}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Twitter className="h-4 w-4 text-slate-600" />
                <span>Twitter</span>
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Facebook className="h-4 w-4 text-slate-600" />
                <span>Facebook</span>
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Linkedin className="h-4 w-4 text-slate-600" />
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
