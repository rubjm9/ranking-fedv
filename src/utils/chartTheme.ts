import { useTheme } from '@/hooks/useTheme'

/**
 * Paleta y colores estructurales de los gráficos.
 *
 * Antes cada gráfico definía la suya: el mismo array de seis hexadecimales
 * estaba triplicado dentro de RankingPageNew y había cuatro variantes más
 * repartidas. Y ninguno miraba el tema, así que en modo oscuro se pintaban
 * exactamente igual que en claro.
 *
 * Las dos columnas están escogidas para su fondo, no son un volteo automático
 * la una de la otra. Validadas como conjunto contra las superficies reales de
 * la app (#ffffff y #111a2e): banda de luminosidad, suelo de croma, separación
 * para daltonismo y contraste. En claro, tres series quedan por debajo de 3:1,
 * así que los gráficos que las usen necesitan leyenda o etiquetas visibles —
 * que es lo que ya llevan.
 *
 * El orden es fijo. Una novena serie no se inventa: se agrupa en «otros», se
 * separa en varios gráficos, o —si es un total y no una categoría— usa la
 * tinta neutra de `emphasis`, que además se distingue por grosor y trazo.
 */

const SERIES_CLARO = [
  '#2a78d6', // azul
  '#eb6834', // naranja
  '#1baf7a', // agua
  '#eda100', // amarillo
  '#e87ba4', // magenta
  '#008300', // verde
  '#4a3aa7', // violeta
  '#e34948', // rojo
] as const

const SERIES_OSCURO = [
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#008300',
  '#9085e9',
  '#e66767',
] as const

/**
 * Codificación secundaria por trazo, en el mismo orden que las series.
 *
 * Hace falta cuando hay más de tres series a la vez y cualquiera se compara
 * con cualquiera —una gráfica de líneas, no una pila—: ahí la paleta completa
 * no separa lo suficiente para daltonismo (el par agua/magenta baja a ΔE 1,6
 * en deuteranopía, medido). Con el trazo, la identidad no depende solo del
 * color. Lo correcto por encima de tres series sigue siendo dividir en varias
 * gráficas pequeñas.
 */
/*
  El orden no es arbitrario: los trazos más distintos entre sí van a los pares
  que el validador señala como peores. Con seis series sobre la superficie
  oscura esos pares son agua↔magenta (posiciones 3 y 5, ΔE 1,6 en deuteranopía)
  y amarillo↔naranja (2 y 4, ΔE 10,6 con visión normal). Así que 3 lleva raya
  larga frente al punteado fino de 5, y 2 lleva raya media frente al punteado
  de 4.
*/
export const SERIES_DASH: readonly (string | undefined)[] = [
  undefined,      // 1 · sólido
  '8 4',          // 2 · raya media
  '14 5',         // 3 · raya larga
  '2 3',          // 4 · punteado
  '1 4',          // 5 · punteado fino
  '10 4 2 4',     // 6 · raya-punto
  '6 3 2 3',      // 7 · raya-punto-punto
  '3 3 9 3',      // 8 · mixto
]

export interface ChartTheme {
  /** Ocho tonos en orden fijo. Nunca se ciclan. */
  series: readonly string[]
  /** Tinta neutra para una línea de total o resumen, que no es una categoría. */
  emphasis: string
  grid: string
  /** Texto de las marcas de los ejes. */
  axis: string
  axisLine: string
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
}

/** Valores tomados de los tokens semánticos de index.css, resueltos a hex
 *  porque recharts no acepta `var(--x)` en sus props de color. */
const TEMA_CLARO: ChartTheme = {
  series: SERIES_CLARO,
  emphasis: '#0f172a',
  grid: '#e2e8f0',
  axis: '#475569',
  axisLine: '#cbd5e1',
  tooltipBg: '#ffffff',
  tooltipBorder: '#cbd5e1',
  tooltipText: '#0f172a',
}

const TEMA_OSCURO: ChartTheme = {
  series: SERIES_OSCURO,
  emphasis: '#f8fafc',
  grid: '#334155',
  axis: '#cbd5e1',
  axisLine: '#475569',
  tooltipBg: '#111a2e',
  tooltipBorder: '#475569',
  tooltipText: '#f8fafc',
}

export function useChartTheme(): ChartTheme {
  const { resolved } = useTheme()
  return resolved === 'dark' ? TEMA_OSCURO : TEMA_CLARO
}

/** Para código fuera de un componente. Prefiere el hook siempre que puedas. */
export function getChartTheme(resolved: 'light' | 'dark'): ChartTheme {
  return resolved === 'dark' ? TEMA_OSCURO : TEMA_CLARO
}
