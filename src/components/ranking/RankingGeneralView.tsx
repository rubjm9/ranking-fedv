import React from 'react'

export interface RankingGeneralViewProps {
  renderView: () => React.ReactNode
}

const RankingGeneralView: React.FC<RankingGeneralViewProps> = ({ renderView }) => {
  return <>{renderView()}</>
}

export default RankingGeneralView
