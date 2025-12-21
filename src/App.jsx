import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import Hero from './components/Hero'
import ExhibitionsSection from './components/ExhibitionsSection'
import GalleriesSection from './components/GalleriesSection'
import CTASection from './components/CTASection'
import Footer from './components/Footer'
import ArtistDashboard from './pages/ArtistDashboard'
// import LoginPage from './pages/LoginPage' // Создайте эту страницу
// import RegisterPage from './pages/RegisterPage' // Создайте эту страницу

// Компонент ProtectedRoute для защиты маршрутов
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const token = localStorage.getItem('authToken')

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

// Компонент для главной страницы (остальной контент)
const HomePage = ({ events, galleries, loading, error }) => {
  return (
    <>
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
    </>
  )
}

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
    <Router>
      <div className="App">
        {/* Header отображается на всех страницах */}
        <Header />

        <Routes>
          {/* Главная страница */}
          <Route path="/" element={
            <HomePage
              events={events}
              galleries={galleries}
              loading={loading}
              error={error}
            />
          } />

          {/* Страница входа */}
          {/* <Route path="/login" element={<LoginPage />} /> */}

          {/* Страница регистрации */}
          {/* <Route path="/register" element={<RegisterPage />} /> */}

          {/* Личный кабинет художника (только для ARTIST) */}
          <Route path="/artist/dashboard" element={
            <ProtectedRoute allowedRoles={['ARTIST']}>
              <ArtistDashboard />
            </ProtectedRoute>
          } />

          {/* Другие защищенные маршруты можно добавить позже */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <div>Админ-панель (в разработке)</div>
            </ProtectedRoute>
          } />

          <Route path="/gallery/dashboard" element={
            <ProtectedRoute allowedRoles={['GALLERY_OWNER']}>
              <div>Кабинет галереи (в разработке)</div>
            </ProtectedRoute>
          } />

          {/* Роут для всех других дашбордов */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } />

          {/* 404 страница */}
          <Route path="*" element={
            <div style={{ padding: '50px', textAlign: 'center' }}>
              <h1>404 - Страница не найдена</h1>
              <p>Запрашиваемая страница не существует.</p>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  )
}

// Компонент для редиректа на правильный дашборд
function DashboardRedirect() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  if (!user) {
    return <Navigate to="/login" replace />
  }

  switch (user.role) {
    case 'ADMIN':
      return <Navigate to="/admin/dashboard" replace />
    case 'GALLERY_OWNER':
      return <Navigate to="/gallery/dashboard" replace />
    case 'ARTIST':
      return <Navigate to="/artist/dashboard" replace />
    default:
      return <Navigate to="/" replace />
  }
}

export default App