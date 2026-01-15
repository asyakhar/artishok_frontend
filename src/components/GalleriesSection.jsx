import GalleryCard from "./GalleryCard";
import "./GalleriesSection.css";

const GalleriesSection = ({ galleries, loading }) => {
  const approvedGalleries = galleries.filter(
    (gallery) => gallery.status === "APPROVED"
  );

  if (loading) {
    return (
      <section id="galleries" className="section galleries-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Популярные галереи</h2>
            <p className="section-subtitle">
              Лучшие площадки для выставок современного искусства
            </p>
          </div>
          <div className="loading-state">
            <div className="spinner">
              <i className="fas fa-palette fa-spin"></i>
            </div>
            <p>Загружаем галереи...</p>
          </div>
        </div>
      </section>
    );
  }

  if (approvedGalleries.length === 0) {
    return (
      <section id="galleries" className="section galleries-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Популярные галереи</h2>
            <p className="section-subtitle">
              Лучшие площадки для выставок современного искусства
            </p>
          </div>
          <div className="no-galleries-message">
            <p>На данный момент нет доступных галерей.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="galleries" className="section galleries-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Популярные галереи</h2>
          <p className="section-subtitle">
            Лучшие площадки для выставок современного искусства
          </p>
        </div>

        <div className="galleries-grid">
          {approvedGalleries.map((gallery, index) => (
            <GalleryCard key={index} gallery={gallery} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default GalleriesSection;
