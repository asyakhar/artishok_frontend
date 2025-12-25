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
          src={gallery.logoUrl || "https://www.google.com/url?sa=t&source=web&rct=j&url=https%3A%2F%2Fpetersburg24.ru%2Fpost%2Ftop-10-besplatnyh-galerej-v-sankt-peterburge&ved=0CBUQjRxqFwoTCNj3ku_22JEDFQAAAAAdAAAAABAH&opi=89978449"}
          alt={gallery.name}
          className="gallery-logo"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "http://127.0.0.1:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9nYWxsZXJ5L2dhbDAuanBnP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9STI5UzUzWFpISVE1WkdQNDhJSTAlMkYyMDI1MTIyNSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTEyMjVUMTQyOTExWiZYLUFtei1FeHBpcmVzPTQzMjAwJlgtQW16LVNlY3VyaXR5LVRva2VuPWV5SmhiR2NpT2lKSVV6VXhNaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpoWTJObGMzTkxaWGtpT2lKSk1qbFROVE5ZV2toSlVUVmFSMUEwT0VsSk1DSXNJbVY0Y0NJNk1UYzJOamN4TkRVeE15d2ljR0Z5Wlc1MElqb2liV2x1YVc5aFpHMXBiaUo5LmZGQ1hoX1BSNVVJUzZOM3FUczloWWVlQ25OcWdIQTZqMmYzSVdobWZzMEtLN1k4NkdINUM2ckNoR09abXJYQmV5OVBjbk9VN1ktdVZ4cTlGeDNnWWVRJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZ2ZXJzaW9uSWQ9bnVsbCZYLUFtei1TaWduYXR1cmU9NDI1MTQ2MjAzMWFjMGYyOThjY2M3MjhkMTc2NGIwZWEzYjgwNTE1ZWJiOWVmMTM1MTE1ZjM0NGM2Nzc5MjUyZQ";
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