import React, { useState, useEffect } from 'react';
import './AddGalleryModal.css';
const API_BASE_URL = 'http://localhost:8080';
const AddGalleryModal = ({
    show,
    onClose,
    onSuccess,
    isEditMode,
    editData
}) => {
    const [galleryData, setGalleryData] = useState({
        name: '',
        description: '',
        address: '',
        contactPhone: '',
        contactEmail: '',
        logoUrl: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditMode && editData) {
            // Заполняем форму данными для редактирования
            setGalleryData({
                name: editData.name || '',
                description: editData.description || '',
                address: editData.address || '',
                contactPhone: editData.contactPhone || '',
                contactEmail: editData.contactEmail || '',
                logoUrl: editData.logoUrl || ''
            });
        } else {
            // Сбрасываем форму для создания
            setGalleryData({
                name: '',
                description: '',
                address: '',
                contactPhone: '',
                contactEmail: '',
                logoUrl: ''
            });
        }
        setError('');
    }, [isEditMode, editData, show]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setGalleryData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Валидация
        if (!galleryData.name.trim()) {
            setError('Название галереи обязательно');
            return;
        }
        if (!galleryData.address.trim()) {
            setError('Адрес обязателен');
            return;
        }
        if (!galleryData.contactEmail.trim()) {
            setError('Email обязателен');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('authToken');
            let response;
            let url;

            if (isEditMode && editData && editData.id) {
                // РЕДАКТИРОВАНИЕ
                url = `${API_BASE_URL}/gallery-owner/galleries/${editData.id}`;
                response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(galleryData)
                });
            } else {
                // СОЗДАНИЕ
                url = `${API_BASE_URL}/gallery-owner/create-gallery`;
                response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(galleryData)
                });
            }

            const data = await response.json();

            if (response.ok && data.success) {
                const message = isEditMode
                    ? 'Информация о галерее обновлена и отправлена на модерацию!'
                    : 'Заявка на создание галереи отправлена на модерацию!';

                alert(message);
                onSuccess();
                onClose();
            } else {
                setError(data.error || 'Ошибка при сохранении галереи');
            }
        } catch (error) {
            setError('Ошибка сети: ' + error.message);
            console.error('Ошибка:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    const modalTitle = isEditMode ? 'Редактировать галерею' : 'Создать новую галерею';
    const submitButtonText = isEditMode ? 'Сохранить изменения' : 'Создать галерею';

    return (
        <div className="modal-overlay">
            <div className="modal-content gallery-modal">
                <div className="modal-header">
                    <h2>{modalTitle}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div className="error-message">
                            <i className="fas fa-exclamation-circle"></i>
                            {error}
                        </div>
                    )}

                    <form className="gallery-form">
                        <div className="form-group">
                            <label htmlFor="name">Название галереи *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={galleryData.name}
                                onChange={handleInputChange}
                                placeholder="Введите название галереи"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Описание</label>
                            <textarea
                                id="description"
                                name="description"
                                value={galleryData.description}
                                onChange={handleInputChange}
                                placeholder="Опишите вашу галерею"
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="address">Адрес *</label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                value={galleryData.address}
                                onChange={handleInputChange}
                                placeholder="Полный адрес галереи"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="contactPhone">Телефон</label>
                                <input
                                    type="tel"
                                    id="contactPhone"
                                    name="contactPhone"
                                    value={galleryData.contactPhone}
                                    onChange={handleInputChange}
                                    placeholder="+7 (XXX) XXX-XX-XX"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="contactEmail">Email *</label>
                                <input
                                    type="email"
                                    id="contactEmail"
                                    name="contactEmail"
                                    value={galleryData.contactEmail}
                                    onChange={handleInputChange}
                                    placeholder="email@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="logoUrl">Ссылка на логотип</label>
                            <input
                                type="url"
                                id="logoUrl"
                                name="logoUrl"
                                value={galleryData.logoUrl}
                                onChange={handleInputChange}
                                placeholder="https://example.com/logo.png"
                            />
                        </div>
                    </form>
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Отмена
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-small"></span>
                                {isEditMode ? 'Сохранение...' : 'Создание...'}
                            </>
                        ) : submitButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddGalleryModal;