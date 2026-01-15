import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

const API_BASE_URL = 'http://localhost:8080';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    checkAuth();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkAuth = async () => {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      setUserData(null);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const user = await response.json();
        setUserData(user);
        sessionStorage.setItem('user', JSON.stringify(user));
        setError('');
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const handleAuthStateChanged = () => {
      checkAuth();
    };

    window.addEventListener('authStateChanged', handleAuthStateChanged);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChanged);
    };
  }, []);


  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'authToken' || e.key === 'user') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = async () => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Ошибка при выходе:', error);
      }
    }

    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');



    window.dispatchEvent(new CustomEvent('authStateChanged'));

    setUserData(null);
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!userData) return '/login';

    switch (userData.role) {
      case 'ADMIN': return '/admin/dashboard';
      case 'GALLERY_OWNER': return '/gallery/dashboard';
      case 'ARTIST': return '/artist/dashboard';
      default: return '/dashboard';
    }
  };

  const getDashboardLabel = () => {
    if (!userData) return 'Личный кабинет';

    switch (userData.role) {
      case 'ADMIN': return 'Админ-панель';
      case 'GALLERY_OWNER': return 'Кабинет галереи';
      case 'ARTIST': return 'Кабинет художника';
      default: return 'Личный кабинет';
    }
  };


  const navItems = [
    { label: 'Главная', href: '/', active: true },
  ];

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <nav className="navbar">
          <div className="navbar-brand">
            <Link to="/" className="logo" onClick={() => setIsMenuOpen(false)}>
              <span className="logo-icon">🎨</span>
              <span className="logo-text">АРТи<span className="logo-accent">ШОК</span></span>
            </Link>
          </div>

          <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
            <ul className="navbar-nav">
              {navItems.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className={`nav-link ${item.active ? 'active' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="navbar-actions">
              {loading ? (
                <span className="loading-text">Загрузка...</span>
              ) : userData ? (
                <>
                  <Link
                    to={getDashboardPath()}
                    className="btn btn-outline btn-sm btn-dashboard"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="user-name">{userData.fullName || getDashboardLabel()}</span>
                  </Link>

                  <button
                    className="btn btn-outline btn-sm"
                    onClick={handleLogout}
                  >
                    <i className="fas fa-sign-out-alt"></i> Выйти
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn btn-outline btn-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <i className="fas fa-sign-in-alt"></i> Войти
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-outline btn-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <i className="fas fa-user-plus"></i> Регистрация
                  </Link>
                </>
              )}
            </div>
          </div>

          <button
            className="navbar-toggler"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Меню"
          >
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </nav>
      </div>

    </header>
  );
};

export default Header;