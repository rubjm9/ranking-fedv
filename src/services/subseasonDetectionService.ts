/**
 * Servicio de detección de subtemporadas/temporadas completadas
 * Sistema semiautomático que detecta y notifica cuando una subtemporada o temporada
 * podría estar completa, permitiendo al administrador consolidar manualmente.
 */

import { supabase } from './supabaseService'

export interface SubseasonStatus {
  season: string
  subseason: number // 1-4
  category: string
  tournamentsExpected: number
  tournamentsCompleted: number
  isComplete: boolean
  completionPercentage: number
  lastTournamentDate: string | null
}

export interface SeasonStatus {
  season: string
  subseasonsComplete: number
  totalSubseasons: number
  isComplete: boolean
  categories: {
    [key: string]: {
      hasData: boolean
      tournamentsCount: number
      lastUpdate: string | null
    }
  }
}

export interface AdminNotification {
  id: string
  type: string
  title: string
  message: string
  status: string
  season?: string
  subseason?: number
  category?: string
  action_url?: string
  action_label?: string
  metadata?: any
  created_at: string
}

// Mapeo de subtemporadas a categorías
const SUBSEASON_CATEGORIES: { [key: number]: string[] } = {
  1: ['beach_mixed'], // Subtemporada 1: Playa mixto
  2: ['beach_open', 'beach_women'], // Subtemporada 2: Playa open y women
  3: ['grass_mixed'], // Subtemporada 3: Césped mixto
  4: ['grass_open', 'grass_women'] // Subtemporada 4: Césped open y women
}

// Número típico de torneos por subtemporada (CE1)
const EXPECTED_TOURNAMENTS_PER_SUBSEASON: { [key: string]: number } = {
  beach_mixed: 1, // 1 CE1 de playa mixto
  beach_open: 1, // 1 CE1 de playa open
  beach_women: 1, // 1 CE1 de playa women
  grass_mixed: 1, // 1 CE1 de césped mixto
  grass_open: 1, // 1 CE1 de césped open
  grass_women: 1 // 1 CE1 de césped women
}

class SubseasonDetectionService {
  /**
   * Obtener la temporada actual basada en la fecha
   */
  getCurrentSeason(): string {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    // La temporada empieza en julio (mes 7)
    if (currentMonth >= 7) {
      return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
    } else {
      return `${currentYear - 1}-${currentYear.toString().slice(-2)}`
    }
  }

  /**
   * Detectar el estado de una subtemporada específica
   */
  async detectSubseasonStatus(season: string, subseason: number): Promise<SubseasonStatus[]> {
    const categories = SUBSEASON_CATEGORIES[subseason] || []
    const statuses: SubseasonStatus[] = []

    for (const category of categories) {
      try {
        // Contar torneos CE1 completados para esta categoría en esta temporada
        const { data: tournaments, error } = await supabase
          .from('tournaments')
          .select('id, name, endDate, status')
          .eq('season', season)
          .eq('category', category.toUpperCase().replace('_', ' '))
          .eq('type', 'CE1')
          .order('endDate', { ascending: false })

        if (error) {
          console.error(`Error obteniendo torneos para ${category}:`, error)
          continue
        }

        const completedTournaments = tournaments?.filter(t => 
          t.status === 'COMPLETED' || t.status === 'completed'
        ) || []

        const expectedTournaments = EXPECTED_TOURNAMENTS_PER_SUBSEASON[category] || 1
        const completionPercentage = (completedTournaments.length / expectedTournaments) * 100

        statuses.push({
          season,
          subseason,
          category,
          tournamentsExpected: expectedTournaments,
          tournamentsCompleted: completedTournaments.length,
          isComplete: completedTournaments.length >= expectedTournaments,
          completionPercentage: Math.min(completionPercentage, 100),
          lastTournamentDate: completedTournaments[0]?.endDate || null
        })
      } catch (error) {
        console.error(`Error detectando estado de ${category}:`, error)
      }
    }

    return statuses
  }

  /**
   * Detectar el estado completo de una temporada
   */
  async detectSeasonStatus(season: string): Promise<SeasonStatus> {
    let subseasonsComplete = 0
    const categories: SeasonStatus['categories'] = {}

    for (let subseason = 1; subseason <= 4; subseason++) {
      const subseasonStatuses = await this.detectSubseasonStatus(season, subseason)
      
      // Verificar si todas las categorías de esta subtemporada están completas
      const allComplete = subseasonStatuses.every(s => s.isComplete)
      if (allComplete && subseasonStatuses.length > 0) {
        subseasonsComplete++
      }

      // Agregar info de categorías
      for (const status of subseasonStatuses) {
        categories[status.category] = {
          hasData: status.tournamentsCompleted > 0,
          tournamentsCount: status.tournamentsCompleted,
          lastUpdate: status.lastTournamentDate
        }
      }
    }

    return {
      season,
      subseasonsComplete,
      totalSubseasons: 4,
      isComplete: subseasonsComplete === 4,
      categories
    }
  }

