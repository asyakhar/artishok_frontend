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
                return 'status-badge active';
            case 'PENDING':
                return 'status-badge pending';
            case 'REJECTED':
            case 'CANCELLED':
            case 'INACTIVE':
                return 'status-badge cancelled';
            case 'DRAFT':
                return 'status-badge draft';
            default:
                return 'status-badge';
        }
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'ADMIN':
                return 'role-badge admin';
            case 'GALLERY_OWNER':
                return 'role-badge owner';
            case 'ARTIST':
                return 'role-badge artist';
            default:
                return 'role-badge';
        }
    };

    if (loading.statistics) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Загрузка кабинета администратора...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Шапка профиля */}
            <div className="dashboard-header">
                <div className="profile-card">
                    <div className="profile-avatar">
                        {userData?.avatarUrl ? (
                            <img src={userData.avatarUrl} alt="Аватар" className="avatar-image" />
                        ) : (
                            <div className="avatar-placeholder admin">
                                <i className="fas fa-user-shield"></i>
                            </div>
                        )}
                    </div>
                    <div className="profile-info">
                        <h1 className="profile-name">{userData?.fullName || 'Администратор'}</h1>
                        <div className="profile-details">
                            <div className="detail-item">
                                <i className="fas fa-envelope"></i>
                                <span>{userData?.email || 'Email не указан'}</span>
                            </div>
                            <div className="detail-item">
                                <i className="fas fa-user-tag"></i>
                                <span className="role-badge admin">Администратор системы</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Статистика */}
            {statistics && (
                <div className="dashboard-stats">
                    <div className="stat-card">
                        <div className="stat-icon users">
                            <i className="fas fa-users"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{statistics.totalUsers || 0}</h3>
                            <p>Всего пользователей</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon active">
                            <i className="fas fa-user-check"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{statistics.activeUsers || 0}</h3>
                            <p>Активных пользователей</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon gallery">
                            <i className="fas fa-store"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{galleries.length}</h3>
                            <p>Галерей</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon artist">
                            <i className="fas fa-palette"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{statistics.artists || 0}</h3>
                            <p>Художников</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon owner">
                            <i className="fas fa-building"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{statistics.galleryOwners || 0}</h3>
                            <p>Владельцев галерей</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon exhibition">
                            <i className="fas fa-calendar-alt"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{exhibitions.length}</h3>
                            <p>Выставок</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Табы */}
            <div className="admin-tabs">
                <div className="tabs-header">
                    <h2>Управление системой</h2>
                </div>
                <div className="tabs-navigation">
                    <button
                        className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => handleTabChange('users')}
                    >
                        <i className="fas fa-users"></i> Пользователи
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'galleries' ? 'active' : ''}`}
                        onClick={() => handleTabChange('galleries')}
                    >
                        <i className="fas fa-store"></i> Галереи
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'exhibitions' ? 'active' : ''}`}
                        onClick={() => handleTabChange('exhibitions')}
                    >
                        <i className="fas fa-calendar-alt"></i> Выставки
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
                        onClick={() => handleTabChange('logs')}
                    >
                        <i className="fas fa-history"></i> Логи
                    </button>
                </div>
            </div>

            {/* Содержимое табов */}
            <div className="tab-content">
                {/* Таблица пользователей */}
                {activeTab === 'users' && (
                    <div className="users-section">
                        <div className="section-header">
                            <h3><i className="fas fa-users"></i> Управление пользователями</h3>
                            <button
                                className="btn btn-outline"
                                onClick={() => fetchUsers(sessionStorage.getItem('authToken'))}
                            >
                                <i className="fas fa-sync-alt"></i> Обновить
                            </button>
                        </div>

                        {loading.users ? (
                            <div className="loading-placeholder">Загрузка пользователей...</div>
                        ) : users.length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-users-slash"></i>
                                <p>Пользователи не найдены</p>
                            </div>
                        ) : (
                            <div className="table-container">
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
                                                    <div className="user-info">
                                                        {user.avatarUrl && (
                                                            <img src={user.avatarUrl} alt="" className="user-avatar" />
                                                        )}
                                                        <strong>{user.fullName}</strong>
                                                    </div>
                                                </td>
                                                <td>{user.email}</td>
                                                <td>
                                                    <span className={getRoleBadgeClass(user.role)}>
                                                        {user.role === 'GALLERY_OWNER' ?
                                                            <span className="owner-two-lines">
                                                                <span>Владелец</span>
                                                                <span>галереи</span>
                                                            </span> :
                                                            user.role === 'ADMIN' ? 'Админ' : 'Художник'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={getStatusBadgeClass(user.isActive ? 'ACTIVE' : 'INACTIVE')}>
                                                        {user.isActive ? 'Активен' : 'Неактивен'}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="table-actions">
                                                        <button
                                                            className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-success'}`}
                                                            onClick={() => handleUserAction(user, 'activate')}
                                                            title={user.isActive ? 'Деактивировать' : 'Активировать'}
                                                        >
                                                            <i className={`fas fa-${user.isActive ? 'user-slash' : 'user-check'}`}></i>
                                                        </button>
                                                        {user.role !== 'ADMIN' && (
                                                            <button
                                                                className="btn btn-warning btn-sm"
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
                    <div className="galleries-section">
                        <div className="section-header">
                            <h3><i className="fas fa-store"></i> Управление галереями</h3>
                            <button
                                className="btn btn-outline"
                                onClick={() => fetchGalleries(sessionStorage.getItem('authToken'))}
                            >
                                <i className="fas fa-sync-alt"></i> Обновить
                            </button>
                        </div>

                        {loading.galleries ? (
                            <div className="loading-placeholder">Загрузка галерей...</div>
                        ) : galleries.length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-store-alt-slash"></i>
                                <p>Галереи не найдены</p>
                            </div>
                        ) : (
                            <div className="table-container">
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
                                                        <small className="description">{gallery.description}</small>
                                                    )}
                                                </td>
                                                <td>{gallery.address}</td>
                                                <td>
                                                    {gallery.owner ? (
                                                        <div className="owner-info">
                                                            <span className="owner-name">{gallery.owner.fullName}</span>
                                                            <span className="owner-email">{gallery.owner.email}</span>
                                                        </div>
                                                    ) : 'Не указан'}
                                                </td>
                                                <td>
                                                    <span className={getStatusBadgeClass(gallery.status)}>
                                                        {gallery.status === 'APPROVED' ? 'Одобрена' :
                                                            gallery.status === 'PENDING' ? 'На модерации' : 'Отклонена'}
                                                    </span>
                                                    {gallery.adminComment && (
                                                        <div className="comment-badge" title={gallery.adminComment}>
                                                            <i className="fas fa-comment"></i>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>{formatDate(gallery.createdAt)}</td>
                                                <td>
                                                    <div className="table-actions">
                                                        {gallery.status === 'PENDING' && (
                                                            <>
                                                                <button
                                                                    className="btn btn-success btn-sm"
                                                                    onClick={() => handleGalleryAction(gallery, 'approve')}
                                                                    title="Одобрить"
                                                                >
                                                                    <i className="fas fa-check"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-danger btn-sm"
                                                                    onClick={() => handleGalleryAction(gallery, 'reject')}
                                                                    title="Отклонить"
                                                                >
                                                                    <i className="fas fa-times"></i>
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            className={`btn btn-sm ${gallery.status === 'APPROVED' ? 'btn-warning' : 'btn-primary'}`}
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
                    <div className="exhibitions-section">
                        <div className="section-header">
                            <h3><i className="fas fa-calendar-alt"></i> Управление выставками</h3>
                            <button
                                className="btn btn-outline"
                                onClick={() => fetchExhibitions(sessionStorage.getItem('authToken'))}
                            >
                                <i className="fas fa-sync-alt"></i> Обновить
                            </button>
                        </div>

                        {loading.exhibitions ? (
                            <div className="loading-placeholder">Загрузка выставок...</div>
                        ) : exhibitions.length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-calendar-times"></i>
                                <p>Выставки не найдены</p>
                            </div>
                        ) : (
                            <div className="table-container">
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
                                                        <small className="description">{exhibition.description}</small>
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
                                                    <div className="table-actions">
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => navigate(`/exhibitions/${exhibition.id}`)}
                                                            title="Просмотреть"
                                                        >
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-warning btn-sm"
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
                    <div className="logs-section">
                        <div className="section-header">
                            <h3><i className="fas fa-history"></i> Системные логи</h3>
                            <div className="log-tabs">
                                <button
                                    className={`log-tab-btn ${logsType === 'activity' ? 'active' : ''}`}
                                    onClick={() => setLogsType('activity')}
                                >
                                    Активность пользователей
                                </button>
                                <button
                                    className={`log-tab-btn ${logsType === 'audit' ? 'active' : ''}`}
                                    onClick={() => setLogsType('audit')}
                                >
                                    Админ логи
                                </button>
                            </div>
                        </div>

                        {loading.logs ? (
                            <div className="loading-placeholder">Загрузка логов...</div>
                        ) : (
                            <div className="table-container">
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
                                                    <span className="action-badge">
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
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>
                                {actionType === 'activate' ? (selectedItem.isActive ? 'Деактивация' : 'Активация') :
                                    actionType === 'role' ? 'Изменение роли' : 'Сброс пароля'}
                            </h3>
                            <button className="modal-close" onClick={() => setShowUserModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="modal-body">
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

                            <div className="form-group">
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

                        <div className="modal-footer">
                            <button
                                className="btn btn-outline"
                                onClick={() => setShowUserModal(false)}
                            >
                                Отмена
                            </button>
                            <button
                                className="btn btn-primary"
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
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>
                                {actionType === 'approve' ? 'Одобрение галереи' :
                                    actionType === 'reject' ? 'Отклонение галереи' : 'Изменение статуса'}
                            </h3>
                            <button className="modal-close" onClick={() => setShowGalleryModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="modal-body">
                            <p>
                                Галерея: <strong>{selectedItem.name}</strong>
                                <br />
                                Владелец: {selectedItem.owner ? selectedItem.owner.fullName : 'Не указан'}
                            </p>

                            <div className="form-group">
                                <label htmlFor="comment">
                                    {actionType === 'reject' ? 'Причина отклонения *' : 'Комментарий'}
                                    {actionType === 'reject' && <span className="required">*</span>}
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

                        <div className="modal-footer">
                            <button
                                className="btn btn-outline"
                                onClick={() => setShowGalleryModal(false)}
                            >
                                Отмена
                            </button>
                            <button
                                className={`btn ${actionType === 'reject' ? 'btn-danger' : 'btn-primary'}`}
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