import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8080';

const AddExhibitionModal = ({ isOpen, onClose, onSuccess, selectedGallery, isEditMode, editData }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'DRAFT'
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (editData && isEditMode) {
            setFormData({
                title: editData.title || '',
                description: editData.description || '',
                startDate: editData.startDate ? new Date(editData.startDate).toISOString().slice(0, 16) : '',
                endDate: editData.endDate ? new Date(editData.endDate).toISOString().slice(0, 16) : '',
                status: editData.status || 'DRAFT'
            });
        } else if (!isEditMode) {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);

            setFormData({
                title: '',
                description: '',
                startDate: now.toISOString().slice(0, 16),
                endDate: tomorrow.toISOString().slice(0, 16),
                status: 'DRAFT'
            });
        }
    }, [editData, isEditMode]);

    if (!isOpen || !selectedGallery) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError('');

        try {
            const token = sessionStorage.getItem('authToken');

            const formatDateForServer = (dateString) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return '';

                return date.toISOString().replace('Z', '').split('.')[0];
            };

            const formattedData = {
                title: formData.title,
                description: formData.description || '',
                startDate: formatDateForServer(formData.startDate),
                endDate: formatDateForServer(formData.endDate)
            };

            console.log('Отправляемые данные:', formattedData);

            let response;
            let url;

            if (isEditMode && editData && editData.id) {
                url = `${API_BASE_URL}/gallery-owner/exhibitions/${editData.id}`;
                console.log('Редактирование выставки ID:', editData.id);

                formattedData.galleryId = selectedGallery.id;

                response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formattedData)
                });
            } else {
                url = `${API_BASE_URL}/gallery-owner/exhibitions`;
                console.log('Создание новой выставки');

                formattedData.galleryId = selectedGallery.id;

                response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formattedData)
                });
            }

            const responseText = await response.text();
            console.log('Ответ сервера:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Ошибка парсинга JSON:', parseError);
                data = { error: 'Ошибка парсинга ответа сервера' };
            }

            if (response.ok && data.success) {
                const message = isEditMode
                    ? 'Выставка успешно обновлена!'
                    : 'Выставка создана! Теперь вы можете добавить карту зала.';

                alert(message);
                onSuccess(data.exhibition || data);
                onClose();
            } else {
                setError(data.error || 'Ошибка при сохранении выставки');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            setError(`Ошибка: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    const modalTitle = isEditMode ? `Редактировать выставку "${editData?.title || ''}"` : 'Создать новую выставку';
    const submitButtonText = isEditMode ? 'Обновить выставку' : 'Создать выставку';

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

                        {success && (
                            <div className="alert alert-success">
                                <i className="fas fa-check-circle"></i>
                                {success}
                            </div>
                        )}

                        <div className="form-group">
                            <label>Галерея</label>
                            <div className="gallery-info">
                                <strong>{selectedGallery.name}</strong>
                                <small>{selectedGallery.address}</small>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="title">Название выставки</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="Например: 'Осенняя экспозиция 2024'"
                            />
                        </div>


                        <div className="form-group">
                            <label htmlFor="description">Описание</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Опишите вашу выставку..."
                            />
                        </div>

                        <div className="form-row">

                            <div className="form-group">
                                <label htmlFor="startDate">Дата начала </label>
                                <input
                                    type="datetime-local"
                                    id="startDate"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    required
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="endDate">Дата окончания </label>
                                <input
                                    type="datetime-local"
                                    id="endDate"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    required
                                    min={formData.startDate}
                                />
                            </div>
                        </div>

                        {isEditMode && (
                            <div className="form-group">
                                <label htmlFor="status">Статус</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="DRAFT">Черновик</option>
                                    <option value="ACTIVE">Активная</option>
                                </select>
                            </div>
                        )}


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
                            disabled={loading || !!success}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> {isEditMode ? 'Обновление...' : 'Создание...'}
                                </>
                            ) : (
                                submitButtonText
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddExhibitionModal;