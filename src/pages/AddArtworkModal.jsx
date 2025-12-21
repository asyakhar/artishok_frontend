import { useState } from 'react';
import './ArtistDashboard.css'; // или создайте отдельный CSS

const API_BASE_URL = 'http://localhost:8080';

const AddArtworkModal = ({ isOpen, onClose, onSuccess, bookings, artistId, editData, isEditMode }) => {
    const [formData, setFormData] = useState(
        editData || { // Если есть данные для редактирования - используем их
            bookingId: '',
            title: '',
            description: '',
            creationYear: new Date().getFullYear(),
            technique: '',
            imageUrl: '',
            status: 'DRAFT'
        }
    );
    const modalTitle = isEditMode ? `Редактировать картину "${editData?.title || ''}"` : 'Добавить новую картину';
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = localStorage.getItem('authToken');
            const artworkData = {
                title: formData.title,
                description: formData.description,
                creationYear: formData.creationYear ? parseInt(formData.creationYear) : null,
                technique: formData.technique,
                imageUrl: formData.imageUrl,
                status: formData.status
            };

            let response;

            if (isEditMode && editData?.id) {
                // Режим редактирования: PUT-запрос
                response = await fetch(`${API_BASE_URL}/artworks/${editData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(artworkData)
                });
            } else {
                // Режим создания: POST-запрос
                response = await fetch(
                    `${API_BASE_URL}/artworks?bookingId=${formData.bookingId}`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(artworkData)
                    }
                );
            }

            const data = await response.json();

            if (response.ok) {
                alert(isEditMode ? 'Картина успешно обновлена!' : 'Картина успешно добавлена!');
                onSuccess(); // Закрываем модалку и обновляем список
            } else {
                setError(data.error || (isEditMode ? 'Ошибка при обновлении картины' : 'Ошибка при добавлении картины'));
            }
        } catch (error) {
            console.error('Ошибка:', error);
            setError('Произошла ошибка при отправке данных');
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
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{modalTitle}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && (
                            <div className="alert alert-error">
                                <i className="fas fa-exclamation-circle"></i>
                                {error}
                            </div>
                        )}

                        {/* Выбор бронирования */}
                        <div className="form-group">
                            <label htmlFor="bookingId">Выберите бронирование *</label>
                            <select
                                id="bookingId"
                                name="bookingId"
                                value={formData.bookingId}
                                onChange={handleChange}
                                required
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
                                <div className="booking-info">
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
                        <div className="form-group">
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
                        <div className="form-group">
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

                        <div className="form-row">
                            {/* Год создания */}
                            <div className="form-group">
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
                            <div className="form-group">
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

                        {/* Ссылка на изображение */}
                        <div className="form-group">
                            <label htmlFor="imageUrl">Ссылка на изображение (URL)</label>
                            <input
                                type="url"
                                id="imageUrl"
                                name="imageUrl"
                                value={formData.imageUrl}
                                onChange={handleChange}
                                placeholder="https://example.com/image.jpg"
                            />
                            {formData.imageUrl && (
                                <div className="image-preview">
                                    <small>Предпросмотр:</small>
                                    <img
                                        src={formData.imageUrl}
                                        alt="Предпросмотр"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Статус */}
                        <div className="form-group">
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
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Добавление...
                                </>
                            ) : (
                                'Добавить картину'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddArtworkModal;