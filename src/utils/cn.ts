import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Compone clases de Tailwind resolviendo conflictos: la última gana.
 *
 * `clsx` aplana condicionales y `twMerge` descarta las clases que compiten
 * entre sí (`px-2 px-4` → `px-4`), lo que permite sobrescribir estilos desde
 * la prop `className` de un componente sin duplicar utilidades.
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
