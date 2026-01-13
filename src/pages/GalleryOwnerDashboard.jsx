import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GalleryOwnerDashboard.css';
import AddExhibitionModal from './AddExhibitionModal';
import AddGalleryModal from './AddGalleryModal';

const API_BASE_URL = 'http://localhost:8080';

const GalleryOwnerDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [galleries, setGalleries] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [selectedExhibition, setSelectedExhibition] = useState(null);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [loading, setLoading] = useState({
    profile: true,
    galleries: true,
    exhibitions: true,
    bookings: true
  });
  const [showAddGalleryModal, setShowAddGalleryModal] = useState(false);
  const [showAddExhibitionModal, setShowAddExhibitionModal] = useState(false);
  const [editingExhibition, setEditingExhibition] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditGalleryModal, setShowEditGalleryModal] = useState(false);
  const [editingGallery, setEditingGallery] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');

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

  const fetchOwnerGalleries = async (token) => {
    try {
      setLoading(prev => ({ ...prev, galleries: true }));
      const response = await fetch(`${API_BASE_URL}/gallery-owner/galleries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const galleriesList = data.galleries || [];
          setGalleries(galleriesList);

          if (galleriesList.length > 0) {
            const firstGallery = galleriesList[0];
            setSelectedGallery(firstGallery);
            fetchGalleryExhibitions(firstGallery.id, token);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки галерей:', error);
    } finally {
      setLoading(prev => ({ ...prev, galleries: false, profile: false }));
    }
  };

  const fetchGalleryExhibitions = async (galleryId, token) => {
    try {
      setLoading(prev => ({ ...prev, exhibitions: true }));
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
    } finally {
      setLoading(prev => ({ ...prev, exhibitions: false }));
    }
  };

  const fetchExhibitionBookings = async (exhibitionId, token) => {
    try {
      setLoading(prev => ({ ...prev, bookings: true }));
      const response = await fetch(
        `${API_BASE_URL}/gallery-owner/bookings?exhibitionId=${exhibitionId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBookings(data.bookings || []);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки бронирований:', error);
    } finally {
      setLoading(prev => ({ ...prev, bookings: false }));
    }
  };

  const handleCreateGallery = async (galleryData) => {
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/gallery-owner/create-gallery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(galleryData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Галерея создана и отправлена на модерацию!');
        fetchOwnerGalleries(token);
        return { success: true, gallery: data.gallery };
      } else {
        throw new Error(data.error || 'Ошибка при создании галереи');
      }
    } catch (error) {
      console.error('Ошибка создания галереи:', error);
      return { success: false, error: error.message };
    }
  };

  const handleGallerySelect = (gallery) => {
    setSelectedGallery(gallery);
    const token = sessionStorage.getItem('authToken');
    fetchGalleryExhibitions(gallery.id, token);
  };

  const handleEditGallery = (gallery) => {
    setEditingGallery(gallery);
    setShowEditGalleryModal(true);
  };

  const handleUpdateGallery = async (galleryData) => {
    if (!editingGallery) return { success: false, error: 'Галерея не выбрана' };

    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(
        `${API_BASE_URL}/gallery-owner/galleries/${editingGallery.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(galleryData)
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Информация о галерее обновлена и отправлена на модерацию!');
        fetchOwnerGalleries(token);
        return { success: true, gallery: data.gallery };
      } else {
        throw new Error(data.error || 'Ошибка при обновлении галереи');
      }
    } catch (error) {
      console.error('Ошибка обновления галереи:', error);
      return { success: false, error: error.message };
    }
  };

  const handleGallerySuccess = () => {
    const token = sessionStorage.getItem('authToken');
    fetchOwnerGalleries(token);
    setShowAddGalleryModal(false);
    setShowEditGalleryModal(false);
    setEditingGallery(null);
  };

  const handleViewBookings = (exhibition) => {
    setSelectedExhibition(exhibition);
    const token = sessionStorage.getItem('authToken');
    fetchExhibitionBookings(exhibition.id, token);
    setShowBookingsModal(true);
  };

  const handleConfirmBooking = async (bookingId) => {
    if (!window.confirm('Подтвердить бронирование?')) return;

    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/gallery-owner/bookings/${bookingId}/confirm`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Бронирование подтверждено владельцем галереи' })
      });

      if (response.ok) {
        alert('Бронирование подтверждено!');
        if (selectedExhibition) {
          fetchExhibitionBookings(selectedExhibition.id, token);
        }
      } else {
        const errorData = await response.json();
        alert(`Ошибка: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Ошибка подтверждения бронирования:', error);
      alert('Произошла ошибка при подтверждении бронирования');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    const reason = window.prompt('Укажите причину отклонения бронирования:');
    if (!reason) return;

    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/gallery-owner/bookings/${bookingId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        alert('Бронирование отклонено!');
        if (selectedExhibition) {
          fetchExhibitionBookings(selectedExhibition.id, token);
        }
      } else {
        const errorData = await response.json();
        alert(`Ошибка: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Ошибка отклонения бронирования:', error);
      alert('Произошла ошибка при отклонении бронирования');
    }
  };

  const handleCreateExhibition = () => {
    if (selectedGallery) {
      setEditingExhibition(null);
      setIsEditMode(false);
      setShowAddExhibitionModal(true);
    }
  };

  const handleEditExhibition = (exhibition) => {
    setEditingExhibition(exhibition);
    setIsEditMode(true);
    setShowAddExhibitionModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACTIVE': return 'owner-status-badge owner-status-active';
      case 'APPROVED': return 'owner-status-badge owner-status-approved';
      case 'PENDING': return 'owner-status-badge owner-status-pending';
      case 'DRAFT': return 'owner-status-badge owner-status-draft';
      case 'CONFIRMED': return 'owner-status-badge owner-status-confirmed';
      case 'CANCELLED': return 'owner-status-badge owner-status-cancelled';
      default: return 'owner-status-badge';
    }
  };

  if (loading.profile) {
    return (
      <div className="owner-dashboard-loading">
        <div className="owner-spinner"></div>
        <p>Загрузка кабинета владельца...</p>
      </div>
    );
  }

  return (
    <div className="owner-dashboard">
      {/* Шапка профиля */}
      <div className="owner-dashboard-header">
        <div className="owner-profile-card">
          <div className="owner-profile-avatar">
            {userData?.avatarUrl ? (
              <img src={userData.avatarUrl} alt="Аватар" className="owner-avatar-image" />
            ) : (
              <div className="owner-avatar-placeholder">
                <i className="fas fa-building"></i>
              </div>
            )}
          </div>
          <div className="owner-profile-info">
            <h1 className="owner-profile-name">{userData?.fullName || 'Владелец галереи'}</h1>
            <div className="owner-profile-details">
              <div className="owner-detail-item">
                <i className="fas fa-envelope"></i>
                <span>{userData?.email || 'Email не указан'}</span>
              </div>
              <div className="owner-detail-item">
                <i className="fas fa-phone"></i>
                <span>{userData?.phoneNumber || 'Телефон не указан'}</span>
              </div>
              <div className="owner-detail-item">
                <i className="fas fa-user-tag"></i>
                <span className="owner-role-badge owner-role-owner">Владелец галереи</span>
              </div>
            </div>
            <p className="owner-profile-bio">
              {userData?.bio || 'Описание профиля пока не добавлено'}
            </p>
          </div>
        </div>
      </div>

      {/* Выбор галереи */}
      <div className="owner-dashboard-content">
        <div className="owner-section-header">
          <h2>Мои галереи</h2>
          <button
            className="owner-btn owner-btn-primary"
            onClick={() => setShowAddGalleryModal(true)}
          >
            <i className="fas fa-plus"></i> Новая галерея
          </button>
        </div>

        {loading.galleries ? (
          <div className="owner-loading-placeholder">
            <div className="owner-spinner"></div>
            <p>Загрузка галерей...</p>
          </div>
        ) : galleries.length === 0 ? (
          <div className="owner-empty-state">
            <i className="fas fa-store-alt-slash"></i>
            <p>У вас пока нет галерей</p>
            <button
              className="owner-btn owner-btn-primary"
              onClick={() => setShowAddGalleryModal(true)}
            >
              Создать первую галерею
            </button>
          </div>
        ) : (
          <div className="owner-gallery-selector">
            <div className="owner-gallery-selector-header">
              <label htmlFor="gallery-select">Выберите галерею:</label>
              {selectedGallery && (
                <button
                  className="owner-btn owner-btn-outline owner-btn-sm"
                  onClick={() => handleEditGallery(selectedGallery)}
                  title="Редактировать галерею"
                >
                  <i className="fas fa-edit"></i> Редактировать
                </button>
              )}
            </div>

            <select
              id="gallery-select"
              className="owner-gallery-dropdown"
              value={selectedGallery?.id || ''}
              onChange={(e) => {
                const gallery = galleries.find(g => g.id == e.target.value);
                if (gallery) handleGallerySelect(gallery);
              }}
            >
              {galleries.map(gallery => (
                <option key={gallery.id} value={gallery.id}>
                  {gallery.name} ({gallery.address})
                </option>
              ))}
            </select>

            {selectedGallery && (
              <div className="owner-selected-gallery-info">
                <h3>{selectedGallery.name}</h3>
                <p><i className="fas fa-map-marker-alt"></i> {selectedGallery.address}</p>
                <p><i className="fas fa-phone"></i> {selectedGallery.contactPhone || 'Телефон не указан'}</p>
                <span className={getStatusBadgeClass(selectedGallery.status)}>
                  {selectedGallery.status === 'APPROVED' ? 'Одобрена' :
                    selectedGallery.status === 'PENDING' ? 'На модерации' : 'Отклонена'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Модальные окна для галереи */}
      <AddGalleryModal
        show={showAddGalleryModal}
        onClose={() => setShowAddGalleryModal(false)}
        onSuccess={handleGallerySuccess}
        isEditMode={false}
        editData={null}
      />
      <AddGalleryModal
        show={showEditGalleryModal}
        onClose={() => {
          setShowEditGalleryModal(false);
          setEditingGallery(null);
        }}
        onSuccess={handleGallerySuccess}
        isEditMode={true}
        editData={editingGallery}
      />


      {selectedGallery && (
        <div className="owner-dashboard-content">
          <div className="owner-section-header">
            <h2> Выставки галереи "{selectedGallery.name}"</h2>
            <button
              className="owner-btn owner-btn-primary"
              onClick={handleCreateExhibition}
              disabled={selectedGallery.status !== 'APPROVED'}
              title={selectedGallery.status !== 'APPROVED' ? 'Галерея должна быть одобрена' : ''}
            >
              <i className="fas fa-plus"></i> Новая выставка
            </button>
          </div>

          {loading.exhibitions ? (
            <div className="owner-loading-placeholder">
              <div className="owner-spinner"></div>
              <p>Загрузка выставок...</p>
            </div>
          ) : exhibitions.length === 0 ? (
            <div className="owner-empty-state">
              <i className="fas fa-calendar-plus"></i>
              <p>Нет выставок в этой галерее</p>
              {selectedGallery.status === 'APPROVED' && (
                <button
                  className="owner-btn owner-btn-outline"
                  onClick={handleCreateExhibition}
                >
                  Создать первую выставку
                </button>
              )}
            </div>
          ) : (
            <div className="owner-exhibitions-table-container">
              <table className="owner-exhibitions-table">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Описание</th>
                    <th>Даты проведения</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {exhibitions.map(exhibition => (
                    <tr key={exhibition.id}>
                      <td>
                        <strong>{exhibition.title}</strong>
                      </td>
                      <td>
                        <div className="owner-description-cell">
                          {exhibition.description || 'Без описания'}
                        </div>
                      </td>
                      <td>
                        {formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(exhibition.status)}>
                          {exhibition.status === 'ACTIVE' ? 'Активна' :
                            exhibition.status === 'DRAFT' ? 'Черновик' : 'Завершена'}
                        </span>
                      </td>
                      <td>
                        <div className="owner-table-actions">
                          <button
                            className="owner-btn owner-btn-primary owner-btn-sm"
                            onClick={() => navigate(`/map/${exhibition.id}`)}
                            title="Управление стендами"
                          >
                            <i className="fas fa-map"></i>
                          </button>
                          <button
                            className="owner-btn owner-btn-info owner-btn-sm"
                            onClick={() => handleViewBookings(exhibition)}
                            title="Просмотр бронирований"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="owner-btn owner-btn-warning owner-btn-sm"
                            onClick={() => handleEditExhibition(exhibition)}
                            title="Редактировать выставку"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Модальное окно бронирований */}
      {showBookingsModal && selectedExhibition && (
        <div className="owner-modal-overlay">
          <div className="owner-modal-content">
            <div className="owner-modal-header">
              <h2>
                Бронирования выставки "{selectedExhibition.title}"
              </h2>
              <button className="owner-modal-close" onClick={() => setShowBookingsModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="owner-modal-body">
              {loading.bookings ? (
                <div className="owner-loading-placeholder">
                  <div className="owner-spinner"></div>
                  <p>Загрузка бронирований...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="owner-empty-state">
                  <i className="fas fa-calendar-times"></i>
                  <p>Нет бронирований на эту выставку</p>
                </div>
              ) : (
                <div className="owner-bookings-table-container">
                  <table className="owner-bookings-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Художник</th>
                        <th>Стенд</th>
                        <th>Дата брони</th>
                        <th>Статус</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(booking => (
                        <tr key={booking.id}>
                          <td>#{booking.id}</td>
                          <td>
                            <div>
                              <strong>{booking.artistName}</strong>
                              <br />
                              <small>{booking.artistEmail}</small>
                            </div>
                          </td>
                          <td>
                            Стенд #{booking.standNumber}
                            <br />
                            <small>{booking.width}×{booking.height} см</small>
                          </td>
                          <td>{formatDate(booking.bookingDate)}</td>
                          <td>
                            <span className={getStatusBadgeClass(booking.status)}>
                              {booking.status === 'PENDING' ? 'Ожидает' :
                                booking.status === 'CONFIRMED' ? 'Подтверждено' : 'Отменено'}
                            </span>
                          </td>
                          <td>
                            <div className="owner-table-actions">
                              {booking.status === 'PENDING' && (
                                <>
                                  <button
                                    className="owner-btn owner-btn-success owner-btn-sm"
                                    onClick={() => handleConfirmBooking(booking.id)}
                                    title="Подтвердить"
                                  >
                                    <i className="fas fa-check"></i>
                                  </button>
                                  <button
                                    className="owner-btn owner-btn-danger owner-btn-sm"
                                    onClick={() => handleRejectBooking(booking.id)}
                                    title="Отклонить"
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </>
                              )}
                              {booking.status === 'CONFIRMED' && (
                                <span className="owner-confirmed-text">Подтверждено</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="owner-modal-footer">
              <button
                className="owner-btn owner-btn-outline"
                onClick={() => setShowBookingsModal(false)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Статистика */}
      <div className="owner-dashboard-stats">
        <div className="owner-stat-card">
          <div className="owner-stat-icon owner-stat-gallery">
            <i className="fas fa-store"></i>
          </div>
          <div className="owner-stat-content">
            <h3>{galleries.length}</h3>
            <p>Галерей</p>
          </div>
        </div>

        <div className="owner-stat-card">
          <div className="owner-stat-icon owner-stat-exhibition">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="owner-stat-content">
            <h3>{exhibitions.length}</h3>
            <p>Выставок</p>
          </div>
        </div>

        <div className="owner-stat-card">
          <div className="owner-stat-icon owner-stat-booking">
            <i className="fas fa-ticket-alt"></i>
          </div>
          <div className="owner-stat-content">
            <h3>{bookings.length}</h3>
            <p>Всего бронирований</p>
          </div>
        </div>

        <div className="owner-stat-card">
          <div className="owner-stat-icon owner-stat-pending">
            <i className="fas fa-clock"></i>
          </div>
          <div className="owner-stat-content">
            <h3>{bookings.filter(b => b.status === 'PENDING').length}</h3>
            <p>Ожидают одобрения</p>
          </div>
        </div>
      </div>

      {/* Модальное окно выставки */}
      {showAddExhibitionModal && selectedGallery && (
        <AddExhibitionModal
          isOpen={showAddExhibitionModal}
          onClose={() => {
            setShowAddExhibitionModal(false);
            setIsEditMode(false);
            setEditingExhibition(null);
          }}
          onSuccess={() => {
            const token = sessionStorage.getItem('authToken');
            fetchGalleryExhibitions(selectedGallery.id, token);
          }}
          selectedGallery={selectedGallery}
          isEditMode={isEditMode}
          editData={editingExhibition}
        />
      )}
    </div>
  );
};

export default GalleryOwnerDashboard;