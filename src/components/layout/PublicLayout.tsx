import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import SkipLink from './SkipLink'

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SkipLink />
      <Navbar />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default PublicLayout
