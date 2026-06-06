import React, { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  className?: string
  fullWidth?: boolean
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  fullWidth = false,
}) => {
  return (
    <div className={fullWidth ? className : `page-container ${className}`}>
      {children}
    </div>
  )
}

export default PageContainer
