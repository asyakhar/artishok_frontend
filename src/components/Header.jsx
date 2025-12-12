import { useState, useEffect } from 'react';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Главная', href: '#', active: true },
    { label: 'Выставки', href: '#exhibitions' },
    { label: 'Галереи', href: '#galleries' },
    { label: 'Художники', href: '#artists' },
    { label: 'О проекте', href: '#about' },
  ];

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <nav className="navbar">
          <div className="navbar-brand">
            <a href="/" className="logo">
              <span className="logo-icon">🎨</span>
              <span className="logo-text">АРТи<span className="logo-accent">ШОК</span></span>
            </a>
          </div>

          <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
            <ul className="navbar-nav">
              {navItems.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={`nav-link ${item.active ? 'active' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="navbar-actions">
              <a href="/login" className="btn btn-outline btn-sm">
                <i className="fas fa-sign-in-alt"></i> Войти
              </a>
              <a href="/register" className="btn btn-primary btn-sm">
                <i className="fas fa-user-plus"></i> Регистрация
              </a>
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