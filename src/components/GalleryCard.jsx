import './GalleryCard.css';

const GalleryCard = ({ gallery }) => {
  // Функция для получения цвета статуса
  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'var(--status-approved, #10b981)';
      case 'PENDING': return 'var(--status-pending, #f59e0b)';
      case 'REJECTED': return 'var(--status-rejected, #ef4444)';
      default: return 'var(--status-default, #6b7280)';
    }
  };

  // Функция для получения текста статуса на русском
  const getStatusText = (status) => {
    switch (status) {
      case 'APPROVED': return 'Одобрена';
      case 'PENDING': return 'На рассмотрении';
      case 'REJECTED': return 'Отклонена';
      default: return status;
    }
  };

  // Функция для форматирования телефона
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    return phone.replace(/^(\+\d)(\d{3})(\d{3})(\d{2})(\d{2})$/, '$1 ($2) $3-$4-$5');
  };

  return (
    <div className="gallery-card">
      <div className="gallery-image-container">
        <img 
          src={gallery.logo_url || "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"} 
          alt={gallery.name} 
          className="gallery-logo"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";
          }}
        />
        <div 
          className="gallery-status-badge"
          style={{ backgroundColor: getStatusColor(gallery.status) }}
        >
          {getStatusText(gallery.status)}
        </div>
      </div>
      
      <div className="gallery-content">
        <div className="gallery-header">
          <h3 className="gallery-title">{gallery.name || "Название галереи"}</h3>
          {gallery.admin_comment && (
            <div className="gallery-admin-comment" title="Комментарий администратора">
              <i className="comment-icon">💬</i>
            </div>
          )}
        </div>
        
        <p className="gallery-description">
          {gallery.description || "Описание галереи отсутствует"}
        </p>
        
        <div className="gallery-info-section">
          <div className="gallery-info-item">
            <i className="info-icon">📍</i>
            <span className="info-text">{gallery.address || "Адрес не указан"}</span>
          </div>
          
          {gallery.contact_phone && (
            <div className="gallery-info-item">
              <i className="info-icon">📞</i>
              <a href={`tel:${gallery.contact_phone}`} className="info-link">
                {formatPhoneNumber(gallery.contact_phone)}
              </a>
            </div>
          )}
          
          {gallery.contact_email && (
            <div className="gallery-info-item">
              <i className="info-icon">✉️</i>
              <a href={`mailto:${gallery.contact_email}`} className="info-link">
                {gallery.contact_email}
              </a>
            </div>
          )}
        </div>
        
        {gallery.admin_comment && (
          <div className="gallery-admin-note">
            <strong>Примечание администратора:</strong>
            <p>{gallery.admin_comment}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryCard;