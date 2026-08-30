import React, { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { FaqItem } from '@/utils/structuredData'

interface FaqSectionProps {
  items: FaqItem[]
}

const FaqSection: React.FC<FaqSectionProps> = ({ items }) => {
  const baseId = useId()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section className="card" aria-labelledby={`${baseId}-heading`}>
      <h2 id={`${baseId}-heading`} className="text-2xl font-bold text-content mb-6">
        Preguntas frecuentes
      </h2>

      <div className="divide-y divide-line">
        {items.map((item, index) => {
          const isOpen = openIndex === index
          const questionId = `${baseId}-q-${index}`
          const answerId = `${baseId}-a-${index}`

          return (
            <div key={item.question}>
              <h3 className="text-base font-semibold text-content">
                <button
                  type="button"
                  id={questionId}
                  className="flex w-full items-center justify-between gap-3 py-4 min-h-[44px] touch-manipulation text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => toggle(index)}
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-content-subtle transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
              </h3>
              <div
                id={answerId}
                role="region"
                aria-labelledby={questionId}
                hidden={!isOpen}
                className="pb-4 text-content-muted text-sm leading-relaxed"
              >
                {item.answer}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default FaqSection
