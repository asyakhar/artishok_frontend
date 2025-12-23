import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GalleryOwnerDashboard.css';

const API_BASE_URL = 'http://localhost:8080';

const GalleryOwnerDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [galleries, setGalleries] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'GALLERY_OWNER') {
      navigate('/');
      return;
    }

    setUserData(user);
    fetchOwnerGalleries(token);
  }, [navigate]);
  const handleNavigateToExhibitionMap = () => {
    // Если есть выставки в выбранной галерее
    if (exhibitions.length > 0) {
      // Берем первую активную выставку или первую в списке
      const firstExhibition = exhibitions.find(exh => exh.status === 'ACTIVE') || exhibitions[0];
      navigate(`/map/${firstExhibition.id}`);
    } else if (selectedGallery) {
      // Если выставок нет, предлагаем создать новую
      if (window.confirm(`У вас нет выставок в галерее "${selectedGallery.name}". Хотите создать новую выставку?`)) {
        navigate(`/gallery/${selectedGallery.id}/exhibitions/new`);
      }
    } else {
      // Если галерея не выбрана
      alert('Сначала выберите галерею из списка выше');
    }
  };
  const fetchOwnerGalleries = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/gallery-owner/galleries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGalleries(data.galleries || []);
          if (data.galleries.length > 0) {
            setSelectedGallery(data.galleries[0]);
            fetchGalleryExhibitions(data.galleries[0].id, token);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки галерей:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGalleryExhibitions = async (galleryId, token) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/gallery-owner/exhibitions?galleryId=${galleryId}`, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setExhibitions(data.exhibitions || []);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки выставок:', error);
    }
  };

  const handleGallerySelect = (gallery) => {
    setSelectedGallery(gallery);
    const token = localStorage.getItem('authToken');
    fetchGalleryExhibitions(gallery.id, token);
  };

  const handleCreateExhibition = () => {
    if (selectedGallery) {
      navigate(`/gallery/${selectedGallery.id}/exhibitions/new`);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Загрузка кабинета владельца...</p>
      </div>
    );
  }

  return (
    <div className="gallery-owner-dashboard">
      {/* Шапка профиля */}
      <div className="dashboard-header">
        <div className="profile-card">
          <div className="profile-avatar">
            {userData?.avatarUrl ? (
              <img src={userData.avatarUrl} alt="Аватар" />
            ) : (
              <div className="avatar-placeholder">
                <i className="fas fa-building"></i>
              </div>
            )}
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{userData?.fullName || 'Владелец галереи'}</h1>
            <div className="profile-details">
              <div className="detail-item">
                <i className="fas fa-envelope"></i>
                <span>{userData?.email || 'Email не указан'}</span>
              </div>
              <div className="detail-item">
                <i className="fas fa-user-tag"></i>
                <span className="role-badge owner">Владелец галереи</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Выбор галереи */}
      <div className="galleries-section">
        <h2><i className="fas fa-store"></i> Мои галереи</h2>
        <div className="galleries-list">
          {galleries.map(gallery => (
            <div 
              key={gallery.id}
              className={`gallery-card ${selectedGallery?.id === gallery.id ? 'active' : ''}`}
              onClick={() => handleGallerySelect(gallery)}
            >
              <h3>{gallery.name}</h3>
              <p>{gallery.address}</p>
              <div className="gallery-status">
                <span className={`status-badge ${gallery.status?.toLowerCase()}`}>
                  {gallery.status === 'APPROVED' ? 'Одобрена' : 
                   gallery.status === 'PENDING' ? 'На модерации' : 'Отклонена'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Выставки выбранной галереи */}
      {selectedGallery && (
        <div className="exhibitions-section">
          <div className="section-header">
            <h2><i className="fas fa-calendar-alt"></i> Выставки галереи "{selectedGallery.name}"</h2>
            <button 
              className="btn btn-primary"
              onClick={handleCreateExhibition}
            >
              <i className="fas fa-plus"></i> Новая выставка
            </button>
          </div>

          {exhibitions.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-plus"></i>
              <p>Нет активных выставок</p>
              <p>Создайте первую выставку для настройки стендов</p>
            </div>
          ) : (
            <div className="exhibitions-grid">
              {exhibitions.map(exhibition => (
                <div key={exhibition.id} className="exhibition-card">
                  <div className="exhibition-header">
                    <h3>{exhibition.title}</h3>
                    <span className={`status-badge ${exhibition.status?.toLowerCase()}`}>
                      {exhibition.status === 'ACTIVE' ? 'Активна' : 
                       exhibition.status === 'DRAFT' ? 'Черновик' : 'Завершена'}
                    </span>
                  </div>
                  
                  <div className="exhibition-details">
                    <p><i className="fas fa-calendar"></i> 
                      {new Date(exhibition.startDate).toLocaleDateString()} - 
                      {new Date(exhibition.endDate).toLocaleDateString()}
                    </p>
                    <p><i className="fas fa-info-circle"></i> {exhibition.description || 'Без описания'}</p>
                  </div>

                  <div className="exhibition-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => navigate(`/map/${exhibition.id}`)}
                    >
                      <i className="fas fa-map"></i> Управление стендами
                    </button>
                    
                    <button 
                      className="btn btn-outline"
                      onClick={() => navigate(`/gallery/${selectedGallery.id}/exhibition/${exhibition.id}/edit`)}
                    >
                      <i className="fas fa-edit"></i> Редактировать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      

      {/* Статистика */}
      <div className="dashboard-stats">
        {/* Добавьте эту карточку: */}
        <div 
  className="stat-card clickable"
  onClick={() => handleNavigateToExhibitionMap()}
  style={{
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  }}
>
  <div className="stat-icon" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
    <i className="fas fa-map" style={{ color: 'white' }}></i>
  </div>
  <div className="stat-content">
    <h3 style={{ color: 'white' }}>🗺️</h3>
    <p style={{ color: 'white', fontWeight: 'bold' }}>
      Карта выставки
    </p>
    <small style={{ opacity: 0.8, fontSize: '12px' }}>
      {exhibitions.length > 0 
        ? `Перейти к ${selectedGallery?.name}` 
        : 'Сначала создайте выставку'}
    </small>
  </div>
</div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-store"></i>
          </div>
          <div className="stat-content">
            <h3>{galleries.length}</h3>
            <p>Галерей</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="stat-content">
            <h3>{exhibitions.length}</h3>
            <p>Выставок</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-chair"></i>
          </div>
          <div className="stat-content">
            <h3>0</h3>
            <p>Стендов всего</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryOwnerDashboard;