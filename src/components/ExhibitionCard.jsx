import './ExhibitionCard.css';

const ExhibitionCard = ({ event }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'current':
        return { bg: '#10b981', text: 'Сейчас идёт' };
      case 'upcoming':
        return { bg: '#3b82f6', text: 'Скоро' };
      case 'featured':
        return { bg: '#f59e0b', text: 'Рекомендуем' };
      default:
        return { bg: '#6b7280', text: 'Завершена' };
    }
  };

  const status = getStatusColor('current');

  return (
    <div className="exhibition-card">
      <div className="card-header">
        <div className="card-image">
          <img 
            src={event.image || "https://images.unsplash.com/photo-1544473242-8d2bbed61d3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} 
            alt={event.title} 
            loading="lazy"
          />
          <div className="card-overlay"></div>
          <span className="card-status" style={{ backgroundColor: status.bg }}>
            {status.text}
          </span>
          <button className="card-favorite-btn" aria-label="Добавить в избранное">
            <i className="far fa-heart"></i>
          </button>
        </div>
        
        <div className="card-category">
          <i className="fas fa-paint-brush"></i>
          <span>{event.category || "Современное искусство"}</span>
        </div>
      </div>
      
      <div className="card-body">
        <div className="card-title-section">
          <h3 className="card-title">{event.title || "Название выставки"}</h3>
          <div className="card-rating">
            <i className="fas fa-star"></i>
            <span>4.8</span>
          </div>
        </div>
        
        <p className="card-description">
          {event.description || "Краткое описание выставки современного искусства, которое рассказывает о концепции, художниках и особенностях экспозиции."}
        </p>
        
        <div className="card-details">
          <div className="detail-item">
            <div className="detail-icon">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className="detail-content">
              <span className="detail-label">Дата</span>
              <span className="detail-value">{event.date ? formatDate(event.date) : "Дата не указана"}</span>
            </div>
          </div>
          
          <div className="detail-item">
            <div className="detail-icon">
              <i className="fas fa-map-marker-alt"></i>
            </div>
            <div className="detail-content">
              <span className="detail-label">Место</span>
              <span className="detail-value">{event.location || "Галерея АРТиШОК"}</span>
            </div>
          </div>
          
         
          
          
        </div>
      </div>
      
      <div className="card-footer">
        
        
        <div className="card-actions">
          <button className="btn btn-outline btn-sm">
            <i className="fas fa-info-circle"></i>
            <span className="action-text">Подробнее</span>
          </button>
          <button className="btn btn-outline btn-sm">
            <i className="fas fa-ticket-alt"></i>
            <span className="action-text">Бронировать</span>
          </button>
        </div>
      </div>
      
     
    </div>
  );
};

export default ExhibitionCard;