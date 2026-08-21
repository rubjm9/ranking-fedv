import React, { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

interface RankingOnboardingStepProps {
  step: number
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}

const RankingOnboardingStep: React.FC<RankingOnboardingStepProps> = ({
  step,
  title,
  icon,
  children,
  className = '',
}) => {
  const stepRef = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )

    if (stepRef.current) {
      observer.observe(stepRef.current)
    }

    return () => observer.disconnect()
  }, [prefersReducedMotion])

  return (
    <div
      ref={stepRef}
      className={`relative pl-10 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      <div className="absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white shadow-sm ring-4 ring-secondary-50">
        {step}
      </div>
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
        <div className="mb-3 flex items-center gap-2">
          <div className="rounded-full bg-brand-subtle p-2 text-link" aria-hidden>
            {icon}
          </div>
          <h3 className="text-2xl font-bold text-content">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  )
}

export default RankingOnboardingStep
