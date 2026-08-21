import React from 'react'
import { Link } from 'react-router-dom'
import { Disc3, Trophy } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'

const DiscGolfPage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Disc golf"
        subtitle="Espacio reservado para los clubes y el ranking de la modalidad de disc golf en el Ranking FEDV."
      />

      <div className="card">
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="mb-4 p-4 bg-brand-subtle rounded-2xl">
            <Disc3 className="h-8 w-8 text-primary-400" aria-hidden />
          </div>
          <h2 className="font-display text-xl font-semibold text-content mb-2">
            Próximamente
          </h2>
          <p className="text-content-muted max-w-lg mb-8">
            Pronto estarán disponibles aquí los resultados de los campeonatos de España de
            disc golf. Mientras tanto, puedes consultar el ranking de Ultimate Frisbee.
          </p>
          <Link
            to="/ranking"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <Trophy className="h-4 w-4" aria-hidden />
            Ver ranking de Ultimate
          </Link>
        </div>
      </div>
    </PageContainer>
  )
}

export default DiscGolfPage
