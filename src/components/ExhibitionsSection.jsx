import { useState } from 'react';
import ExhibitionCard from './ExhibitionCard';
import './ExhibitionsSection.css';
import { Link } from 'react-router-dom';

const ExhibitionsSection = ({ events, loading }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(6);

  const filters = [
    { id: 'all', label: 'Все' },
    { id: 'current', label: 'Сейчас идут' },
    { id: 'upcoming', label: 'Скоро' },
    { id: 'featured', label: 'Рекомендуем' },
  ];

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 3);
  };

  const displayedEvents = events.slice(0, visibleCount);

  if (loading) {
    return (
      <section id="exhibitions" className="section exhibitions-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Текущие выставки</h2>
            <p className="section-subtitle">
              Откройте для себя искусство в лучших галереях города
            </p>
          </div>
          <div className="loading-state">
            <div className="spinner">
              <i className="fas fa-palette"></i>
            </div>
            <p>Загружаем выставки...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="exhibitions" className="section exhibitions-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Текущие выставки</h2>
          <p className="section-subtitle">
            Откройте для себя искусство в лучших галереях города
          </p>
          <Link to="/exhibition-events" className="section-link">
  Все выставки <i className="fas fa-arrow-right"></i>
</Link>
        </div>

        {/* Простые фильтры */}
        <div className="exhibitions-filters">
          {filters.map(filter => (
            <button
              key={filter.id}
              className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
              {filter.id === 'all' && ` (${events.length})`}
            </button>
          ))}
        </div>

        {/* Карточки выставок */}
        {displayedEvents.length > 0 ? (
          <>
            <div className="exhibitions-grid">
              {displayedEvents.map((event, index) => (
                <ExhibitionCard key={index} event={event} />
              ))}
            </div>

            {/* Кнопка "Показать еще" */}
            {events.length > visibleCount && (
              <div className="load-more-container">
                <button className="btn btn-outline" onClick={handleLoadMore}>
                  <i className="fas fa-plus"></i> Показать еще
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-results">
            <i className="fas fa-search"></i>
            <h3>Выставки не найдены</h3>
            <p>Попробуйте изменить параметры фильтрации</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ExhibitionsSection;