import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'

interface CollapsibleRowsProps {
  expanded: boolean
  /** Cierto mientras dura la animación de contraer, con todas las filas montadas. */
  collapsing: boolean
  onCollapseEnd: () => void
  children: React.ReactNode
}

/**
 * Anima el despliegue de la tabla del ranking en ambos sentidos.
 *
 * Antes el alto máximo pasaba de `none` a un valor fijo, y CSS no puede animar
 * desde `none`: solo se veía la transición al contraer. Aquí se mide el alto
 * real del contenido, de modo que la animación funciona en los dos sentidos y
 * a la velocidad que corresponde al contenido que hay.
 */
const CollapsibleRows: React.FC<CollapsibleRowsProps> = ({
  expanded,
  collapsing,
  onCollapseEnd,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null)
  /** Alto con solo las filas visibles en estado contraído. */
  const altoContraido = useRef<number | null>(null)
  const [maxHeight, setMaxHeight] = useState<string>('none')

  // Con la tabla contraída y estable, se guarda su alto como punto de partida.
  useLayoutEffect(() => {
    if (!expanded && !collapsing && ref.current) {
      altoContraido.current = ref.current.scrollHeight
      setMaxHeight('none')
    }
  }, [expanded, collapsing, children])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!expanded && !collapsing) return

    const completo = el.scrollHeight
    const contraido = altoContraido.current ?? Math.min(completo, 960)

    /*
     * El valor de partida se escribe directamente en el nodo y se fuerza un
     * reflow: si se hicieran los dos cambios por estado, React los aplicaría en
     * el mismo frame y no habría transición que animar.
     */
    const desde = expanded ? contraido : completo
    const hasta = expanded ? completo : contraido

    el.style.maxHeight = `${desde}px`
    void el.offsetHeight
    setMaxHeight(`${hasta}px`)
  }, [expanded, collapsing])

  return (
    <div
      ref={ref}
      className="overflow-hidden transition-[max-height] duration-500 ease-in-out motion-reduce:transition-none"
      style={{ maxHeight }}
      onTransitionEnd={() => {
        if (collapsing) onCollapseEnd()
        // Al acabar de expandir se libera el tope para que pueda crecer.
        if (expanded) setMaxHeight('none')
      }}
    >
      {children}
    </div>
  )
}

export default CollapsibleRows
