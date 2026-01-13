import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashBoard.css';

const API_BASE_URL = 'http://localhost:8080';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState({
        users: false,
        galleries: false,
        exhibitions: false,
        logs: false,
        statistics: false
    });

    // Данные для таблиц
    const [users, setUsers] = useState([]);
    const [galleries, setGalleries] = useState([]);
    const [exhibitions, setExhibitions] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [userActivityLogs, setUserActivityLogs] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [logsType, setLogsType] = useState('audit');

    // Модальные окна
    const [showUserModal, setShowUserModal] = useState(false);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [showExhibitionModal, setShowExhibitionModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [actionType, setActionType] = useState('');
    const [comment, setComment] = useState('');

    useEffect(() => {
        const token = sessionStorage.getItem('authToken');
        const user = JSON.parse(sessionStorage.getItem('user') || 'null');

        if (!token || !user) {
            navigate('/login');
            return;
        }

        if (user.role !== 'ADMIN') {
            navigate('/');
            return;
        }

        setUserData(user);
        fetchStatistics(token);
        fetchUsers(token);
    }, [navigate]);

    const fetchStatistics = async (token) => {
        try {
            setLoading(prev => ({ ...prev, statistics: true }));
            const response = await fetch(`${API_BASE_URL}/admin/statistics`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setStatistics(data.statistics);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        } finally {
            setLoading(prev => ({ ...prev, statistics: false }));
        }
    };

    const fetchUsers = async (token) => {
        try {
            setLoading(prev => ({ ...prev, users: true }));
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setUsers(data.users || []);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
        } finally {
            setLoading(prev => ({ ...prev, users: false }));
        }
    };

    const fetchGalleries = async (token) => {
        try {
            setLoading(prev => ({ ...prev, galleries: true }));
            const response = await fetch(`${API_BASE_URL}/galleries`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const galleriesList = await response.json();
                setGalleries(galleriesList);
            }
        } catch (error) {
            console.error('Ошибка загрузки галерей:', error);
        } finally {
            setLoading(prev => ({ ...prev, galleries: false }));
        }
    };

    const fetchExhibitions = async (token) => {
        try {
            setLoading(prev => ({ ...prev, exhibitions: true }));
            const response = await fetch(`${API_BASE_URL}/exhibition-events`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const exhibitionsList = await response.json();
                setExhibitions(exhibitionsList);
            }
        } catch (error) {
            console.error('Ошибка загрузки выставок:', error);
        } finally {
            setLoading(prev => ({ ...prev, exhibitions: false }));
        }
    };

    const fetchAuditLogs = async (token) => {
        try {
            setLoading(prev => ({ ...prev, logs: true }));
            const response = await fetch(`${API_BASE_URL}/adminlogs/recent`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const logs = await response.json();
                setAuditLogs(logs || []);
            }
        } catch (error) {
            console.error('Ошибка загрузки логов:', error);
        } finally {
            setLoading(prev => ({ ...prev, logs: false }));
        }
    };

    const fetchUserActivityLogs = async (token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/userlogs/last-50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const logs = await response.json();
                setUserActivityLogs(logs || []);
            }
        } catch (error) {
            console.error('Ошибка загрузки логов активности:', error);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        const token = sessionStorage.getItem('authToken');

        if (tab === 'galleries') {
            fetchGalleries(token);
        } else if (tab === 'exhibitions') {
            fetchExhibitions(token);
        } else if (tab === 'logs') {
            fetchAuditLogs(token);
            fetchUserActivityLogs(token);
            setLogsType('audit');
        }
    };

    const handleUserAction = (user, action) => {
        setSelectedItem(user);
        setActionType(action);
        setShowUserModal(true);
    };

    const handleGalleryAction = (gallery, action) => {
        setSelectedItem(gallery);
        setActionType(action);
        setShowGalleryModal(true);
    };

    const handleExhibitionAction = (exhibition, action) => {
        setSelectedItem(exhibition);
        setActionType(action);
        setShowExhibitionModal(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedItem) return;

        const token = sessionStorage.getItem('authToken');

        try {
            let response;
            let url;
            let method = 'PUT';
            let body = {};

            if (activeTab === 'users') {
                if (actionType === 'activate') {
                    url = `${API_BASE_URL}/admin/users/${selectedItem.id}/activate`;
                    body = { isActive: !selectedItem.isActive };
                } else if (actionType === 'role') {
                    url = `${API_BASE_URL}/admin/users/${selectedItem.id}/role`;
                    body = { role: selectedItem.role === 'ADMIN' ? 'USER' : 'ADMIN' };
                } else if (actionType === 'reset-password') {
                    method = 'POST';
                    url = `${API_BASE_URL}/admin/users/${selectedItem.id}/reset-password`;
                }
            } else if (activeTab === 'galleries') {
                if (actionType === 'approve') {
                    url = `${API_BASE_URL}/admin/galleries/${selectedItem.id}/approve`;
                    body = { comment: comment || 'Одобрено администратором' };
                } else if (actionType === 'reject') {
                    url = `${API_BASE_URL}/admin/galleries/${selectedItem.id}/reject`;
                    body = { comment };
                } else if (actionType === 'change-status') {
                    url = `${API_BASE_URL}/admin/galleries/${selectedItem.id}/status`;
                    body = {
                        status: selectedItem.status === 'APPROVED' ? 'PENDING' : 'APPROVED',
                        comment: comment || 'Изменение статуса'
                    };
                }
            } else if (activeTab === 'exhibitions') {
                // Здесь будет логика для выставок
            }

            if (!url) {
                alert('Действие не реализовано');
                return;
            }

            response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(data.message || 'Действие выполнено успешно');

                // Обновляем данные
                if (activeTab === 'users') {
                    fetchUsers(token);
                } else if (activeTab === 'galleries') {
                    fetchGalleries(token);
                } else if (activeTab === 'exhibitions') {
                    fetchExhibitions(token);
                }

                // Закрываем модалку
                if (activeTab === 'users') setShowUserModal(false);
                if (activeTab === 'galleries') setShowGalleryModal(false);
                if (activeTab === 'exhibitions') setShowExhibitionModal(false);

                setSelectedItem(null);
                setActionType('');
                setComment('');
            } else {
                alert(data.error || 'Ошибка выполнения действия');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при выполнении действия');
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

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'ACTIVE':
            case 'APPROVED':
            case 'CONFIRMED':
                return 'admin-status-badge admin-active';
            case 'PENDING':
                return 'admin-status-badge admin-pending';
            case 'REJECTED':
            case 'CANCELLED':
            case 'INACTIVE':
                return 'admin-status-badge admin-cancelled';
            case 'DRAFT':
                return 'admin-status-badge admin-draft';
            default:
                return 'admin-status-badge';
        }
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'ADMIN':
                return 'admin-role-badge admin-role-admin';
            case 'GALLERY_OWNER':
                return 'admin-role-badge admin-role-owner';
            case 'ARTIST':
                return 'admin-role-badge admin-role-artist';
            default:
                return 'admin-role-badge';
        }
    };

    if (loading.statistics) {
        return (
            <div className="admin-dashboard-loading">
                <div className="admin-spinner"></div>
                <p>Загрузка кабинета администратора...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Шапка профиля */}
            <div className="admin-dashboard-header">
                <div className="admin-profile-card">
                    <div className="admin-profile-avatar">
                        {userData?.avatarUrl ? (
                            <img src={userData.avatarUrl} alt="Аватар" className="admin-avatar-image" />
                        ) : (
                            <div className="admin-avatar-placeholder">
                                <i className="fas fa-user-shield"></i>
                            </div>
                        )}
                    </div>
                    <div className="admin-profile-info">
                        <h1 className="admin-profile-name">{userData?.fullName || 'Администратор'}</h1>
                        <div className="admin-profile-details">
                            <div className="admin-detail-item">
                                <i className="fas fa-envelope"></i>
                                <span>{userData?.email || 'Email не указан'}</span>
                            </div>

                            <div className="admin-detail-item">
                                <i className="fas fa-phone"></i>
                                <span>{userData?.phoneNumber || 'Телефон не указан'}</span>
                            </div>
                            <div className="admin-detail-item">
                                <i className="fas fa-user-tag"></i>
                                <span className="admin-role-badge admin-role-admin">Администратор системы</span>
                            </div>
                        </div>
                        {userData?.bio && (
                            <p className="admin-profile-bio">{userData.bio}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Статистика */}
            {statistics && (
                <div className="admin-dashboard-stats">
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-users">
                            <i className="fas fa-users"></i>
                        </div>
                        <div className="admin-stat-content">
                            <h3>{statistics.totalUsers || 0}</h3>
                            <p>Всего пользователей</p>
                        </div>
                    </div>

                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-active">
                            <i className="fas fa-user-check"></i>
                        </div>
                        <div className="admin-stat-content">
                            <h3>{statistics.activeUsers || 0}</h3>
                            <p>Активных пользователей</p>
                        </div>
                    </div>

                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-gallery">
                            <i className="fas fa-store"></i>
                        </div>
                        <div className="admin-stat-content">
                            <h3>{galleries.length}</h3>
                            <p>Галерей</p>
                        </div>
                    </div>

                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-artist">
                            <i className="fas fa-palette"></i>
                        </div>
                        <div className="admin-stat-content">
                            <h3>{statistics.artists || 0}</h3>
                            <p>Художников</p>
                        </div>
                    </div>

                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-owner">
                            <i className="fas fa-building"></i>
                        </div>
                        <div className="admin-stat-content">
                            <h3>{statistics.galleryOwners || 0}</h3>
                            <p>Владельцев галерей</p>
                        </div>
                    </div>

                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-exhibition">
                            <i className="fas fa-calendar-alt"></i>
                        </div>
                        <div className="admin-stat-content">
                            <h3>{exhibitions.length}</h3>
                            <p>Выставок</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Табы */}
            <div className="admin-dashboard-tabs">
                <button
                    className={`admin-tab-btn ${activeTab === 'users' ? 'admin-active' : ''}`}
                    onClick={() => handleTabChange('users')}
                >
                    <i className="fas fa-users"></i> Пользователи
                </button>
                <button
                    className={`admin-tab-btn ${activeTab === 'galleries' ? 'admin-active' : ''}`}
                    onClick={() => handleTabChange('galleries')}
                >
                    <i className="fas fa-store"></i> Галереи
                </button>
                <button
                    className={`admin-tab-btn ${activeTab === 'exhibitions' ? 'admin-active' : ''}`}
                    onClick={() => handleTabChange('exhibitions')}
                >
                    <i className="fas fa-calendar-alt"></i> Выставки
                </button>
                <button
                    className={`admin-tab-btn ${activeTab === 'logs' ? 'admin-active' : ''}`}
                    onClick={() => handleTabChange('logs')}
                >
                    <i className="fas fa-history"></i> Логи
                </button>
            </div>


            <div className="admin-dashboard-content">
                {/* Таблица пользователей */}
                {activeTab === 'users' && (
                    <div>
                        <div className="admin-section-header">
                            <h2> Управление пользователями</h2>
                            <button
                                className="admin-btn admin-btn-outline"
                                onClick={() => fetchUsers(sessionStorage.getItem('authToken'))}
                            >
                                <i className="fas fa-sync-alt"></i> Обновить
                            </button>
                        </div>

                        {loading.users ? (
                            <div className="admin-loading-placeholder">Загрузка пользователей...</div>
                        ) : users.length === 0 ? (
                            <div className="admin-empty-state">
                                <i className="fas fa-users-slash"></i>
                                <p>Пользователи не найдены</p>
                            </div>
                        ) : (
                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Имя</th>
                                            <th>Email</th>
                                            <th>Роль</th>
                                            <th>Статус</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user.id}>
                                                <td>#{user.id}</td>
                                                <td>
                                                    <div className="admin-user-info">
                                                        {user.avatarUrl && (
                                                            <img src={user.avatarUrl} alt="" className="admin-user-avatar" />
                                                        )}
                                                        <div className="admin-user-details">
                                                            <span className="admin-user-name">{user.fullName}</span>
                                                            {user.email && (
                                                                <span className="admin-user-email">{user.email}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{user.email}</td>
                                                <td>
                                                    <span className={getRoleBadgeClass(user.role)}>
                                                        {user.role === 'GALLERY_OWNER' ? 'Владелец галереи' :
                                                            user.role === 'ADMIN' ? 'Администратор' : 'Художник'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={getStatusBadgeClass(user.isActive ? 'ACTIVE' : 'INACTIVE')}>
                                                        {user.isActive ? 'Активен' : 'Неактивен'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="admin-table-actions">
                                                        <button
                                                            className={`admin-btn admin-btn-sm ${user.isActive ? 'admin-btn-danger' : 'admin-btn-success'}`}
                                                            onClick={() => handleUserAction(user, 'activate')}
                                                            title={user.isActive ? 'Деактивировать' : 'Активировать'}
                                                        >
                                                            <i className={`fas fa-${user.isActive ? 'user-slash' : 'user-check'}`}></i>
                                                        </button>
                                                        {user.role !== 'ADMIN' && (
                                                            <button
                                                                className="admin-btn admin-btn-warning admin-btn-sm"
                                                                onClick={() => handleUserAction(user, 'role')}
                                                                title="Сделать админом"
                                                            >
                                                                <i className="fas fa-user-shield"></i>
                                                            </button>
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
                )}

                {/* Таблица галерей */}
                {activeTab === 'galleries' && (
                    <div>
                        <div className="admin-section-header">
                            <h2>Управление галереями</h2>
                            <button
                                className="admin-btn admin-btn-outline"
                                onClick={() => fetchGalleries(sessionStorage.getItem('authToken'))}
                            >
                                <i className="fas fa-sync-alt"></i> Обновить
                            </button>
                        </div>

                        {loading.galleries ? (
                            <div className="admin-loading-placeholder">Загрузка галерей...</div>
                        ) : galleries.length === 0 ? (
                            <div className="admin-empty-state">
                                <i className="fas fa-store-alt-slash"></i>
                                <p>Галереи не найдены</p>
                            </div>
                        ) : (
                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Название</th>
                                            <th>Адрес</th>
                                            <th>Владелец</th>
                                            <th>Статус</th>
                                            <th>Дата создания</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {galleries.map(gallery => (
                                            <tr key={gallery.id}>
                                                <td>#{gallery.id}</td>
                                                <td>
                                                    <strong>{gallery.name}</strong>
                                                    {gallery.description && (
                                                        <span className="admin-description">{gallery.description}</span>
                                                    )}
                                                </td>
                                                <td>{gallery.address}</td>
                                                <td>
                                                    {gallery.owner ? (
                                                        <div className="admin-owner-info">
                                                            <span className="admin-owner-name">{gallery.owner.fullName}</span>
                                                            <span className="admin-owner-email">{gallery.owner.email}</span>
                                                        </div>
                                                    ) : 'Не указан'}
                                                </td>
                                                <td>
                                                    <span className={getStatusBadgeClass(gallery.status)}>
                                                        {gallery.status === 'APPROVED' ? 'Одобрена' :
                                                            gallery.status === 'PENDING' ? 'На модерации' : 'Отклонена'}
                                                    </span>
                                                    {gallery.adminComment && (
                                                        <div className="admin-comment-badge" title={gallery.adminComment}>
                                                            <i className="fas fa-comment"></i>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>{formatDate(gallery.createdAt)}</td>
                                                <td>
                                                    <div className="admin-table-actions">
                                                        {gallery.status === 'PENDING' && (
                                                            <>
                                                                <button
                                                                    className="admin-btn admin-btn-success admin-btn-sm"
                                                                    onClick={() => handleGalleryAction(gallery, 'approve')}
                                                                    title="Одобрить"
                                                                >
                                                                    <i className="fas fa-check"></i>
                                                                </button>
                                                                <button
                                                                    className="admin-btn admin-btn-danger admin-btn-sm"
                                                                    onClick={() => handleGalleryAction(gallery, 'reject')}
                                                                    title="Отклонить"
                                                                >
                                                                    <i className="fas fa-times"></i>
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            className={`admin-btn admin-btn-sm ${gallery.status === 'APPROVED' ? 'admin-btn-warning' : 'admin-btn-primary'}`}
                                                            onClick={() => handleGalleryAction(gallery, 'change-status')}
                                                            title={gallery.status === 'APPROVED' ? 'Снять одобрение' : 'Изменить статус'}
                                                        >
                                                            <i className="fas fa-exchange-alt"></i>
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

                {/* Таблица выставок */}
                {activeTab === 'exhibitions' && (
                    <div>
                        <div className="admin-section-header">
                            <h2>Управление выставками</h2>
                            <button
                                className="admin-btn admin-btn-outline"
                                onClick={() => fetchExhibitions(sessionStorage.getItem('authToken'))}
                            >
                                <i className="fas fa-sync-alt"></i> Обновить
                            </button>
                        </div>

                        {loading.exhibitions ? (
                            <div className="admin-loading-placeholder">Загрузка выставок...</div>
                        ) : exhibitions.length === 0 ? (
                            <div className="admin-empty-state">
                                <i className="fas fa-calendar-times"></i>
                                <p>Выставки не найдены</p>
                            </div>
                        ) : (
                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Название</th>
                                            <th>Галерея</th>
                                            <th>Даты проведения</th>
                                            <th>Статус</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {exhibitions.map(exhibition => (
                                            <tr key={exhibition.id}>
                                                <td>#{exhibition.id}</td>
                                                <td>
                                                    <strong>{exhibition.title}</strong>
                                                    {exhibition.description && (
                                                        <span className="admin-description">{exhibition.description}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {exhibition.gallery ? exhibition.gallery.name : 'Не указана'}
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
                                                    <div className="admin-table-actions">
                                                        <button
                                                            className="admin-btn admin-btn-primary admin-btn-sm"
                                                            onClick={() => navigate(`/exhibitions/${exhibition.id}`)}
                                                            title="Просмотреть"
                                                        >
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                        <button
                                                            className="admin-btn admin-btn-warning admin-btn-sm"
                                                            onClick={() => handleExhibitionAction(exhibition, 'edit')}
                                                            title="Редактировать"
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

                {/* Логи */}
                {activeTab === 'logs' && (
                    <div>
                        <div className="admin-section-header">
                            <h2> Системные логи</h2>
                            <div className="admin-log-tabs">
                                <button
                                    className={`admin-log-tab-btn ${logsType === 'activity' ? 'admin-active' : ''}`}
                                    onClick={() => setLogsType('activity')}
                                >
                                    Активность пользователей
                                </button>
                                <button
                                    className={`admin-log-tab-btn ${logsType === 'audit' ? 'admin-active' : ''}`}
                                    onClick={() => setLogsType('audit')}
                                >
                                    Админ логи
                                </button>
                            </div>
                        </div>

                        {loading.logs ? (
                            <div className="admin-loading-placeholder">Загрузка логов...</div>
                        ) : (
                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Время</th>
                                            <th>Пользователь</th>
                                            <th>Действие</th>
                                            <th>Объект</th>
                                            <th>Детали</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(logsType === 'activity' ? userActivityLogs : auditLogs).map(log => (
                                            <tr key={log.id}>
                                                <td>#{log.id}</td>
                                                <td>{formatDate(log.timestamp || log.createdAt)}</td>
                                                <td>
                                                    {log.admin ? log.admin.fullName :
                                                        log.user ? log.user.fullName : 'Система'}
                                                </td>
                                                <td>
                                                    <span className="admin-action-badge">
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td>
                                                    {log.targetEntityId ? `ID: ${log.targetEntityId}` : '-'}
                                                </td>
                                                <td>
                                                    <small>{log.details || 'Нет деталей'}</small>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Модальное окно для пользователей */}
            {showUserModal && selectedItem && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-content">
                        <div className="admin-modal-header">
                            <h2>
                                {actionType === 'activate' ? (selectedItem.isActive ? 'Деактивация' : 'Активация') :
                                    actionType === 'role' ? 'Изменение роли' : 'Сброс пароля'}
                            </h2>
                            <button className="admin-modal-close" onClick={() => setShowUserModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="admin-modal-body">
                            {actionType === 'activate' ? (
                                <p>
                                    Вы уверены, что хотите {selectedItem.isActive ? 'деактивировать' : 'активировать'} пользователя
                                    <strong> {selectedItem.fullName}</strong>?
                                </p>
                            ) : actionType === 'role' ? (
                                <p>
                                    Вы уверены, что хотите {selectedItem.role === 'ADMIN' ? 'снять права администратора' : 'назначить администратором'}
                                    пользователя <strong> {selectedItem.fullName}</strong>?
                                </p>
                            ) : (
                                <p>
                                    Вы уверены, что хотите сбросить пароль пользователя
                                    <strong> {selectedItem.fullName}</strong>?
                                    <br />
                                    <small>Пользователю будет отправлен временный пароль.</small>
                                </p>
                            )}

                            <div className="admin-form-group">
                                <label htmlFor="comment">Комментарий (опционально)</label>
                                <textarea
                                    id="comment"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Причина действия..."
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="admin-modal-footer">
                            <button
                                className="admin-btn admin-btn-outline"
                                onClick={() => setShowUserModal(false)}
                            >
                                Отмена
                            </button>
                            <button
                                className="admin-btn admin-btn-primary"
                                onClick={handleConfirmAction}
                            >
                                Подтвердить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно для галерей */}
            {showGalleryModal && selectedItem && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-content">
                        <div className="admin-modal-header">
                            <h2>
                                {actionType === 'approve' ? 'Одобрение галереи' :
                                    actionType === 'reject' ? 'Отклонение галереи' : 'Изменение статуса'}
                            </h2>
                            <button className="admin-modal-close" onClick={() => setShowGalleryModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="admin-modal-body">
                            <p>
                                Галерея: <strong>{selectedItem.name}</strong>
                                <br />
                                Владелец: {selectedItem.owner ? selectedItem.owner.fullName : 'Не указан'}
                            </p>

                            <div className="admin-form-group">
                                <label htmlFor="comment">
                                    {actionType === 'reject' ? 'Причина отклонения *' : 'Комментарий'}
                                    {actionType === 'reject' && <span className="admin-required">*</span>}
                                </label>
                                <textarea
                                    id="comment"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={actionType === 'reject' ? 'Обязательно укажите причину отклонения...' : 'Комментарий к действию...'}
                                    rows="4"
                                    required={actionType === 'reject'}
                                />
                            </div>
                        </div>

                        <div className="admin-modal-footer">
                            <button
                                className="admin-btn admin-btn-outline"
                                onClick={() => setShowGalleryModal(false)}
                            >
                                Отмена
                            </button>
                            <button
                                className={`admin-btn ${actionType === 'reject' ? 'admin-btn-danger' : 'admin-btn-primary'}`}
                                onClick={handleConfirmAction}
                                disabled={actionType === 'reject' && !comment.trim()}
                            >
                                {actionType === 'approve' ? 'Одобрить' :
                                    actionType === 'reject' ? 'Отклонить' : 'Сохранить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;