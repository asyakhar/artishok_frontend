import './Footer.css';

const Footer = () => {
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
          </div>

          <div className="footer-links">


            <div className="footer-column">
              <h3 className="footer-title">Контакты</h3>
              <ul>
                <li><a href="mailto:info@artishok.ru">info@artishok.ru</a></li>
                <li><a href="tel:+78001234567">8 (800) 123-45-67</a></li>
                <li>Санкт-Петербург,</li>
                <li>Кронверкский пр., 49</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">© {new Date().getFullYear()} АРТиШОК. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;