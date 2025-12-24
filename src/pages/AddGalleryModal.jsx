import React, { useState, useEffect, useRef } from 'react';
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

    // Состояния для загрузки логотипа
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [logoUploadError, setLogoUploadError] = useState('');
    const logoInputRef = useRef(null);

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

            // Если есть ссылка на логотип, показываем превью
            if (editData.logoUrl) {
                setLogoPreview(editData.logoUrl);
            }
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
            setLogoPreview('');
            setLogoFile(null);
        }
        setError('');
        setLogoUploadError('');
    }, [isEditMode, editData, show]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setGalleryData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Проверяем размер файла (макс. 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setLogoUploadError('Файл слишком большой (макс. 10MB)');
                return;
            }

            // Проверяем тип файла
            if (!file.type.startsWith('image/')) {
                setLogoUploadError('Пожалуйста, выберите файл изображения (JPG, PNG)');
                return;
            }

            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
            setLogoUploadError('');
            setGalleryData(prev => ({ ...prev, logoUrl: '' })); // Очищаем URL, если выбрали файл
        }
    };

    const removeLogo = () => {
        setLogoFile(null);
        setLogoPreview('');
        setGalleryData(prev => ({ ...prev, logoUrl: '' }));
        if (logoInputRef.current) {
            logoInputRef.current.value = '';
        }
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

        // Валидация email
        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(galleryData.contactEmail)) {
            setError('Введите корректный email адрес');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('authToken');

            if (!token) {
                throw new Error('Токен авторизации отсутствует');
            }

            // Определяем URL и метод
            const endpoint = isEditMode && editData && editData.id
                ? `${API_BASE_URL}/gallery-owner/galleries/${editData.id}`
                : `${API_BASE_URL}/gallery-owner/create-gallery`;

            const method = isEditMode ? 'PUT' : 'POST';

            // Проверяем, есть ли файл логотипа для загрузки
            if (logoFile) {
                // Для загрузки с файлом используем FormData
                const formData = new FormData();

                // Добавляем текстовые поля
                Object.keys(galleryData).forEach(key => {
                    if (key !== 'logoUrl' || !galleryData[key]) { // Не добавляем logoUrl если он пустой
                        formData.append(key, galleryData[key] || '');
                    }
                });

                // Добавляем файл
                formData.append('logoFile', logoFile);

                // Отправляем запрос с FormData
                const response = await fetch(endpoint, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        // НЕ УКАЗЫВАЕМ Content-Type для FormData - браузер сам установит правильный заголовок
                    },
                    body: formData
                });

                const data = await response.json();
                console.log('Response data with file:', data);

                if (response.ok) {
                    const message = isEditMode
                        ? 'Информация о галерее обновлена и отправлена на модерацию!'
                        : 'Заявка на создание галереи отправлена на модерацию!';

                    alert(message);
                    onSuccess();
                    onClose();
                } else {
                    setError(data.error || data.message || `Ошибка ${response.status} при сохранении галереи`);
                }
            } else {
                // Если нет файла, отправляем JSON
                const response = await fetch(endpoint, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(galleryData)
                });

                const data = await response.json();
                console.log('Response data without file:', data);

                if (response.ok) {
                    const message = isEditMode
                        ? 'Информация о галерее обновлена и отправлена на модерацию!'
                        : 'Заявка на создание галереи отправлена на модерацию!';

                    alert(message);
                    onSuccess();
                    onClose();
                } else {
                    setError(data.error || data.message || `Ошибка ${response.status} при сохранении галереи`);
                }
            }
        } catch (error) {
            console.error('Ошибка:', error);
            setError('Ошибка сети: ' + error.message);
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
                            <label>Логотип галереи</label>
                            <div className="logo-upload-container">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="file-input"
                                    ref={logoInputRef}
                                    style={{ display: 'none' }}
                                    id="gallery-logo-upload"
                                />

                                <div className="logo-preview-area">
                                    {logoPreview ? (
                                        <div className="logo-preview">
                                            <img
                                                src={logoPreview}
                                                alt="Превью логотипа"
                                                className="logo-preview-image"
                                            />
                                            <button
                                                type="button"
                                                className="remove-logo-btn"
                                                onClick={removeLogo}
                                                title="Удалить логотип"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="logo-upload-placeholder">
                                            <i className="fas fa-image"></i>
                                            <span>Загрузите логотип галереи</span>
                                            <small>Рекомендуемый размер: 200x200px</small>
                                        </div>
                                    )}
                                </div>

                                <div className="logo-upload-controls">
                                    <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        onClick={() => logoInputRef.current.click()}
                                    >
                                        <i className="fas fa-upload"></i>
                                        {logoPreview ? 'Изменить логотип' : 'Выбрать файл'}
                                    </button>

                                    <div className="logo-url-input">
                                        <label htmlFor="logoUrl">Или укажите ссылку:</label>
                                        <input
                                            type="url"
                                            id="logoUrl"
                                            name="logoUrl"
                                            value={galleryData.logoUrl}
                                            onChange={handleInputChange}
                                            placeholder="https://example.com/logo.png"
                                            disabled={!!logoPreview}
                                        />
                                    </div>
                                </div>

                                {logoUploadError && (
                                    <div className="logo-error-message">
                                        <i className="fas fa-exclamation-triangle"></i>
                                        {logoUploadError}
                                    </div>
                                )}

                                <div className="logo-upload-hint">
                                    <small>
                                        <i className="fas fa-info-circle"></i>
                                        Вы можете загрузить файл (макс. 10MB) или указать ссылку на изображение
                                    </small>
                                </div>
                            </div>
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