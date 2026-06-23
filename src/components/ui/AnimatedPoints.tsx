import React, { useEffect, useRef, useState } from 'react'
import { formatPoints } from '@/utils/rankingCalculations'

interface AnimatedPointsProps {
  value: number
  decimals?: number
  duration?: number
  className?: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const AnimatedPoints: React.FC<AnimatedPointsProps> = ({
  value,
  decimals = 1,
  duration = 2000,
  className,
}) => {
  const [displayValue, setDisplayValue] = useState(0)
  const rafRef = useRef<number>()

  useEffect(() => {
    if (value <= 0) {
      setDisplayValue(0)
      return
    }

    const startTimeRef = { current: 0 }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)
      setDisplayValue(value * easeOutCubic(progress))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    setDisplayValue(0)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  return <p className={className}>{formatPoints(displayValue, decimals)}</p>
}

export default AnimatedPoints
