/**
 * Recalcula positions.points con la curva vigente (CE2: offset = equipos en CE1 padre).
 *
 *   npm run recompute-position-points
 *
 * Requiere .env.local con VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from '@supabase/supabase-js'
import { getPointsForPosition, getOffsetForTournament } from '../utils/tournamentUtils'

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Faltan VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

const main = async () => {
  console.log('Recalculando puntos de todas las posiciones...')

  const { data: tournaments, error: tournamentsError } = await supabase
    .from('tournaments')
    .select('id, type, divisionSize, parentTournamentId')

  if (tournamentsError) throw tournamentsError

  const { data: allPositions, error: allPositionsError } = await supabase
    .from('positions')
    .select('tournamentId')

  if (allPositionsError) throw allPositionsError

  const ce1PositionCounts = new Map<string, number>()
  for (const pos of allPositions || []) {
    const tid = pos.tournamentId as string
    ce1PositionCounts.set(tid, (ce1PositionCounts.get(tid) ?? 0) + 1)
  }

  let updated = 0
  let ce2DivisionSizesSynced = 0

  for (const tournament of tournaments || []) {
    const ce1PositionCount =
      tournament.type === 'CE2' && tournament.parentTournamentId
        ? ce1PositionCounts.get(tournament.parentTournamentId)
        : undefined

    const offset = getOffsetForTournament(
      tournament.type,
      tournament.divisionSize,
      ce1PositionCount
    )

    if (
      tournament.type === 'CE2' &&
      ce1PositionCount != null &&
      ce1PositionCount >= 1 &&
      tournament.divisionSize !== ce1PositionCount
    ) {
      const { error: syncError } = await supabase
        .from('tournaments')
        .update({ divisionSize: ce1PositionCount })
        .eq('id', tournament.id)
      if (syncError) throw syncError
      ce2DivisionSizesSynced++
    }

    const { data: positions, error: positionsError } = await supabase
      .from('positions')
      .select('id, position, teamId, tournamentId, points')
      .eq('tournamentId', tournament.id)

    if (positionsError) throw positionsError
    if (!positions?.length) continue

    const recomputed = positions.map((p) => ({
      id: p.id,
      tournamentId: p.tournamentId,
      teamId: p.teamId,
      position: p.position,
      points: getPointsForPosition(p.position, tournament.type, offset),
    }))

    updated += recomputed.filter(
      (r, i) => r.points !== (positions[i]?.points ?? 0)
    ).length

    const { error: upsertError } = await supabase
      .from('positions')
      .upsert(recomputed, { onConflict: 'id' })

    if (upsertError) throw upsertError
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        positionsWithNewPoints: updated,
        ce2DivisionSizesSynced,
      },
      null,
      2
    )
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
