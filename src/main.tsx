import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'

// Crear cliente de React Query con configuración optimizada
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // 10 minutos - datos de ranking cambian poco
      gcTime: 30 * 60 * 1000, // 30 minutos en garbage collection
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            /* Los tokens se resuelven en el portal, que vive dentro de <html>,
               así que el aviso sigue al tema sin necesidad de JavaScript.
               Antes salía gris oscuro sobre página clara y casi invisible
               sobre fondo oscuro. */
            style: {
              background: 'rgb(var(--color-surface-raised))',
              color: 'rgb(var(--color-content))',
              border: '1px solid rgb(var(--color-line))',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: 'rgb(var(--color-surface-raised))',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: 'rgb(var(--color-surface-raised))',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
