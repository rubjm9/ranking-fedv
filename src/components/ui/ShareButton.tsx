import React, { useRef, useState } from 'react'
import { Share2, Copy, Check, Twitter, Facebook, Linkedin } from 'lucide-react'

interface ShareButtonProps {
  /** Ruta relativa; el origen se compone en runtime. */
  url: string
  title?: string
  description?: string
  className?: string
  variant?: 'light' | 'dark'
  size?: 'default' | 'sm'
}

/** La hoja nativa del sistema, donde están WhatsApp y Telegram. */
const tieneCompartirNativo = () =>
  typeof navigator !== 'undefined' && typeof navigator.share === 'function'

const ShareButton: React.FC<ShareButtonProps> = ({
  url,
  title,
  description,
  className = '',
  variant = 'light',
  size = 'default',
}) => {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const fallbackRef = useRef<HTMLInputElement>(null)

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setCopyError(false)
      setTimeout(() => {
        setCopied(false)
        setIsOpen(false)
      }, 2000)
    } catch {
      // Sin contexto seguro no hay portapapeles. Antes esto solo dejaba un
      // console.error y el menú se quedaba quieto, sin que el usuario supiera
      // por qué. Ahora se le ofrece la URL para copiarla a mano.
      setCopyError(true)
      requestAnimationFrame(() => fallbackRef.current?.select())
    }
  }

  /**
   * En táctil, la hoja nativa lleva a WhatsApp, Telegram y Signal, que es
   * donde de verdad se comparte esto y que el desplegable no ofrecía.
   */
  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, text: description, url: fullUrl })
    } catch (error) {
      // Cancelar la hoja lanza AbortError; no es un fallo que reportar.
      if ((error as DOMException)?.name === 'AbortError') return
      setIsOpen(true)
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
      window.open(shareUrl, '_blank', 'noopener,noreferrer')
      setIsOpen(false)
    }
  }

  const nativo = tieneCompartirNativo()

  const sizeClass =
    size === 'sm'
      ? 'gap-1.5 px-3 py-1.5 min-h-[44px] touch-manipulation text-xs rounded-lg'
      : 'gap-2 px-4 py-2 min-h-[44px] touch-manipulation text-sm rounded-xl'

  const iconClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  const triggerClass =
    variant === 'dark'
      ? `flex items-center font-medium text-white border border-white/20 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${sizeClass}`
      : `btn-outline bg-surface shadow-sm flex items-center ${sizeClass}`

  const opcionClass =
    'w-full flex items-center gap-3 px-4 py-2 min-h-[44px] touch-manipulation text-sm text-content-muted hover:bg-surface-muted transition-colors'

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={nativo ? handleNativeShare : () => setIsOpen(!isOpen)}
        className={triggerClass}
        aria-label="Compartir"
        {...(nativo ? {} : { 'aria-expanded': isOpen })}
      >
        <Share2 className={iconClass} aria-hidden="true" />
        <span>Compartir</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 mt-2 w-64 bg-surface rounded-xl shadow-lg border border-line z-20">
            <div className="py-1">
              <button type="button" onClick={handleCopy} className={opcionClass}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
                    <span className="text-emerald-600 dark:text-emerald-300">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    <span>Copiar enlace</span>
                  </>
                )}
              </button>

              {copyError && (
                <div className="px-4 pb-3 pt-1">
                  <p className="mb-2 text-xs text-content-subtle">
                    Este navegador no permite copiar automáticamente. Copia el enlace a mano:
                  </p>
                  <input
                    ref={fallbackRef}
                    readOnly
                    value={fullUrl}
                    aria-label="Enlace para copiar"
                    onFocus={e => e.currentTarget.select()}
                    className="w-full rounded-md border border-line bg-surface-muted px-2 py-2 text-base text-content"
                  />
                </div>
              )}

              <div className="border-t border-line my-1" />
              <button type="button" onClick={() => handleShare('twitter')} className={opcionClass}>
                <Twitter className="h-4 w-4 text-content-muted" aria-hidden="true" />
                <span>Twitter</span>
              </button>
              <button type="button" onClick={() => handleShare('facebook')} className={opcionClass}>
                <Facebook className="h-4 w-4 text-content-muted" aria-hidden="true" />
                <span>Facebook</span>
              </button>
              <button type="button" onClick={() => handleShare('linkedin')} className={opcionClass}>
                <Linkedin className="h-4 w-4 text-content-muted" aria-hidden="true" />
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
