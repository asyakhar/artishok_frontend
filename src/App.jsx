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
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ExhibitionMapPage from './pages/ExhibitionMapPage'
import GalleryOwnerDashboard from './pages/GalleryOwnerDashboard';
import AdminDashboard from './pages/AdminDashBoard';
import AllExhibitionsPage from './pages/AllExhibitionsPage';
import { AuthProvider } from './contexts/AuthContext';
import MapEditor from './components/MapEditor';

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

    </>
  )
}

// Layout компонент для страниц с Header и Footer
const Layout = ({ children, showFooter = true }) => {
  return (
    <>
      <Header />
      <main className="main-content">
        {children}
      </main>
      {showFooter && <Footer />}
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
    // Загрузка выставок с вашего сервера (БЕЗ /api/)
    const loadExhibitions = async () => {
      try {
        setLoading(prev => ({ ...prev, events: true }))
        const response = await fetch('http://localhost:8080/exhibition-events') // ОРИГИНАЛЬНЫЙ URL

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        // Сортируем по дате, чтобы ближайшие были первыми
        const sortedEvents = data
          .filter(event => event.startDate)
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
          .slice(0, 6)

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

    // Загрузка галерей с вашего сервера (БЕЗ /api/)
    const loadGalleries = async () => {
      try {
        setLoading(prev => ({ ...prev, galleries: true }))
        const response = await fetch('http://localhost:8080/galleries') // ОРИГИНАЛЬНЫЙ URL

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('logo_url значение:', data[0].logo_url);
        // setGalleries(data.slice(0, 4))
        setGalleries(data)
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
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Главная страница */}
            <Route path="/" element={
              <Layout showFooter={true}>
                <HomePage
                  events={events}
                  galleries={galleries}
                  loading={loading}
                  error={error}
                />
              </Layout>
            } />

            {/* Страница входа */}
            <Route path="/login" element={
              <Layout showFooter={false}>
                <LoginPage />
              </Layout>
            } />

            {/* Страница регистрации */}
            <Route path="/register" element={
              <Layout showFooter={false}>
                <RegisterPage />
              </Layout>
            } />

            {/* ========== НОВЫЙ МАРШРУТ ДЛЯ КАРТЫ ========== */}
            <Route path="/exhibition/:exhibitionId/map" element={
              <Layout showFooter={false}>
                <ExhibitionMapPage />
              </Layout>
            } />

            {/* Альтернативный путь */}
            <Route path="/map/:exhibitionId" element={
              <Layout showFooter={false}>
                <ExhibitionMapPage />
              </Layout>
            } />

            {/* Личный кабинет художника */}
            <Route path="/artist/dashboard" element={
              <Layout showFooter={false}>
                <ProtectedRoute allowedRoles={['ARTIST']}>
                  <ArtistDashboard />
                </ProtectedRoute>
              </Layout>
            } />

            {/* Кабинет владельца галереи */}
            <Route path="/gallery/dashboard" element={
              <Layout showFooter={false}>
                <ProtectedRoute allowedRoles={['GALLERY_OWNER']}>
                  <GalleryOwnerDashboard />
                </ProtectedRoute>
              </Layout>
            } />

            {/* Админ-панель */}
            <Route path="/admin/dashboard" element={
              <Layout showFooter={false}>
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/exhibition-events" element={
              <Layout showFooter={true}>
                <AllExhibitionsPage />
              </Layout>
            } />
            {/* Автоматический редирект на дашборд */}
            <Route path="/dashboard" element={
              <Layout showFooter={false}>
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              </Layout>
            } />

            {/* 404 страница */}
            <Route path="*" element={
              <Layout showFooter={true}>
                <div style={{ padding: '50px', textAlign: 'center' }}>
                  <h1>404 - Страница не найдена</h1>
                  <p>Запрашиваемая страница не существует.</p>
                </div>
              </Layout>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
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