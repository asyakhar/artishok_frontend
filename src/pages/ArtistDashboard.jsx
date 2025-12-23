import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ArtistDashboard.css';
import AddArtworkModal from './AddArtworkModal';

const API_BASE_URL = 'http://localhost:8080';

const ArtistDashboard = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState({ profile: true, bookings: true, artworks: true });
    const [activeTab, setActiveTab] = useState('bookings');
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [availableBookings, setAvailableBookings] = useState([]);
    const [editingArtwork, setEditingArtwork] = useState(null); // Данные картины для редактирования
    const [isEditMode, setIsEditMode] = useState(false); // Флаг режима редактирования

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const user = JSON.parse(localStorage.getItem('user') || 'null');

        if (!token || !user) {
            navigate('/login');
            return;
        }

        if (user.role !== 'ARTIST') {
            navigate('/');
            return;
        }

        setUserData(user);
        fetchBookings(user.id);
        fetchArtworks(user.id);
        fetchUserProfile(token);
    }, [navigate]);

    const fetchUserProfile = async (token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const user = await response.json();
                setUserData(user);
                localStorage.setItem('user', JSON.stringify(user));
            }
        } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
        } finally {
            setLoading(prev => ({ ...prev, profile: false }));
        }
    };

    const fetchBookings = async (artistId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/artist/${artistId}`);
            if (response.ok) {
                const data = await response.json();
                setBookings(data);
            }
        } catch (error) {
            console.error('Ошибка загрузки бронирований:', error);
            setError('Не удалось загрузить бронирования');
        } finally {
            setLoading(prev => ({ ...prev, bookings: false }));
        }
    };

    useEffect(() => {
        if (bookings.length > 0) {
            const confirmedBookings = bookings.filter(
                booking => booking.status === 'CONFIRMED'
            );
            setAvailableBookings(confirmedBookings);
        }
    }, [bookings]);

    const fetchArtworks = async (artistId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/artworks/artist/${artistId}`);
            if (response.ok) {
                const data = await response.json();
                setArtworks(data);
            }
        } catch (error) {
            console.error('Ошибка загрузки картин:', error);
            setError('Не удалось загрузить картины');
        } finally {
            setLoading(prev => ({ ...prev, artworks: false }));
        }
    };

    const handleAddArtworkSuccess = () => {
        setShowAddModal(false);
        // Обновляем список картин
        if (userData?.id) {
            fetchArtworks(userData.id);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Вы уверены, что хотите отменить это бронирование?')) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                alert('Бронирование успешно отменено!');
                // Обновляем данные
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                fetchBookings(user.id);
            } else {
                const errorData = await response.json();
                alert(`Ошибка: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Ошибка отмены бронирования:', error);
            alert('Произошла ошибка при отмене бронирования');
        }
    };
    const handlePublishArtwork = async (artworkId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/artworks/${artworkId}/publish`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert('Картина опубликована!');
                fetchArtworks(userData.id);
            }
        } catch (error) {
            console.error('Ошибка публикации:', error);
        }
    };

    const handleDraftArtwork = async (artworkId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/artworks/${artworkId}/draft`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert('Картина переведена в черновик');
                fetchArtworks(userData.id);
            }
        } catch (error) {
            console.error('Ошибка:', error);
        }
    };

    const handleDeleteArtwork = async (artworkId) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту картину?')) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/artworks/${artworkId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert('Картина удалена!');
                fetchArtworks(userData.id);
            }
        } catch (error) {
            console.error('Ошибка удаления:', error);
        }
    };

    const handleEditArtwork = (artwork) => {
        // Заполняем форму данными текущей картины
        const formData = {
            bookingId: artwork.booking?.id || '', // Если картина связана с бронированием
            title: artwork.title || '',
            description: artwork.description || '',
            creationYear: artwork.creationYear || new Date().getFullYear(),
            technique: artwork.technique || '',
            imageUrl: artwork.imageUrl || '',
            status: artwork.status || 'DRAFT'
        };

        setEditingArtwork({
            id: artwork.id,
            ...formData
        });
        setIsEditMode(true);
        setShowAddModal(true); // Открываем модалку
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'CONFIRMED': return 'status-badge confirmed';
            case 'PENDING': return 'status-badge pending';
            case 'CANCELLED': return 'status-badge cancelled';
            default: return 'status-badge';
        }
    };

    const getArtworkStatusBadgeClass = (status) => {
        switch (status) {
            case 'PUBLISHED': return 'status-badge published';
            case 'DRAFT': return 'status-badge draft';
            default: return 'status-badge';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading.profile) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Загрузка личного кабинета...</p>
            </div>
        );
    }

    return (
        <div className="artist-dashboard">
            {/* Шапка профиля */}
            <div className="dashboard-header">
                <div className="profile-card">
                    <div className="profile-avatar">
                        {userData?.avatarUrl ? (
                            <img src={userData.avatarUrl} alt="Аватар" className="avatar-image" />
                        ) : (
                            <div className="avatar-placeholder">
                                <i className="fas fa-palette"></i>
                            </div>
                        )}
                    </div>
                    <div className="profile-info">
                        <h1 className="profile-name">{userData?.fullName || 'Художник'}</h1>
                        <div className="profile-details">
                            <div className="detail-item">
                                <i className="fas fa-envelope"></i>
                                <span>{userData?.email || 'Email не указан'}</span>
                            </div>
                            <div className="detail-item">
                                <i className="fas fa-user-tag"></i>
                                <span className="role-badge artist">Художник</span>
                            </div>
                            {userData?.phoneNumber && (
                                <div className="detail-item">
                                    <i className="fas fa-phone"></i>
                                    <span>{userData.phoneNumber}</span>
                                </div>
                            )}
                        </div>
                        {userData?.bio && (
                            <p className="profile-bio">{userData.bio}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Навигация по вкладкам */}
            <div className="dashboard-tabs">
                <button
                    className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bookings')}
                >
                    <i className="fas fa-calendar-check"></i>
                    Мои бронирования
                    <span className="tab-badge">{bookings.length}</span>
                </button>
                <button
                    className={`tab-btn ${activeTab === 'artworks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('artworks')}
                >
                    <i className="fas fa-paint-brush"></i>
                    Мои картины
                    <span className="tab-badge">{artworks.length}</span>
                </button>
            </div>

            {/* Сообщения об ошибках */}
            {error && (
                <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    {error}
                </div>
            )}

            {/* Контент вкладок */}
            <div className="dashboard-content">
                {activeTab === 'bookings' && (
                    <div className="bookings-section">
                        <div className="section-header">
                            <h2><i className="fas fa-calendar-alt"></i> Мои бронирования</h2>
                            <button
        className="btn btn-primary btn-sm"
        onClick={() => navigate('/map/1')}
        style={{
          marginLeft: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <i className="fas fa-map"></i>
        Перейти к бронированию
      </button>
                        </div>

                        {loading.bookings ? (
                            <div className="loading-placeholder">Загрузка бронирований...</div>
                        ) : bookings.length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-calendar-times"></i>
                                <p>У вас пока нет бронирований</p>
                            </div>
                        ) : (
                            <div className="bookings-table-container">
                                <table className="bookings-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Статус</th>
                                            <th>Дата бронирования</th>
                                            <th>Галерея</th>
                                            <th>Мероприятие</th>
                                            <th>Стенд</th>
                                            <th>Размер</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.map(booking => {
                                            // Извлекаем данные из вложенной структуры
                                            const gallery = booking.exhibitionStand?.exhibitionHallMap?.exhibitionEvent?.gallery;
                                            const event = booking.exhibitionStand?.exhibitionHallMap?.exhibitionEvent;
                                            const stand = booking.exhibitionStand;

                                            return (
                                                <tr key={booking.id}>
                                                    <td>#{booking.id}</td>
                                                    <td>
                                                        <span className={getStatusBadgeClass(booking.status)}>
                                                            {booking.status || 'Нет статуса'}
                                                        </span>
                                                    </td>
                                                    <td>{formatDate(booking.bookingDate)}</td>
                                                    <td>{gallery?.name || '—'}</td>
                                                    <td>{event?.title || '—'}</td>
                                                    <td>{stand?.standNumber || '—'}</td>
                                                    <td>
                                                        {stand?.width && stand?.height
                                                            ? `${stand.width}×${stand.height} см`
                                                            : '—'}
                                                    </td>
                                                    <td>
                                                        <div className="table-actions">
                                                            {/* Кнопка отмены - только для активных бронирований */}
                                                            {booking.status === 'PENDING' || booking.status === 'CONFIRMED' ? (
                                                                <button
                                                                    className="btn btn-danger btn-sm"
                                                                    onClick={() => handleCancelBooking(booking.id)}
                                                                    title="Отменить"
                                                                    style={{ marginLeft: '5px' }}
                                                                >
                                                                    <i className="fas fa-times"></i>
                                                                </button>
                                                            ) : booking.status === 'CANCELLED' ? (
                                                                <span className="cancelled-text" style={{ color: '#dc3545', fontSize: '12px' }}>
                                                                    Отменено
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'artworks' && (
                    <div className="artworks-section">
                        <div className="section-header">
                            <h2><i className="fas fa-paint-brush"></i> Мои картины</h2>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setShowAddModal(true)}
                            >
                                <i className="fas fa-plus"></i> Новая картина
                            </button>
                        </div>

                        {loading.artworks ? (
                            <div className="loading-placeholder">Загрузка картин...</div>
                        ) : artworks.length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-palette"></i>
                                <p>У вас пока нет картин</p>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setShowAddModal(true)}
                                >
                                    Добавить первую картину
                                </button>
                            </div>
                        ) : (
                            <div className="artworks-grid">
                                {artworks.map(artwork => (
                                    <div key={artwork.id} className="artwork-card">
                                        <div className="artwork-image">
                                            {artwork.imageUrl ? (
                                                <img src={artwork.imageUrl} alt={artwork.title} />
                                            ) : (
                                                <div className="image-placeholder">
                                                    <i className="fas fa-image"></i>
                                                    <span>Нет изображения</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="artwork-content">
                                            <div className="artwork-header">
                                                <h3>{artwork.title || 'Без названия'}</h3>
                                                <span className={getArtworkStatusBadgeClass(artwork.status)}>
                                                    {artwork.status === 'PUBLISHED' && 'Опубликовано'}
                                                    {artwork.status === 'DRAFT' && 'Черновик'}
                                                </span>
                                            </div>

                                            <div className="artwork-details">
                                                {artwork.description && (
                                                    <p className="artwork-description">
                                                        {artwork.description.length > 100
                                                            ? `${artwork.description.substring(0, 100)}...`
                                                            : artwork.description}
                                                    </p>
                                                )}

                                                <div className="detail-grid">
                                                    {artwork.technique && (
                                                        <div className="detail-item">
                                                            <i className="fas fa-brush"></i>
                                                            <span>{artwork.technique}</span>
                                                        </div>
                                                    )}
                                                    {artwork.year && (
                                                        <div className="detail-item">
                                                            <i className="fas fa-calendar"></i>
                                                            <span>{artwork.year} год</span>
                                                        </div>
                                                    )}
                                                    {artwork.dimensions && (
                                                        <div className="detail-item">
                                                            <i className="fas fa-expand-alt"></i>
                                                            <span>{artwork.dimensions}</span>
                                                        </div>
                                                    )}
                                                    {artwork.price && (
                                                        <div className="detail-item">
                                                            <i className="fas fa-tag"></i>
                                                            <span>{artwork.price} руб.</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="artwork-actions">
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => handleEditArtwork(artwork)} // Используем новую функцию
                                                >
                                                    <i className="fas fa-edit"></i> Редактировать
                                                </button>

                                                {artwork.status === 'DRAFT' ? (
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => handlePublishArtwork(artwork.id)}
                                                    >
                                                        <i className="fas fa-upload"></i> Опубликовать
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-warning btn-sm"
                                                        onClick={() => handleDraftArtwork(artwork.id)}
                                                    >
                                                        <i className="fas fa-save"></i> В черновик
                                                    </button>
                                                )}

                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDeleteArtwork(artwork.id)}
                                                >
                                                    <i className="fas fa-trash"></i> Удалить
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Статистика - только нужные карточки */}
            <div className="dashboard-stats">
                <div className="stat-card">
                    <div className="stat-icon booking">
                        <i className="fas fa-calendar-check"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{bookings.length}</h3>
                        <p>Бронирований</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon artwork">
                        <i className="fas fa-paint-brush"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{artworks.length}</h3>
                        <p>Картин</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon confirmed">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{bookings.filter(b => b.status === 'CONFIRMED').length}</h3>
                        <p>Подтверждено</p>
                    </div>
                </div>
            </div>
            {showAddModal && (
                <AddArtworkModal
                    isOpen={showAddModal}
                    onClose={() => {
                        setShowAddModal(false);
                        setIsEditMode(false); // Сбрасываем режим при закрытии
                        setEditingArtwork(null); // Очищаем данные
                    }}
                    onSuccess={handleAddArtworkSuccess}
                    bookings={availableBookings}
                    artistId={userData?.id}
                    editData={editingArtwork} // Передаем данные для редактирования
                    isEditMode={isEditMode} // Передаем флаг режима
                />
            )}
        </div>
    );
};

export default ArtistDashboard;