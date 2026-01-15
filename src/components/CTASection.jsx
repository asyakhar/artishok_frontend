import "./CTASection.css";

const CTASection = () => {
  return (
    <section className="section cta-section">
      <div className="container">
        <div className="cta-card">
          <div className="cta-content">
            <h2 className="cta-title">Хотите организовать выставку?</h2>
            <p className="cta-text">
              Зарегистрируйте свою галерею на платформе и начните привлекать
              художников и посетителей уже сегодня.
            </p>
            <div className="cta-actions">
              <a href="/register-gallery" className="btn btn-primary btn-lg">
                <i className="fas fa-store"></i> Добавить галерею
              </a>
            </div>
          </div>
          <div className="cta-image">
            <img
              src="/images/cta/cta-art.jpg"
              alt="Организация выставки"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://images.unsplash.com/photo-1563089145-599997674d42?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
