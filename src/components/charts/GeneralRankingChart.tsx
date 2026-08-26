import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import dynamicRankingService from '@/services/dynamicRankingService'
import { formatPoints, formatInteger } from '@/utils/rankingCalculations'
import { useChartTheme } from '@/utils/chartTheme'

interface SubseasonDataPoint {
  date: string
  season: string
  category: string
  rank: number
  points: number
}

const SUBSEASON_LABELS = ['Playa Mixto', 'Playa Open/Women', 'Césped Mixto', 'Final']

function flattenHistory(historyData: any[]): any[] {
  const processed: any[] = []
  historyData.forEach(point => {
    const baseYear = new Date(point.date).getFullYear()
    const subupdates = [point.subupdate1, point.subupdate2, point.subupdate3, point.subupdate4]
    subupdates.forEach((subupdate: any, index: number) => {
      if (subupdate && subupdate.rank != null) {
        const dateStr = `${baseYear}-${(3 * index + 3).toString().padStart(2, '0')}-01`
        processed.push({
          date: dateStr,
          displayDate: new Date(dateStr).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
          season: point.season,
          subseasonLabel: SUBSEASON_LABELS[index],
          rank: subupdate.rank,
          points: subupdate.points ?? 0
        })
      }
    })
  })
  return processed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

function mergeHistories(mainData: any[], compareData: any[]): any[] {
  const byDate: Record<string, any> = {}
  mainData.forEach(row => {
    byDate[row.date] = {
      ...row,
      compareRank: null as number | null,
      comparePoints: null as number | null
    }
  })
  compareData.forEach(row => {
    if (!byDate[row.date]) {
      byDate[row.date] = {
        date: row.date,
        displayDate: row.displayDate,
        season: row.season,
        subseasonLabel: row.subseasonLabel,
        rank: null,
        points: null,
        compareRank: row.rank,
        comparePoints: row.points ?? 0
      }
    } else {
      byDate[row.date].compareRank = row.rank
      byDate[row.date].comparePoints = row.points ?? 0
    }
  })
  return Object.values(byDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

interface GeneralRankingChartProps {
  data?: SubseasonDataPoint[]
  teamId?: string
  teamName?: string
  height?: number
  showPoints?: boolean
  useDynamicData?: boolean
  /** 'position' = gráfica de posición (ranking), 'points' = gráfica de puntos */
  metric?: 'position' | 'points'
  /** ID del equipo con el que comparar */
  compareWithTeamId?: string
  /** Nombre del equipo con el que comparar (para leyenda) */
  compareWithTeamName?: string
}

const GeneralRankingChart: React.FC<GeneralRankingChartProps> = ({ 
  data, 
  teamId,
  teamName, 
  height = 300,
  showPoints = false,
  useDynamicData = false,
  metric = 'position',
  compareWithTeamId,
  compareWithTeamName
}) => {
  const chart = useChartTheme()
  const [chartData, setChartData] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  // Cargar datos dinámicos (y opcionalmente del equipo a comparar)
  React.useEffect(() => {
    if (useDynamicData && teamId) {
      setIsLoading(true)
      const loadMain = dynamicRankingService.getGlobalRankingHistory(teamId)
      const loadCompare = compareWithTeamId
        ? dynamicRankingService.getGlobalRankingHistory(compareWithTeamId)
        : Promise.resolve([])

      Promise.all([loadMain, loadCompare])
        .then(([mainHistory, compareHistory]) => {
          const mainFlat = flattenHistory(mainHistory)
          if (compareWithTeamId && compareHistory.length > 0) {
            const compareFlat = flattenHistory(compareHistory)
            setChartData(mergeHistories(mainFlat, compareFlat))
          } else {
            setChartData(mainFlat)
          }
        })
        .catch(error => {
          console.error('Error cargando datos dinámicos:', error)
          setChartData([])
        })
        .finally(() => setIsLoading(false))
    } else if (data) {
      // Para datos estáticos (compatibilidad con versión anterior)
      const dataByDate: { [key: string]: any } = {}
      
      data.forEach(point => {
        const dateKey = point.date
        if (!dataByDate[dateKey]) {
          dataByDate[dateKey] = {
            date: dateKey,
            displayDate: new Date(point.date).toLocaleDateString('es-ES', { 
              month: 'short', 
              year: '2-digit' 
            }),
            season: point.season
          }
        }
        
        // Agregar datos según la categoría (open y women por separado cuando existan)
        if (point.category === 'subseason_1_beach_mixed') {
          dataByDate[dateKey].subseason1 = point.rank
          dataByDate[dateKey].subseason1Points = point.points
        } else if (point.category === 'subseason_2_beach_open') {
          dataByDate[dateKey].subseason2Open = point.rank
          dataByDate[dateKey].subseason2OpenPoints = point.points
        } else if (point.category === 'subseason_2_beach_women') {
          dataByDate[dateKey].subseason2Women = point.rank
          dataByDate[dateKey].subseason2WomenPoints = point.points
        } else if (point.category === 'subseason_2_beach_open_women') {
          dataByDate[dateKey].subseason2 = point.rank
          dataByDate[dateKey].subseason2Points = point.points
        } else if (point.category === 'subseason_3_grass_mixed') {
          dataByDate[dateKey].subseason3 = point.rank
          dataByDate[dateKey].subseason3Points = point.points
        } else if (point.category === 'subseason_4_grass_open') {
          dataByDate[dateKey].subseason4Open = point.rank
          dataByDate[dateKey].subseason4OpenPoints = point.points
        } else if (point.category === 'subseason_4_grass_women') {
          dataByDate[dateKey].subseason4Women = point.rank
          dataByDate[dateKey].subseason4WomenPoints = point.points
        } else if (point.category === 'subseason_4_grass_open_women') {
          dataByDate[dateKey].subseason4 = point.rank
          dataByDate[dateKey].subseason4Points = point.points
        } else if (point.category === 'final_global') {
          dataByDate[dateKey].finalGlobal = point.rank
          dataByDate[dateKey].finalGlobalPoints = point.points
        }
      })
      
      setChartData(Object.values(dataByDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
    }
  }, [useDynamicData, teamId, compareWithTeamId, data])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-surface-muted rounded-lg">
        <div className="text-center text-content-subtle">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando datos del ranking global...</p>
        </div>
      </div>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-surface-muted rounded-lg">
        <div className="text-center text-content-subtle">
          <p>No hay datos históricos disponibles</p>
          <p className="text-sm mt-1">
            {useDynamicData 
              ? 'Los datos aparecerán cuando se ejecute la simulación de subtemporadas'
              : 'Los datos aparecerán después de ejecutar la simulación de subtemporadas'
            }
          </p>
        </div>
      </div>
    )
  }

  const isComparing = Boolean(compareWithTeamId && compareWithTeamName)
  const dataKey = metric === 'points' ? 'points' : 'rank'
  const compareDataKey = metric === 'points' ? 'comparePoints' : 'compareRank'

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const dataPoint = payload[0]?.payload
    return (
      <div className="bg-surface p-3 border border-line rounded-lg shadow-lg min-w-[160px]">
        <p className="font-medium text-content mb-2">{label}</p>
        {dataPoint?.subseasonLabel && (
          <p className="text-xs text-content-subtle mb-2">{dataPoint.subseasonLabel}</p>
        )}
        {payload.map((entry: any, index: number) => {
          if (entry.value == null && entry.dataKey !== compareDataKey) return null
          const isCompare = entry.dataKey === compareDataKey
          const labelText = isCompare ? compareWithTeamName : (teamName || 'Este equipo')
          const value = entry.value
          if (value == null) return null
          return (
            <div key={index} className="flex items-center gap-2 text-sm mb-1">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-content-muted truncate">{labelText}:</span>
              {metric === 'position' ? (
                <span className="font-medium">#{value}</span>
              ) : (
                <span className="font-medium">{formatPoints(Number(value), 1)} pts</span>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="w-full">
      {teamName && (
        <div className="mb-4">
          <h4 className="text-lg font-medium text-content">Evolución del Ranking Global</h4>
          <p className="text-sm text-content-muted">Equipo: {teamName}</p>
        </div>
      )}
      
      {/* Los gráficos no tenían nombre accesible: para un lector de pantalla
          simplemente no existían. */}
      <div
        role="img"
        aria-label={
          metric === 'position'
            ? `Evolución del puesto de ${teamName || 'el equipo'} en el ranking global por temporada`
            : `Evolución de los puntos de ${teamName || 'el equipo'} en el ranking global por temporada`
        }
      >
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
          <XAxis 
            dataKey="displayDate" 
            stroke={chart.axis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tickFormatter={(v: number) => formatInteger(v)}
            stroke={chart.axis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            reversed={metric === 'position'}
            domain={metric === 'position' ? ['dataMin - 1', 'dataMax + 1'] : [0, 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          {isComparing && (
            <Legend
              formatter={(value) => <span className="text-content-muted">{value}</span>}
            />
          )}
          
          {useDynamicData ? (
            <>
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={chart.series[0]}
                strokeWidth={2}
                dot={{ fill: chart.series[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chart.series[0], strokeWidth: 2 }}
                connectNulls={false}
                name={teamName || 'Este equipo'}
              />
              {isComparing && (
                /* Los dos primeros tonos de la paleta: es el par validado para
                   contraste y para daltonismo. */
                <Line
                  type="monotone"
                  dataKey={compareDataKey}
                  stroke={chart.series[1]}
                  strokeWidth={2}
                  dot={{ fill: chart.series[1], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: chart.series[1], strokeWidth: 2 }}
                  connectNulls={false}
                  name={compareWithTeamName || 'Otro equipo'}
                />
              )}
            </>
          ) : (
            // Para datos estáticos, mostrar todas las líneas de subtemporadas
            <>
              <Line
                type="monotone"
                dataKey="subseason1"
                stroke={chart.series[0]}
                strokeWidth={2}
                dot={{ fill: chart.series[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chart.series[0], strokeWidth: 2 }}
                connectNulls={false}
                name="Playa Mixto"
              />
              <Line
                type="monotone"
                dataKey="subseason2Open"
                stroke={chart.series[1]}
                strokeWidth={2}
                dot={{ fill: chart.series[1], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chart.series[1], strokeWidth: 2 }}
                connectNulls={false}
                name="Playa Open"
              />
              <Line
                type="monotone"
                dataKey="subseason2Women"
                stroke={chart.series[2]}
                strokeWidth={2}
                dot={{ fill: chart.series[2], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chart.series[2], strokeWidth: 2 }}
                connectNulls={false}
                name="Playa Women"
              />
              <Line
                type="monotone"
                dataKey="subseason2"
                stroke={chart.series[3]}
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={{ fill: chart.series[3], strokeWidth: 2, r: 3 }}
                connectNulls={false}
                name="Playa (combinado)"
              />
              <Line
                type="monotone"
                dataKey="subseason3"
                stroke={chart.series[4]}
                strokeWidth={2}
                dot={{ fill: chart.series[4], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chart.series[4], strokeWidth: 2 }}
                connectNulls={false}
                name="Césped Mixto"
              />
              <Line
                type="monotone"
                dataKey="subseason4Open"
                stroke={chart.series[5]}
                strokeWidth={2}
                dot={{ fill: chart.series[5], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chart.series[5], strokeWidth: 2 }}
                connectNulls={false}
                name="Césped Open"
              />
              <Line
                type="monotone"
                dataKey="subseason4Women"
                stroke={chart.series[6]}
                strokeWidth={2}
                dot={{ fill: chart.series[6], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chart.series[6], strokeWidth: 2 }}
                connectNulls={false}
                name="Césped Women"
              />
              <Line
                type="monotone"
                dataKey="subseason4"
                stroke={chart.series[7]}
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={{ fill: chart.series[7], strokeWidth: 2, r: 3 }}
                connectNulls={false}
                name="Césped (combinado)"
              />
              {/*
                El total no es una categoría, así que no gasta un noveno tono:
                va en tinta neutra y con trazo más grueso, distinguible por algo
                más que el color.
              */}
              <Line
                type="monotone"
                dataKey="finalGlobal"
                stroke={chart.emphasis}
                strokeWidth={3}
                dot={{ fill: chart.emphasis, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chart.emphasis, strokeWidth: 2 }}
                connectNulls={false}
                name="Ranking Global Final"
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-xs text-content-subtle text-center">
        {metric === 'position' ? (
          <p>Posición: 1 arriba (mejor), últimas posiciones abajo</p>
        ) : (
          <p>Puntos acumulados en el ranking global por subtemporada</p>
        )}
        {useDynamicData && (
          <p>Datos calculados dinámicamente según subtemporadas jugadas</p>
        )}
      </div>
    </div>
  )
}

export default GeneralRankingChart