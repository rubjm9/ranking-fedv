import React from 'react'

export interface RankingCategoryViewProps {
  renderView: () => React.ReactNode
}

const RankingCategoryView: React.FC<RankingCategoryViewProps> = ({ renderView }) => {
  return <>{renderView()}</>
}

export default RankingCategoryView
