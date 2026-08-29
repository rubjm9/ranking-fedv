import type { FaqItem } from '@/utils/structuredData'

export const ABOUT_FAQ_ITEMS: FaqItem[] = [
  {
    question: '¿Qué es el CE1?',
    answer:
      'El CE1 es el Campeonato de España de primera división. Los equipos suman puntos directos de la curva nacional según el puesto obtenido; el campeón recibe 1000 puntos en 1ª división.',
  },
  {
    question: '¿Qué es el CE2?',
    answer:
      'El CE2 es el campeonato de ascenso (2ª división). Usa la misma escala que la 1ª división, pero el campeón recibe los puntos del puesto inmediatamente posterior al último equipo de 1ª. Si en 1ª participan 12 equipos, el campeón de 2ª recibe los puntos del puesto 13.',
  },
  {
    question: '¿Qué es el coeficiente regional?',
    answer:
      'Refleja la fortaleza relativa de cada región en el ámbito nacional. Solo se usan resultados de campeonatos CE1 y CE2; los regionales se excluyen del cálculo. Se aplica a los campeonatos regionales de la temporada siguiente.',
  },
  {
    question: '¿Cómo se calculan los puntos?',
    answer:
      'Cada resultado aporta puntos según la posición, el tipo de campeonato y, en regionales, el coeficiente de la región del equipo. En regionales, puntos finales = puntos base × coeficiente regional.',
  },
  {
    question: '¿Qué modalidades hay?',
    answer:
      'Hay seis modalidades independientes: playa mixto, playa open, playa femenino, césped mixto, césped open y césped femenino. Cada combinación de superficie y categoría tiene su propio ranking.',
  },
  {
    question: '¿Cómo funciona la ventana temporal?',
    answer:
      'El ranking actual suma los puntos de las últimas cuatro temporadas con pesos decrecientes: temporada actual ×1.0, T−1 ×0.8, T−2 ×0.5 y T−3 ×0.2.',
  },
  {
    question: '¿Cuál es la diferencia entre campeonatos nacionales y regionales?',
    answer:
      'Los campeonatos de España reparten más puntos que los regionales. En un regional el campeón parte de 100 puntos base, multiplicados después por el coeficiente regional del equipo.',
  },
  {
    question: '¿Cómo se construye el ranking general?',
    answer:
      'Se suman los puntos de campeonatos oficiales con ponderación temporal y se calculan rankings por modalidad y un ranking general que agrega el rendimiento de cada equipo.',
  },
]
