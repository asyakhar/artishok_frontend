import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ExhibitionCard from '../components/ExhibitionCard';
import './AllExhibitionsPage.css';

const AllExhibitionsPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const navigate = useNavigate();

  // Фильтры
  const filters = [
    { id: 'all', label: 'Все выставки', icon: 'fas fa-th-large' },
    { id: 'current', label: 'Идут сейчас', icon: 'fas fa-play-circle' },
    { id: 'upcoming', label: 'Скоро', icon: 'fas fa-calendar-plus' },
    { id: 'past', label: 'Прошедшие', icon: 'fas fa-history' },
    { id: 'featured', label: 'Рекомендуем', icon: 'fas fa-star' },
  ];

  // Опции сортировки
  const sortOptions = [
    { id: 'newest', label: 'Сначала новые' },
    { id: 'oldest', label: 'Сначала старые' },
    { id: 'name-asc', label: 'А-Я' },
    { id: 'name-desc', label: 'Я-А' },
    { id: 'date-start', label: 'По дате начала' },
    { id: 'date-end', label: 'По дате окончания' },
  ];

  // Базовый URL API
  const API_BASE_URL = 'http://localhost:8080';

  // Функция для получения токена
  const getAuthToken = () => {
    return localStorage.getItem('authToken') || localStorage.getItem('auth_token');
  };

  // Загрузка выставок
  useEffect(() => {
    fetchExhibitions();
  }, []);

  // Фильтрация и сортировка при изменении параметров
  useEffect(() => {
    filterAndSortEvents();
  }, [events, activeFilter, searchQuery, sortBy]);

  // Функция загрузки выставок
  const fetchExhibitions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/exhibition-events`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthToken() && { 'Authorization': `Bearer ${getAuthToken()}` })
        }
      });
      
      if (!response.ok) {
        if (response.status === 204) {
          setEvents([]);
          setLoading(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setEvents(data);
      
    } catch (err) {
      console.error('Ошибка при загрузке выставок:', err);
      setError('Не удалось загрузить выставки. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  // Функция фильтрации и сортировки
  const filterAndSortEvents = () => {
    let filtered = [...events];
    const now = new Date();

    // Поиск по тексту
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => {
        const title = event.title || '';
        const description = event.description || '';
        const galleryName = event.galleryName || '';
        const location = event.location || '';
        const address = event.address || '';
        
        return (
          title.toLowerCase().includes(query) ||
          description.toLowerCase().includes(query) ||
          galleryName.toLowerCase().includes(query) ||
          location.toLowerCase().includes(query) ||
          address.toLowerCase().includes(query)
        );
      });
    }

    // Фильтрация по статусу
    switch (activeFilter) {
      case 'current':
        filtered = filtered.filter(event => {
          if (!event.startDate || !event.endDate) return false;
          try {
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);
            return start <= now && end >= now;
          } catch {
            return false;
          }
        });
        break;
      case 'upcoming':
        filtered = filtered.filter(event => {
          if (!event.startDate) return false;
          try {
            const start = new Date(event.startDate);
            return start > now;
          } catch {
            return false;
          }
        });
        break;
      case 'past':
        filtered = filtered.filter(event => {
          if (!event.endDate) return false;
          try {
            const end = new Date(event.endDate);
            return end < now;
          } catch {
            return false;
          }
        });
        break;
      case 'featured':
        filtered = filtered.filter(event => 
          event.isFeatured === true || event.featured === true
        );
        break;
      default:
        // 'all' - все выставки
        break;
    }

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          const dateA = a.createdAt || a.startDate;
          const dateB = b.createdAt || b.startDate;
          return new Date(dateB || 0) - new Date(dateA || 0);
        
        case 'oldest':
          const dateA2 = a.createdAt || a.startDate;
          const dateB2 = b.createdAt || b.startDate;
          return new Date(dateA2 || 0) - new Date(dateB2 || 0);
        
        case 'name-asc':
          return (a.title || '').localeCompare(b.title || '');
        
        case 'name-desc':
          return (b.title || '').localeCompare(a.title || '');
        
        case 'date-start':
          return new Date(a.startDate || 0) - new Date(b.startDate || 0);
        
        case 'date-end':
          return new Date(a.endDate || 0) - new Date(b.endDate || 0);
        
        default:
          return 0;
      }
    });

    setFilteredEvents(filtered);
  };

  // Обработчики
  const handleResetFilters = () => {
    setActiveFilter('all');
    setSearchQuery('');
    setSortBy('newest');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    filterAndSortEvents();
  };

  const getEventStatus = (event) => {
    try {
      const now = new Date();
      const startDate = new Date(event.startDate || now);
      const endDate = new Date(event.endDate || now);
      
      if (startDate > now) return 'upcoming';
      if (endDate < now) return 'past';
      return 'current';
    } catch {
      return 'current';
    }
  };

  // Загрузка
  if (loading) {
    return (
      <div className="all-exhibitions-page loading">
        <div className="container">
          <div className="loading-state">
            <div className="spinner">
              <i className="fas fa-palette fa-spin"></i>
            </div>
            <p>Загружаем выставки...</p>
          </div>
        </div>
      </div>
    );
  }

  // Ошибка
  if (error) {
    return (
      <div className="all-exhibitions-page error">
        <div className="container">
          <div className="error-state">
            <i className="fas fa-exclamation-triangle"></i>
            <h3>Ошибка загрузки</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchExhibitions}>
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="all-exhibitions-page">
     

      <main className="page-content">
        <div className="container">
          {/* Панель фильтров и поиска */}
          <div className="filters-panel">
            <div className="filters-section">
              {/* Поиск */}
              <div className="search-box">
                <form onSubmit={handleSearch}>
                  <div className="search-input-group">
                    <i className="fas fa-search"></i>
                    <input
                      type="text"
                      placeholder="Поиск выставок..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                    {searchQuery && (
                      <button 
                        type="button" 
                        className="clear-search"
                        onClick={() => setSearchQuery('')}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Фильтры */}
              <div className="filters-tabs">
                {filters.map(filter => (
                  <button
                    key={filter.id}
                    className={`filter-tab ${activeFilter === filter.id ? 'active' : ''}`}
                    onClick={() => setActiveFilter(filter.id)}
                  >
                    <i className={filter.icon}></i>
                    <span>{filter.label}</span>
                    {filter.id === 'all' && events.length > 0 && (
                      <span className="filter-count">{events.length}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Сортировка и сброс */}
              <div className="sorting-section">
                <div className="sort-select">
                  <label htmlFor="sort-select">
                    <i className="fas fa-sort-amount-down"></i>
                    Сортировка:
                  </label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-dropdown"
                  >
                    {sortOptions.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {(activeFilter !== 'all' || searchQuery || sortBy !== 'newest') && (
                  <button 
                    className="btn btn-text reset-filters"
                    onClick={handleResetFilters}
                  >
                    <i className="fas fa-redo"></i>
                    Сбросить фильтры
                  </button>
                )}
              </div>
            </div>

            {/* Информация о результатах */}
            <div className="results-info">
              <div className="results-count">
                <i className="fas fa-filter"></i>
                <span>
                  Найдено: <strong>{filteredEvents.length}</strong> выставок
                  {searchQuery && (
                    <span> по запросу "{searchQuery}"</span>
                  )}
                </span>
              </div>
              
              {filteredEvents.length === 0 && events.length > 0 && (
                <div className="no-filter-results">
                  <i className="fas fa-search"></i>
                  <p>По выбранным фильтрам ничего не найдено</p>
                  <button 
                    className="btn btn-text"
                    onClick={handleResetFilters}
                  >
                    Показать все выставки
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Сетка выставок */}
          {filteredEvents.length > 0 ? (
            <>
              <div className="exhibitions-grid">
                {filteredEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="exhibition-item-wrapper"
                    onClick={() => navigate(`/event/${event.id}`)}
                  >
                    <ExhibitionCard 
                      event={event}
                      status={getEventStatus(event)}
                    />
                  </div>
                ))}
              </div>

              {/* Пагинация */}
              {filteredEvents.length > 12 && (
                <div className="load-more-section">
                  <p>Показано {Math.min(filteredEvents.length, 12)} из {filteredEvents.length} выставок</p>
                  <button className="btn btn-outline" onClick={() => window.scrollTo(0, 0)}>
                    <i className="fas fa-arrow-up"></i> Наверх
                  </button>
                </div>
              )}
            </>
          ) : events.length === 0 ? (
            <div className="no-exhibitions">
              <div className="empty-state">
                <i className="fas fa-calendar-times"></i>
                <h3>Выставок пока нет</h3>
                <p>Здесь появятся все будущие выставки</p>
                <Link to="/" className="btn btn-primary">
                  <i className="fas fa-home"></i> На главную
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      
    </div>
  );
};

export default AllExhibitionsPage;