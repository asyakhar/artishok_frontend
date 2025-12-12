import './Footer.css';

const Footer = () => {
  const platformLinks = [
    { text: 'О проекте', href: '#about' },
    { text: 'Возможности', href: '#features' },
    { text: 'Тарифы', href: '#pricing' },
    { text: 'Блог', href: '#blog' }
  ];

  const artistsLinks = [
    { text: 'Каталог художников', href: '#artists' },
    { text: 'Как выставляться', href: '#how-to-exhibit' },
    { text: 'Портфолио', href: '#portfolio' },
    { text: 'Гранты', href: '#grants' }
  ];

  const galleriesLinks = [
    { text: 'Каталог галерей', href: '#galleries' },
    { text: 'Организация выставок', href: '#organize' },
    { text: 'Продвижение', href: '#promotion' },
    { text: 'Аналитика', href: '#analytics' }
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <a href="/" className="logo">
              <span className="logo-icon">🎨</span>
              <span className="logo-text">
                <span style={{ color: 'white' }}>АРТи</span>
                <span style={{ color: '#E63946' }}>ШОК</span>
              </span>
            </a>
            <p className="footer-description">
              Платформа для организации выставок современного искусства.
              Соединяем творцов и пространства.
            </p>
            <div className="social-links">
              <a href="#" className="social-link"><i className="fab fa-vk"></i></a>
              <a href="#" className="social-link"><i className="fab fa-telegram"></i></a>
              <a href="#" className="social-link"><i className="fab fa-instagram"></i></a>
              <a href="#" className="social-link"><i className="fab fa-youtube"></i></a>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h3 className="footer-title">Платформа</h3>
              <ul>
                {platformLinks.map((link, index) => (
                  <li key={index}>
                    <a href={link.href}>{link.text}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="footer-title">Для художников</h3>
              <ul>
                {artistsLinks.map((link, index) => (
                  <li key={index}>
                    <a href={link.href}>{link.text}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="footer-title">Для галерей</h3>
              <ul>
                {galleriesLinks.map((link, index) => (
                  <li key={index}>
                    <a href={link.href}>{link.text}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="footer-title">Контакты</h3>
              <ul>
                <li><a href="mailto:info@artishok.ru">info@artishok.ru</a></li>
                <li><a href="tel:+78001234567">8 (800) 123-45-67</a></li>
                <li>Санкт-Петербург,</li>
                <li>ул. Искусств, 10</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">© {new Date().getFullYear()} АРТиШОК. Все права защищены.</p>
          <div className="footer-legal">
            <a href="#privacy">Политика конфиденциальности</a>
            <a href="#terms">Пользовательское соглашение</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;