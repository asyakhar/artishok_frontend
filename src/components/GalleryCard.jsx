import './GalleryCard.css';

const GalleryCard = ({ gallery }) => {
  return (
    <div className="gallery-card">
      <div className="gallery-image">
        <img 
          src={gallery.image || "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"} 
          alt={gallery.name} 
        />
      </div>
      
      <div className="gallery-content">
        <div className="gallery-header">
          <h3 className="gallery-title">{gallery.name || "Название галереи"}</h3>
          <span className="gallery-rating">
            <i className="fas fa-star"></i> {gallery.rating || "4.8"}
          </span>
        </div>
        
        <p className="gallery-description">
          {gallery.description || "Современная галерея искусства..."}
        </p>
        
        <div className="gallery-details">
          <div className="detail-item">
            <i className="fas fa-map-marker-alt"></i>
            <span>{gallery.location || "Москва, ул. Искусств, 10"}</span>
          </div>
          <div className="detail-item">
            <i className="fas fa-calendar-alt"></i>
            <span>{gallery.exhibitionsCount || 5} выставок</span>
          </div>
        </div>
        
        <button className="btn btn-outline btn-block">
          <i className="fas fa-eye"></i> Смотреть галерею
        </button>
      </div>
    </div>
  );
};

export default GalleryCard;