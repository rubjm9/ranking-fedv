import React, { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { 
  AlertTriangle, 
  CheckCircle, 
  Database, 
  RefreshCw, 
  Play, 
  Trash2,
  Info,
  Trophy,
  Users,
  Calendar
} from 'lucide-react'
import mockDataService from '@/services/mockDataService'
import rankingService from '@/services/rankingService'
import diagnosticService from '@/services/diagnosticService'
import advancedDiagnosticService from '@/services/advancedDiagnosticService'
import insertionDiagnosticService from '@/services/insertionDiagnosticService'
import migrationService from '@/services/migrationService'
import tournamentSumDiagnosticService from '@/services/tournamentSumDiagnosticService'
import canariasDiagnosticService from '@/services/canariasDiagnosticService'

const DiagnosticPage: React.FC = () => {
  const [isGeneratingData, setIsGeneratingData] = useState(false)
  const [isClearingData, setIsClearingData] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [isTestingCalculation, setIsTestingCalculation] = useState(false)
  const [calculationTestResult, setCalculationTestResult] = useState<any>(null)
  const [isTestingInsertion, setIsTestingInsertion] = useState(false)
  const [insertionTestResult, setInsertionTestResult] = useState<any>(null)
  const [isFixingStructure, setIsFixingStructure] = useState(false)
  const [structureFixResult, setStructureFixResult] = useState<any>(null)
  const [isDiagnosingTournaments, setIsDiagnosingTournaments] = useState(false)
  const [tournamentDiagnosticResult, setTournamentDiagnosticResult] = useState<any>(null)
  const [isDiagnosingCanarias, setIsDiagnosingCanarias] = useState(false)
  const [canariasDiagnosticResult, setCanariasDiagnosticResult] = useState<any>(null)

  // Query para verificar datos existentes
  const { data: dataStatus, refetch: refetchDataStatus } = useQuery({
    queryKey: ['dataStatus'],
    queryFn: mockDataService.checkDataExists,
    staleTime: 30 * 1000 // 30 segundos
  })

  // Query para diagnóstico detallado
  const { data: detailedDiagnostic, refetch: refetchDetailedDiagnostic } = useQuery({
    queryKey: ['detailedDiagnostic'],
    queryFn: diagnosticService.getDataDiagnostic,
    staleTime: 30 * 1000
  })

  // Query para verificar requisitos de ranking
  const { data: rankingRequirements } = useQuery({
    queryKey: ['rankingRequirements'],
    queryFn: diagnosticService.checkRankingRequirements,
    staleTime: 30 * 1000
  })

  // Query para resumen de torneos de playa
  const { data: beachTournamentsSummary } = useQuery({
    queryKey: ['beachTournamentsSummary'],
    queryFn: diagnosticService.getBeachTournamentsSummary,
    staleTime: 30 * 1000
  })

  // Mutation para generar datos de prueba
  const generateDataMutation = useMutation({
    mutationFn: mockDataService.generateMockData,
    onSuccess: () => {
      refetchDataStatus()
    }
  })

  // Mutation para limpiar datos
  const clearDataMutation = useMutation({
    mutationFn: mockDataService.clearMockData,
    onSuccess: () => {
      refetchDataStatus()
    }
  })

  // Mutation para recalcular rankings
  const recalculateMutation = useMutation({
    mutationFn: rankingService.recalculateRankingAlternative
  })

  const handleGenerateData = async () => {
    setIsGeneratingData(true)
    try {
      await generateDataMutation.mutateAsync()
    } finally {
      setIsGeneratingData(false)
    }
  }

  const handleClearData = async () => {
    setIsClearingData(true)
    try {
      await clearDataMutation.mutateAsync()
    } finally {
      setIsClearingData(false)
    }
  }

  const handleRecalculate = async () => {
    setIsRecalculating(true)
    try {
      await recalculateMutation.mutateAsync()
    } finally {
      setIsRecalculating(false)
    }
  }

  const handleTestCalculation = async () => {
    setIsTestingCalculation(true)
    try {
      const result = await advancedDiagnosticService.testRankingCalculation()
      setCalculationTestResult(result)
    } finally {
      setIsTestingCalculation(false)
    }
  }

  const handleTestInsertion = async () => {
    setIsTestingInsertion(true)
    try {
      const result = await insertionDiagnosticService.testRealDataInsertion()
      setInsertionTestResult(result)
      // Refrescar el estado de datos después de la prueba
      refetchDataStatus()
    } finally {
      setIsTestingInsertion(false)
    }
  }

  const handleFixStructure = async () => {
    setIsFixingStructure(true)
    try {
      const result = await migrationService.insertDataWithoutNewColumns()
      setStructureFixResult(result)
      // Refrescar el estado de datos después de la corrección
      refetchDataStatus()
    } finally {
      setIsFixingStructure(false)
    }
  }

  const handleInsertAllRankings = async () => {
    setIsFixingStructure(true)
    try {
      const result = await migrationService.insertDataWithoutNewColumns()
      setStructureFixResult(result)
      // Refrescar el estado de datos después de la corrección
      refetchDataStatus()
    } finally {
      setIsFixingStructure(false)
    }
  }

  const handleDiagnoseCanarias = async () => {
    setIsDiagnosingCanarias(true)
    try {
      const result = await canariasDiagnosticService.diagnoseCanariasTournament()
      setCanariasDiagnosticResult(result)
    } finally {
      setIsDiagnosingCanarias(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Diagnóstico del Sistema</h1>
              <p className="text-gray-600 mt-2">Herramientas para diagnosticar y solucionar problemas del ranking</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Database className="h-4 w-4" />
              <span>Estado de la base de datos</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estado de los datos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Database className="h-5 w-5 mr-2 text-blue-500" />
              Estado de la Base de Datos
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  dataStatus?.hasTeams ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {dataStatus?.hasTeams ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Equipos</h3>
                <p className={`text-sm ${dataStatus?.hasTeams ? 'text-green-600' : 'text-red-600'}`}>
                  {dataStatus?.hasTeams ? 'Datos disponibles' : 'Sin datos'}
                </p>
              </div>
              
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  dataStatus?.hasTournaments ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {dataStatus?.hasTournaments ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Torneos</h3>
                <p className={`text-sm ${dataStatus?.hasTournaments ? 'text-green-600' : 'text-red-600'}`}>
                  {dataStatus?.hasTournaments ? 'Datos disponibles' : 'Sin datos'}
                </p>
              </div>
              
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  dataStatus?.hasPositions ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {dataStatus?.hasPositions ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Posiciones</h3>
                <p className={`text-sm ${dataStatus?.hasPositions ? 'text-green-600' : 'text-red-600'}`}>
                  {dataStatus?.hasPositions ? 'Datos disponibles' : 'Sin datos'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnóstico detallado de datos */}
        {detailedDiagnostic && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Info className="h-5 w-5 mr-2 text-green-500" />
                Diagnóstico Detallado
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Equipos */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Equipos ({detailedDiagnostic.teams.total})</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Con región: {detailedDiagnostic.teams.withRegion}/{detailedDiagnostic.teams.total}
                  </p>
                  <div className="text-xs text-gray-500">
                    <p className="font-medium">Muestra:</p>
                    {detailedDiagnostic.teams.sample.map(team => (
                      <p key={team.id}>• {team.name}</p>
                    ))}
                  </div>
                </div>

                {/* Torneos */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Torneos ({detailedDiagnostic.tournaments.total})</h3>
                  <div className="text-sm text-gray-600 mb-2">
                    <p>Por año: {Object.entries(detailedDiagnostic.tournaments.byYear).map(([year, count]) => 
                      `${year}: ${count}`
                    ).join(', ')}</p>
                    <p>Por superficie: {Object.entries(detailedDiagnostic.tournaments.bySurface).map(([surface, count]) => 
                      `${surface}: ${count}`
                    ).join(', ')}</p>
                    <p>Por modalidad: {Object.entries(detailedDiagnostic.tournaments.byModality).map(([modality, count]) => 
                      `${modality}: ${count}`
                    ).join(', ')}</p>
                  </div>
                </div>

                {/* Posiciones */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Posiciones ({detailedDiagnostic.positions.total})</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Distribuidas en {Object.keys(detailedDiagnostic.positions.byTournament).length} torneos
                  </p>
                </div>

                {/* Rankings actuales */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Rankings Actuales ({detailedDiagnostic.currentRankings.total})</h3>
                  <div className="text-sm text-gray-600">
                    {Object.entries(detailedDiagnostic.currentRankings.byCategory).map(([category, count]) => (
                      <p key={category}>• {category}: {count} equipos</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Torneos de playa específicos */}
        {beachTournamentsSummary && beachTournamentsSummary.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                Torneos de Playa por Año
              </h2>
            </div>
            <div className="p-6">
              {beachTournamentsSummary.map(yearData => (
                <div key={yearData.year} className="mb-4 last:mb-0">
                  <h3 className="font-semibold text-gray-900 mb-2">Año {yearData.year}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {yearData.tournaments.map(tournament => (
                      <div key={tournament.id} className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium text-gray-900">{tournament.name}</p>
                        <p className="text-sm text-gray-600">Modalidad: {tournament.modality}</p>
                        <p className="text-sm text-gray-600">Posiciones: {tournament.positions}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verificación de requisitos */}
        {rankingRequirements && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                Verificación de Requisitos para Rankings
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Estado de Requisitos</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      {rankingRequirements.hasTeams ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <span className="text-sm">Equipos registrados</span>
                    </div>
                    <div className="flex items-center">
                      {rankingRequirements.hasTournaments ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <span className="text-sm">Torneos registrados</span>
                    </div>
                    <div className="flex items-center">
                      {rankingRequirements.hasPositions ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <span className="text-sm">Posiciones registradas</span>
                    </div>
                    <div className="flex items-center">
                      {rankingRequirements.hasBeachTournaments ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <span className="text-sm">Torneos de playa</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Estado General</h3>
                  <div className={`p-4 rounded-lg ${rankingRequirements.canGenerateRankings ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className={`font-semibold ${rankingRequirements.canGenerateRankings ? 'text-green-800' : 'text-red-800'}`}>
                      {rankingRequirements.canGenerateRankings ? '✅ Puede generar rankings' : '❌ No puede generar rankings'}
                    </p>
                    {rankingRequirements.issues.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Problemas detectados:</p>
                        <ul className="text-sm mt-1">
                          {rankingRequirements.issues.map((issue, index) => (
                            <li key={index}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Acciones de diagnóstico */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generar datos de prueba */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Play className="h-5 w-5 mr-2 text-green-500" />
                Generar Datos de Prueba
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-600 mb-4">
                  Genera datos de prueba para probar el sistema de rankings:
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 6 equipos de prueba</li>
                  <li>• 8 torneos (2021-2024) con diferentes superficies y modalidades</li>
                  <li>• Posiciones y puntos para cada torneo</li>
                  <li>• Datos distribuidos en múltiples años para probar pesos temporales</li>
                </ul>
              </div>
              
              <button
                onClick={handleGenerateData}
                disabled={isGeneratingData}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingData ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Generar Datos de Prueba
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Limpiar datos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Trash2 className="h-5 w-5 mr-2 text-red-500" />
                Limpiar Datos de Prueba
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-600 mb-4">
                  Elimina todos los datos de prueba generados:
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Equipos de prueba</li>
                  <li>• Torneos de prueba</li>
                  <li>• Posiciones de prueba</li>
                  <li>• <strong>No afecta datos reales</strong></li>
                </ul>
              </div>
              
              <button
                onClick={handleClearData}
                disabled={isClearingData}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClearingData ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Limpiando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar Datos de Prueba
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Recalcular rankings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
              Recalcular Rankings
            </h3>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-600 mb-4">
                Recalcula todos los rankings usando el nuevo sistema con pesos temporales y coeficientes regionales.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRecalculate}
                disabled={isRecalculating || !dataStatus?.hasPositions}
                className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRecalculating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Recalculando...
                  </>
                ) : (
                  <>
                    <Trophy className="h-4 w-4 mr-2" />
                    Recalcular Rankings
                  </>
                )}
              </button>

              <button
                onClick={handleInsertAllRankings}
                disabled={isFixingStructure || !dataStatus?.hasPositions}
                className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFixingStructure ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Insertando...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Insertar Rankings Corregidos
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Prueba de cálculo paso a paso */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <RefreshCw className="h-5 w-5 mr-2 text-purple-500" />
              Prueba de Cálculo Paso a Paso
            </h3>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-600 mb-4">
                Prueba el cálculo de rankings manualmente para identificar problemas específicos en la estructura de datos o fórmulas.
              </p>
            </div>
            
            <button
              onClick={handleTestCalculation}
              disabled={isTestingCalculation || !dataStatus?.hasPositions}
              className="flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTestingCalculation ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Probando cálculo...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Probar Cálculo Manual
                </>
              )}
            </button>

            {/* Resultados de la prueba */}
            {calculationTestResult && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Resultados de la Prueba:</h4>
                
                {calculationTestResult.success ? (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{calculationTestResult.totalPositions}</div>
                        <div className="text-sm text-gray-600">Posiciones procesadas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{calculationTestResult.totalTeams}</div>
                        <div className="text-sm text-gray-600">Equipos encontrados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{calculationTestResult.categories.length}</div>
                        <div className="text-sm text-gray-600">Categorías detectadas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{calculationTestResult.teamsWithMultipleTournaments || 0}</div>
                        <div className="text-sm text-gray-600">Equipos con múltiples torneos</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Categorías detectadas:</h5>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {calculationTestResult.categories.map((category: string) => (
                          <span key={category} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {category}
                          </span>
                        ))}
                      </div>
                      
                      {/* Información de torneos por categoría */}
                      {calculationTestResult.tournamentsByCategory && (
                        <div>
                          <h6 className="font-medium text-gray-800 mb-2">Torneos por categoría:</h6>
                          {Object.entries(calculationTestResult.tournamentsByCategory).map(([category, tournaments]: [string, any]) => (
                            <div key={category} className="mb-3 p-3 bg-gray-50 rounded">
                              <div className="font-medium text-gray-700 mb-1">
                                {category} ({tournaments.length} torneos)
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                {tournaments.map((tournament: any) => (
                                  <div key={tournament.id}>
                                    • {tournament.name} ({tournament.year}) - {tournament.type}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Rankings calculados:</h5>
                      {Object.entries(calculationTestResult.rankings).map(([category, teams]: [string, any]) => (
                        <div key={category} className="mb-3">
                          <h6 className="font-medium text-gray-700">{category} ({teams.length} equipos)</h6>
                          <div className="ml-4 space-y-1">
                            {teams.slice(0, 3).map((team: any) => (
                              <div key={team.teamId} className="text-sm text-gray-600">
                                {team.rankingPosition}º - Equipo {team.teamId}: {team.totalPoints} puntos
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <p className="font-medium">Error en la prueba:</p>
                    <p className="text-sm">{calculationTestResult.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Prueba de inserción en base de datos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Database className="h-5 w-5 mr-2 text-orange-500" />
              Prueba de Inserción en Base de Datos
            </h3>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-600 mb-4">
                Prueba la inserción de rankings en la tabla <code>current_rankings</code> usando tus datos reales.
                Esto identificará si el problema está en el guardado o en el cálculo.
              </p>
            </div>
            
            <button
              onClick={handleTestInsertion}
              disabled={isTestingInsertion || !dataStatus?.hasPositions}
              className="flex items-center justify-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTestingInsertion ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Probando inserción...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Probar Inserción con Datos Reales
                </>
              )}
            </button>

            {/* Resultados de la prueba de inserción */}
            {insertionTestResult && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Resultados de la Prueba de Inserción:</h4>
                
                {insertionTestResult.success ? (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{insertionTestResult.insertedCount}</div>
                        <div className="text-sm text-gray-600">Entradas insertadas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{insertionTestResult.verificationCount}</div>
                        <div className="text-sm text-gray-600">Entradas verificadas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{insertionTestResult.categories?.length || 0}</div>
                        <div className="text-sm text-gray-600">Categorías procesadas</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Categorías procesadas:</h5>
                      <div className="flex flex-wrap gap-2">
                        {insertionTestResult.categories?.map((category: string) => (
                          <span key={category} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-green-800 font-medium">✅ Inserción exitosa</p>
                      <p className="text-green-700 text-sm">
                        Los rankings se han guardado correctamente en la base de datos. 
                        Ahora deberías poder verlos en la página de rankings.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <p className="font-medium">❌ Error en la inserción:</p>
                    <p className="text-sm">{insertionTestResult.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Corrección de estructura de base de datos */}
        {insertionTestResult && !insertionTestResult.success && insertionTestResult.error?.includes('regional_coefficient') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                Corrección de Estructura de Base de Datos
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="p-4 bg-red-50 rounded-lg mb-4">
                  <p className="text-red-800 font-medium">⚠️ Problema Detectado</p>
                  <p className="text-red-700 text-sm mt-1">
                    La tabla <code>current_rankings</code> no tiene las columnas necesarias para el nuevo sistema de rankings.
                    Falta la columna <code>regional_coefficient</code>.
                  </p>
                </div>
                
                <p className="text-gray-600 mb-4">
                  <strong>Solución temporal:</strong> Insertar los rankings sin las columnas nuevas para que puedas ver los resultados inmediatamente.
                  Más tarde podrás actualizar la estructura de la base de datos.
                </p>
              </div>
              
              <button
                onClick={handleFixStructure}
                disabled={isFixingStructure}
                className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFixingStructure ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Corrigiendo estructura...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Corregir Estructura Temporalmente
                  </>
                )}
              </button>

              {/* Resultados de la corrección */}
              {structureFixResult && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Resultados de la Corrección:</h4>
                  
                  {structureFixResult.success ? (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{structureFixResult.insertedCount}</div>
                          <div className="text-sm text-gray-600">Rankings insertados</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{structureFixResult.categories?.length || 0}</div>
                          <div className="text-sm text-gray-600">Categorías procesadas</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Categorías procesadas:</h5>
                        <div className="flex flex-wrap gap-2">
                          {structureFixResult.categories?.map((category: string) => (
                            <span key={category} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-green-800 font-medium">✅ Corrección exitosa</p>
                        <p className="text-green-700 text-sm">
                          Los rankings se han insertado correctamente. Ahora deberías poder verlos en la página de rankings.
                          <br />
                          <strong>Nota:</strong> Los coeficientes regionales no se aplicaron debido a la estructura de la BD.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-600">
                      <p className="font-medium">❌ Error en la corrección:</p>
                      <p className="text-sm">{structureFixResult.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diagnóstico específico de Canarias */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Diagnóstico: Torneo Regional de Canarias
            </h3>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-600 mb-4">
                Diagnosticar por qué falta el torneo regional de Canarias en <code>beach_mixed</code>.
                Debería haber 7 torneos en <code>beach_mixed</code> (6 actuales + Canarias).
              </p>
            </div>
            
            <button
              onClick={handleDiagnoseCanarias}
              disabled={isDiagnosingCanarias}
              className="flex items-center justify-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDiagnosingCanarias ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Diagnosticando...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Diagnosticar Torneo de Canarias
                </>
              )}
            </button>

            {/* Resultados del diagnóstico de Canarias */}
            {canariasDiagnosticResult && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Resultados del Diagnóstico:</h4>
                
                {canariasDiagnosticResult.success ? (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{canariasDiagnosticResult.canariasTournaments.length}</div>
                        <div className="text-sm text-gray-600">Torneos de Canarias</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{canariasDiagnosticResult.canariasBeachMixed.length}</div>
                        <div className="text-sm text-gray-600">Playa Mixto Canarias</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{canariasDiagnosticResult.canariasBeachMixedPositions.length}</div>
                        <div className="text-sm text-gray-600">Posiciones Canarias</div>
                      </div>
                    </div>

                    {/* Lista de torneos de Canarias */}
                    {canariasDiagnosticResult.canariasTournaments.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Torneos de Canarias encontrados:</h5>
                        <div className="space-y-2">
                          {canariasDiagnosticResult.canariasTournaments.map((tournament: any) => (
                            <div key={tournament.id} className="p-3 bg-blue-50 rounded">
                              <div className="font-medium text-blue-900">{tournament.name}</div>
                              <div className="text-sm text-blue-700">
                                {tournament.surface} - {tournament.modality} - {tournament.type} ({tournament.year})
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lista de todos los torneos de playa mixto */}
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Todos los torneos de playa mixto ({canariasDiagnosticResult.beachMixedTournaments.length}):</h5>
                      <div className="space-y-1">
                        {canariasDiagnosticResult.allTournamentNames.map((name: string, index: number) => (
                          <div key={index} className="text-sm text-gray-600">
                            {index + 1}. "{name}"
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Posibles torneos de Canarias */}
                    {canariasDiagnosticResult.possibleCanariasTournaments.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Posibles torneos de Canarias (variaciones):</h5>
                        <div className="space-y-2">
                          {canariasDiagnosticResult.possibleCanariasTournaments.map((tournament: any) => (
                            <div key={tournament.id} className="p-3 bg-yellow-50 rounded">
                              <div className="font-medium text-yellow-900">{tournament.name}</div>
                              <div className="text-sm text-yellow-700">
                                {tournament.surface} - {tournament.modality} - {tournament.type} ({tournament.year})
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Posiciones de Canarias */}
                    {canariasDiagnosticResult.canariasBeachMixedPositions.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Posiciones de playa mixto de Canarias:</h5>
                        <div className="text-sm text-gray-600">
                          {canariasDiagnosticResult.canariasBeachMixedPositions.length} posiciones encontradas
                        </div>
                      </div>
                    )}

                    {/* Conclusión */}
                    <div className="mt-4 p-3 bg-gray-100 rounded">
                      <p className="text-sm text-gray-700">
                        <strong>Conclusión:</strong> {
                          canariasDiagnosticResult.canariasBeachMixed.length > 0 
                            ? `Se encontraron ${canariasDiagnosticResult.canariasBeachMixed.length} torneo(s) de playa mixto de Canarias.`
                            : 'No se encontraron torneos de playa mixto de Canarias en la base de datos.'
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <p className="font-medium">❌ Error en el diagnóstico:</p>
                    <p className="text-sm">{canariasDiagnosticResult.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-lg font-semibold text-blue-900 mb-2">¿Por qué no veo resultados?</h4>
              <p className="text-blue-800 mb-3">
                El nuevo sistema de rankings necesita datos de múltiples años para funcionar correctamente. 
                Si no tienes datos reales aún, puedes usar los datos de prueba para ver cómo funciona el sistema.
              </p>
              <div className="text-sm text-blue-700">
                <p><strong>Pasos recomendados:</strong></p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Genera datos de prueba usando el botón de arriba</li>
                  <li>Recalcula los rankings con el nuevo sistema</li>
                  <li>Ve a la página de rankings para ver los resultados</li>
                  <li>Prueba las diferentes categorías (playa/césped × open/women/mixed)</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiagnosticPage
