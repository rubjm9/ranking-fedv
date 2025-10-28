import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import dynamicRankingService from '@/services/dynamicRankingService'

interface SubseasonDataPoint {
  date: string
  season: string
  category: string
  rank: number
  points: number
}

interface GeneralRankingChartProps {
  data?: SubseasonDataPoint[]
  teamId?: string
  teamName?: string
  height?: number
  showPoints?: boolean
  useDynamicData?: boolean
}

const GeneralRankingChart: React.FC<GeneralRankingChartProps> = ({ 
  data, 
  teamId,
  teamName, 
  height = 300,
  showPoints = false,
  useDynamicData = false
}) => {
  const [chartData, setChartData] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  // Cargar datos dinámicos si se solicita
  React.useEffect(() => {
    if (useDynamicData && teamId) {
      setIsLoading(true)
      // Obtener datos de las 4 subtemporadas para cada temporada
      dynamicRankingService.getGlobalRankingHistory(teamId)
        .then(historyData => {
          console.log('📊 Datos históricos recibidos:', historyData)
          const processedData = historyData.map(point => ({
            date: point.date,
            displayDate: new Date(point.date).toLocaleDateString('es-ES', { 
              month: 'short', 
              year: '2-digit' 
            }),
            season: point.season,
            subupdate1: point.subupdate1?.rank,
            subupdate1Points: point.subupdate1?.points,
            subupdate2: point.subupdate2?.rank,
            subupdate2Points: point.subupdate2?.points,
            subupdate3: point.subupdate3?.rank,
            subupdate3Points: point.subupdate3?.points,
            subupdate4: point.subupdate4?.rank,
            subupdate4Points: point.subupdate4?.points
          }))
          console.log('📊 Datos procesados para gráfica:', processedData)
          setChartData(processedData)
        })
        .catch(error => {
          console.error('Error cargando datos dinámicos:', error)
          setChartData([])
        })
        .finally(() => {
          setIsLoading(false)
        })
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
        
        // Agregar datos según la categoría
        if (point.category === 'subseason_1_beach_mixed') {
          dataByDate[dateKey].subseason1 = point.rank
          dataByDate[dateKey].subseason1Points = point.points
        } else if (point.category === 'subseason_2_beach_open_women') {
          dataByDate[dateKey].subseason2 = point.rank
          dataByDate[dateKey].subseason2Points = point.points
        } else if (point.category === 'subseason_3_grass_mixed') {
          dataByDate[dateKey].subseason3 = point.rank
          dataByDate[dateKey].subseason3Points = point.points
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
  }, [useDynamicData, teamId, data])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando datos del ranking global...</p>
        </div>
      </div>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
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

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            if (entry.value) {
              return (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-600">Ranking Global:</span>
                  <span className="font-medium">#{entry.value}</span>
                  {showPoints && entry.payload.globalPoints && (
                    <span className="text-gray-500">
                      ({entry.payload.globalPoints.toFixed(1)} pts)
                    </span>
                  )}
                </div>
              )
            }
            return null
          })}
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      {teamName && (
        <div className="mb-4">
          <h4 className="text-lg font-medium text-gray-900">Evolución del Ranking Global</h4>
          <p className="text-sm text-gray-600">Equipo: {teamName}</p>
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="displayDate" 
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            reversed={true}
            domain={['dataMin - 1', 'dataMax + 1']}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {useDynamicData ? (
            // Para datos dinámicos, mostrar las 4 líneas de subtemporadas
            <>
              <Line
                type="monotone"
                dataKey="subupdate1"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                connectNulls={false}
                name="Después Playa Mixto"
              />
              <Line
                type="monotone"
                dataKey="subupdate2"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2 }}
                connectNulls={false}
                name="Después Playa Open/Women"
              />
              <Line
                type="monotone"
                dataKey="subupdate3"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                connectNulls={false}
                name="Después Césped Mixto"
              />
              <Line
                type="monotone"
                dataKey="subupdate4"
                stroke="#F59E0B"
                strokeWidth={3}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#F59E0B', strokeWidth: 2 }}
                connectNulls={false}
                name="Final Temporada"
              />
            </>
          ) : (
            // Para datos estáticos, mostrar todas las líneas de subtemporadas
            <>
              <Line
                type="monotone"
                dataKey="subseason1"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                connectNulls={false}
                name="Playa Mixto"
              />
              <Line
                type="monotone"
                dataKey="subseason2"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2 }}
                connectNulls={false}
                name="Playa Open/Women"
              />
              <Line
                type="monotone"
                dataKey="subseason3"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                connectNulls={false}
                name="Césped Mixto"
              />
              <Line
                type="monotone"
                dataKey="subseason4"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#F59E0B', strokeWidth: 2 }}
                connectNulls={false}
                name="Césped Open/Women"
              />
              <Line
                type="monotone"
                dataKey="finalGlobal"
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
                connectNulls={false}
                name="Ranking Global Final"
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Los rankings se muestran con posición 1 arriba y últimas posiciones abajo</p>
        {useDynamicData ? (
          <p>Datos calculados dinámicamente según subtemporadas jugadas</p>
        ) : (
          <p>Los datos incluyen las 4 subtemporadas más el ranking global final de cada temporada</p>
        )}
      </div>
    </div>
  )
}

export default GeneralRankingChart