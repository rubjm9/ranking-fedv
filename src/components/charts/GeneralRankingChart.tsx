import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface SubseasonDataPoint {
  date: string
  season: string
  category: string
  rank: number
  points: number
}

interface GeneralRankingChartProps {
  data: SubseasonDataPoint[]
  teamName?: string
  height?: number
  showPoints?: boolean
}

const GeneralRankingChart: React.FC<GeneralRankingChartProps> = ({ 
  data, 
  teamName, 
  height = 300,
  showPoints = false 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <p>No hay datos históricos disponibles</p>
          <p className="text-sm mt-1">Los datos aparecerán después de ejecutar la simulación de subtemporadas</p>
        </div>
      </div>
    )
  }

  // Procesar datos para el gráfico
  const processedData = React.useMemo(() => {
    // Agrupar por fecha y crear puntos de datos
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
    
    return Object.values(dataByDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [data])

  // Configurar líneas del gráfico
  const lines = [
    {
      key: 'subseason1',
      name: 'Playa Mixto',
      color: '#3B82F6',
      dataKey: 'subseason1'
    },
    {
      key: 'subseason2', 
      name: 'Playa Open/Women',
      color: '#EF4444',
      dataKey: 'subseason2'
    },
    {
      key: 'subseason3',
      name: 'Césped Mixto', 
      color: '#10B981',
      dataKey: 'subseason3'
    },
    {
      key: 'subseason4',
      name: 'Césped Open/Women',
      color: '#F59E0B', 
      dataKey: 'subseason4'
    },
    {
      key: 'finalGlobal',
      name: 'Ranking Global Final',
      color: '#8B5CF6',
      dataKey: 'finalGlobal',
      strokeWidth: 3
    }
  ]

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            if (entry.value) {
              const line = lines.find(l => l.dataKey === entry.dataKey)
              return (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-600">{line?.name}:</span>
                  <span className="font-medium">#{entry.value}</span>
                  {showPoints && entry.payload[`${entry.dataKey}Points`] && (
                    <span className="text-gray-500">
                      ({entry.payload[`${entry.dataKey}Points`].toFixed(1)} pts)
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
          <h4 className="text-lg font-medium text-gray-900">Evolución del Ranking General</h4>
          <p className="text-sm text-gray-600">Equipo: {teamName}</p>
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          <Legend />
          
          {lines.map(line => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={line.strokeWidth || 2}
              dot={{ fill: line.color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: line.color, strokeWidth: 2 }}
              connectNulls={false}
              name={line.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Los rankings se muestran con posición 1 arriba y últimas posiciones abajo</p>
        <p>Los datos incluyen las 4 subtemporadas más el ranking global final de cada temporada</p>
      </div>
    </div>
  )
}

export default GeneralRankingChart
