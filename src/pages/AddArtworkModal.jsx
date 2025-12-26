import { useState, useRef } from 'react';
import './ArtistDashboard.css';

const API_BASE_URL = 'http://localhost:8080';

const AddArtworkModal = ({ isOpen, onClose, onSuccess, bookings, artistId, editData, isEditMode }) => {
    const [formData, setFormData] = useState(
        editData || {
            bookingId: '',
            title: '',
            description: '',
            creationYear: new Date().getFullYear(),
            technique: '',
            status: 'DRAFT'
        }
    );

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [imageUploadError, setImageUploadError] = useState('');
    const imageInputRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const modalTitle = isEditMode ? `Редактировать картину "${editData?.title || ''}"` : 'Добавить новую картину';

    // Сброс состояния при открытии/закрытии
    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Проверяем размер файла (макс. 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setImageUploadError('Файл слишком большой (макс. 10MB)');
                return;
            }

            // Проверяем тип файла
            if (!file.type.startsWith('image/')) {
                setImageUploadError('Пожалуйста, выберите файл изображения (JPG, PNG, GIF)');
                return;
            }

            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setImageUploadError('');
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview('');
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                throw new Error('Токен авторизации отсутствует');
            }

            let imageUrl = '';

            // 1. Загружаем изображение, если есть файл
            if (imageFile) {
                const imageFormData = new FormData();
                imageFormData.append('file', imageFile);
                imageFormData.append('category', 'artwork');
                // Можно передать bookingId или artworkId если редактирование
                if (isEditMode && editData?.id) {
                    imageFormData.append('entityId', editData.id);
                }

                const uploadResponse = await fetch(`${API_BASE_URL}/api/images/upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: imageFormData
                });

                const uploadData = await uploadResponse.json();

                if (!uploadResponse.ok) {
                    throw new Error(uploadData.error || 'Ошибка загрузки изображения');
                }

                imageUrl = uploadData.url;
            } else if (isEditMode && editData?.imageUrl) {
                // При редактировании оставляем старое изображение, если не выбрали новое
                imageUrl = editData.imageUrl;
            }

            // 2. Подготавливаем данные картины
            const artworkData = {
                title: formData.title,
                description: formData.description,
                creationYear: formData.creationYear ? parseInt(formData.creationYear) : null,
                technique: formData.technique,
                imageUrl: imageUrl, // Используем загруженный URL
                status: formData.status
            };

            let response;
            let url;

            if (isEditMode && editData?.id) {
                // Режим редактирования
                url = `${API_BASE_URL}/artworks/${editData.id}`;
                response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(artworkData)
                });
            } else {
                // Режим создания
                url = `${API_BASE_URL}/artworks?bookingId=${formData.bookingId}`;
                response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(artworkData)
                });
            }

            const data = await response.json();

            if (response.ok) {
                alert(isEditMode ? 'Картина успешно обновлена!' : 'Картина успешно добавлена!');
                onSuccess(); // Закрываем модалку и обновляем список
                onClose();
            } else {
                setError(data.error || (isEditMode ? 'Ошибка при обновлении картины' : 'Ошибка при добавлении картины'));
            }
        } catch (error) {
            console.error('Ошибка:', error);
            setError('Произошла ошибка при отправке данных: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getBookingInfo = (bookingId) => {
        const booking = bookings.find(b => b.id == bookingId);
        if (!booking) return null;

        const gallery = booking.exhibitionStand?.exhibitionHallMap?.exhibitionEvent?.gallery;
        const event = booking.exhibitionStand?.exhibitionHallMap?.exhibitionEvent;

        return {
            galleryName: gallery?.name || 'Не указано',
            eventName: event?.title || 'Не указано',
            standNumber: booking.exhibitionStand?.standNumber || 'Не указан'
        };
    };

    return (
        <div className="artist-modal-overlay">
            <div className="artist-modal-content">
                <div className="artist-modal-header">
                    <h2>{modalTitle}</h2>
                    <button className="artist-modal-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="artist-modal-body">
                        {error && (
                            <div className="artist-alert artist-alert-error">
                                <i className="fas fa-exclamation-circle"></i>
                                {error}
                            </div>
                        )}

                        {/* Выбор бронирования */}
                        <div className="artist-form-group">
                            <label htmlFor="bookingId">Выберите бронирование *</label>
                            <select
                                id="bookingId"
                                name="bookingId"
                                value={formData.bookingId}
                                onChange={handleChange}
                                required
                                disabled={isEditMode}
                            >
                                <option value="">Выберите бронирование</option>
                                {bookings.map(booking => {
                                    const gallery = booking.exhibitionStand?.exhibitionHallMap?.exhibitionEvent?.gallery;
                                    const event = booking.exhibitionStand?.exhibitionHallMap?.exhibitionEvent;
                                    return (
                                        <option key={booking.id} value={booking.id}>
                                            Бронирование #{booking.id} - {gallery?.name || 'Галерея'} ({event?.title || 'Мероприятие'})
                                        </option>
                                    );
                                })}
                            </select>

                            {formData.bookingId && (
                                <div className="artist-booking-info">
                                    <small>
                                        <strong>Информация о бронировании:</strong><br />
                                        {(() => {
                                            const info = getBookingInfo(formData.bookingId);
                                            return info ? (
                                                <>
                                                    Галерея: {info.galleryName}<br />
                                                    Мероприятие: {info.eventName}<br />
                                                    Стенд: {info.standNumber}
                                                </>
                                            ) : 'Информация не найдена';
                                        })()}
                                    </small>
                                </div>
                            )}
                        </div>

                        {/* Название */}
                        <div className="artist-form-group">
                            <label htmlFor="title">Название картины *</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="Например: 'Звездная ночь'"
                            />
                        </div>

                        {/* Описание */}
                        <div className="artist-form-group">
                            <label htmlFor="description">Описание</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Опишите вашу картину..."
                            />
                        </div>

                        <div className="artist-form-row">
                            {/* Год создания */}
                            <div className="artist-form-group">
                                <label htmlFor="creationYear">Год создания</label>
                                <input
                                    type="number"
                                    id="creationYear"
                                    name="creationYear"
                                    value={formData.creationYear}
                                    onChange={handleChange}
                                    min="1900"
                                    max={new Date().getFullYear()}
                                    placeholder="2024"
                                />
                            </div>

                            {/* Техника исполнения */}
                            <div className="artist-form-group">
                                <label htmlFor="technique">Техника исполнения</label>
                                <input
                                    type="text"
                                    id="technique"
                                    name="technique"
                                    value={formData.technique}
                                    onChange={handleChange}
                                    placeholder="Например: масло, акрил, акварель"
                                />
                            </div>
                        </div>

                        {/* Загрузка изображения */}
                        <div className="artist-form-group">
                            <label>Изображение картины *</label>
                            <div className="artist-image-upload-container">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="artist-file-input"
                                    ref={imageInputRef}
                                    style={{ display: 'none' }}
                                    id="artwork-image-upload"
                                />

                                <div className="artist-image-preview-area">
                                    {imagePreview ? (
                                        <div className="artist-image-preview">
                                            <img
                                                src={imagePreview}
                                                alt="Превью картины"
                                                className="artist-preview-image"
                                            />
                                            <button
                                                type="button"
                                                className="artist-remove-image-btn"
                                                onClick={removeImage}
                                                title="Удалить изображение"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ) : isEditMode && editData?.imageUrl ? (
                                        <div className="artist-image-preview">
                                            <img
                                                src={editData.imageUrl}
                                                alt="Текущее изображение"
                                                className="artist-preview-image"
                                            />
                                            <small className="artist-current-image-note">Текущее изображение</small>
                                        </div>
                                    ) : (
                                        <div className="artist-image-upload-placeholder">
                                            <i className="fas fa-image"></i>
                                            <span>Загрузите изображение картины</span>
                                            <small>Рекомендуемый размер: не менее 800x600px</small>
                                            <small>Форматы: JPG, PNG, GIF (макс. 10MB)</small>
                                        </div>
                                    )}
                                </div>

                                <div className="artist-image-upload-controls">
                                    <button
                                        type="button"
                                        className="artist-btn artist-btn-outline artist-btn-sm"
                                        onClick={() => imageInputRef.current.click()}
                                    >
                                        <i className="fas fa-upload"></i>
                                        {imagePreview || (isEditMode && editData?.imageUrl) ? 'Изменить изображение' : 'Выбрать файл'}
                                    </button>
                                </div>

                                {imageUploadError && (
                                    <div className="artist-upload-error-message">
                                        <i className="fas fa-exclamation-triangle"></i>
                                        {imageUploadError}
                                    </div>
                                )}

                                <div className="artist-upload-hint">
                                    <small>
                                        <i className="fas fa-info-circle"></i>
                                        Изображение обязательно для добавления картины. Выберите качественное фото вашей работы.
                                    </small>
                                </div>
                            </div>
                        </div>

                        {/* Статус */}
                        <div className="artist-form-group">
                            <label htmlFor="status">Статус</label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="DRAFT">Черновик</option>
                                <option value="PUBLISHED">Опубликовать сразу</option>
                            </select>
                        </div>
                    </div>

                    <div className="artist-modal-footer">
                        <button
                            type="button"
                            className="artist-btn artist-btn-outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="artist-btn artist-btn-primary"
                            disabled={loading || (!isEditMode && !imageFile)}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    {isEditMode ? 'Сохранение...' : 'Добавление...'}
                                </>
                            ) : (
                                isEditMode ? 'Сохранить изменения' : 'Добавить картину'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddArtworkModal;