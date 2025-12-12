import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import Hero from './components/Hero'
import ExhibitionsSection from './components/ExhibitionsSection'
import GalleriesSection from './components/GalleriesSection'
import CTASection from './components/CTASection'
import Footer from './components/Footer'

function App() {
  const [events, setEvents] = useState([])
  const [galleries, setGalleries] = useState([])
  const [loading, setLoading] = useState({ 
    events: true, 
    galleries: true 
  })
  const [error, setError] = useState({ 
    events: null, 
    galleries: null 
  })

  useEffect(() => {
    // Загрузка выставок с вашего сервера
    const loadExhibitions = async () => {
      try {
        setLoading(prev => ({ ...prev, events: true }))
        const response = await fetch('http://localhost:8080/exhibition-events')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Сортируем по дате, чтобы ближайшие были первыми
        const sortedEvents = data
          .filter(event => event.startDate) // Фильтруем события без даты
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
          .slice(0, 6) // Берем только 6 ближайших
        
        setEvents(sortedEvents)
        setError(prev => ({ ...prev, events: null }))
      } catch (err) {
        console.error('Ошибка загрузки выставок:', err)
        setError(prev => ({ 
          ...prev, 
          events: 'Не удалось загрузить выставки. Пожалуйста, попробуйте позже.' 
        }))
        setEvents([])
      } finally {
        setLoading(prev => ({ ...prev, events: false }))
      }
    }

    // Загрузка галерей с вашего сервера
    const loadGalleries = async () => {
      try {
        setLoading(prev => ({ ...prev, galleries: true }))
        const response = await fetch('http://localhost:8080/galleries')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        setGalleries(data.slice(0, 4)) // Берем только 4 галереи для главной
        setError(prev => ({ ...prev, galleries: null }))
      } catch (err) {
        console.error('Ошибка загрузки галерей:', err)
        setError(prev => ({ 
          ...prev, 
          galleries: 'Не удалось загрузить галереи. Пожалуйста, попробуйте позже.' 
        }))
        setGalleries([])
      } finally {
        setLoading(prev => ({ ...prev, galleries: false }))
      }
    }

    loadExhibitions()
    loadGalleries()
  }, [])

  return (
    <div className="App">
      <Header />
      <Hero />
      <ExhibitionsSection 
        events={events} 
        loading={loading.events} 
        error={error.events}
      />
      <GalleriesSection 
        galleries={galleries} 
        loading={loading.galleries}
        error={error.galleries}
      />
      <CTASection />
      <Footer />
    </div>
  )
}

export default App