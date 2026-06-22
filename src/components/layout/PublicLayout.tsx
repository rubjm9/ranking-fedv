import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import SkipLink from './SkipLink'

const PublicLayout: React.FC = () => {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div className="min-h-screen flex flex-col">
      <SkipLink />
      <Navbar />
      <main
        id="main-content"
        className={`flex-1 ${isHome ? '' : 'pt-[4.75rem]'}`}
        tabIndex={-1}
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default PublicLayout