  /**
   * Crear notificación de administración
   */
  async createNotification(
    type: string,
    title: string,
    message: string,
    options: {
      season?: string
      subseason?: number
      category?: string
      actionUrl?: string
      actionLabel?: string
      metadata?: any
    } = {}
  ): Promise<string | null> {
    try {
      // Generar fingerprint para evitar duplicados
      const fingerprint = `${type}_${options.season || 'null'}_${options.subseason || 'null'}_${options.category || 'null'}`

      // Verificar si ya existe una notificación pendiente con este fingerprint
      const { data: existing } = await supabase
        .from('admin_notifications')
        .select('id')
        .eq('fingerprint', fingerprint)
        .eq('status', 'pending')
        .single()

      if (existing) {
        console.log(`Notificación ya existe: ${fingerprint}`)
        return existing.id
      }

      const { data, error } = await supabase
        .from('admin_notifications')
        .insert({
          type,
          title,
          message,
          season: options.season,
          subseason: options.subseason,
          category: options.category,
          action_url: options.actionUrl,
          action_label: options.actionLabel,
          metadata: options.metadata || {},
          fingerprint,
          status: 'pending'
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error creando notificación:', error)
        return null
      }

      return data?.id || null
    } catch (error) {
      console.error('Error en createNotification:', error)
      return null
    }
  }

  /**
   * Verificar y crear notificaciones para subtemporadas completadas
   */
  async checkAndNotifySubseasonCompletion(season?: string): Promise<void> {
    const currentSeason = season || this.getCurrentSeason()
    
    console.log(`🔍 Verificando subtemporadas para ${currentSeason}...`)

    for (let subseason = 1; subseason <= 4; subseason++) {
      const statuses = await this.detectSubseasonStatus(currentSeason, subseason)
      
      // Verificar si todas las categorías de esta subtemporada están completas
      const allComplete = statuses.every(s => s.isComplete)
      
      if (allComplete && statuses.length > 0) {
        const categoriesStr = statuses.map(s => s.category.replace('_', ' ')).join(', ')
        
        await this.createNotification(
          'subseason_complete',
          `Subtemporada ${subseason} posiblemente completada`,
          `Los torneos CE1 de ${categoriesStr} para la temporada ${currentSeason} parecen estar completos. ` +
          `Revisa y consolida los rankings si es correcto.`,
          {
            season: currentSeason,
            subseason,
            actionUrl: '/admin/season-management',
            actionLabel: 'Consolidar subtemporada',
            metadata: {
              categories: statuses.map(s => ({
                category: s.category,
                tournaments: s.tournamentsCompleted
              }))
            }
          }
        )
        
        console.log(`📬 Notificación creada para subtemporada ${subseason}`)
      }
    }
  }

  /**
   * Verificar y crear notificaciones para temporada completa
   */
  async checkAndNotifySeasonCompletion(season?: string): Promise<void> {
    const currentSeason = season || this.getCurrentSeason()
    const status = await this.detectSeasonStatus(currentSeason)

    if (status.isComplete) {
      await this.createNotification(
        'season_complete',
        `Temporada ${currentSeason} posiblemente completada`,
        `Todas las subtemporadas de ${currentSeason} parecen estar completas. ` +
        `Revisa y cierra la temporada para consolidar todos los rankings.`,
        {
          season: currentSeason,
          actionUrl: '/admin/season-management',
          actionLabel: 'Cerrar temporada',
          metadata: {
            subseasonsComplete: status.subseasonsComplete,
            categories: status.categories
          }
        }
      )
      
      console.log(`📬 Notificación creada para temporada completa ${currentSeason}`)
    }
  }

  /**
   * Obtener notificaciones pendientes
   */
  async getPendingNotifications(): Promise<AdminNotification[]> {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error obteniendo notificaciones:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error en getPendingNotifications:', error)
      return []
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      return !error
    } catch (error) {
      console.error('Error marcando notificación como leída:', error)
      return false
    }
  }

  /**
   * Resolver/cerrar notificación
   */
  async resolveNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      return !error
    } catch (error) {
      console.error('Error resolviendo notificación:', error)
      return false
    }
  }

  /**
   * Descartar notificación
   */
  async dismissNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ 
          status: 'dismissed',
          resolved_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      return !error
    } catch (error) {
      console.error('Error descartando notificación:', error)
      return false
    }
  }

  /**
   * Ejecutar verificación completa (llamar después de guardar torneos)
   */
  async runFullCheck(season?: string): Promise<void> {
    const currentSeason = season || this.getCurrentSeason()
    
    console.log(`🔄 Ejecutando verificación completa para ${currentSeason}...`)
    
    await this.checkAndNotifySubseasonCompletion(currentSeason)
    await this.checkAndNotifySeasonCompletion(currentSeason)
    
    console.log('✅ Verificación completa finalizada')
  }
}

export const subseasonDetectionService = new SubseasonDetectionService()
export default subseasonDetectionService



