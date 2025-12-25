import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MapEditor from '../components/MapEditor';
import { artistApi, commonApi, ownerApi } from '../api';
import './ExhibitionMapPage.css';

const ExhibitionMapPage = () => {
  const { exhibitionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exhibition, setExhibition] = useState(null);
  const [hallMaps, setHallMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);
  const [stands, setStands] = useState([]);
  const [mode, setMode] = useState(null); // 'owner' | 'artist'
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Получаем роль пользователя из localStorage
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const role = user?.role || user?.authorities?.[0];
    
    if (role === 'GALLERY_OWNER' || role === 'ADMIN') {
      setUserRole('GALLERY_OWNER');
      setMode('owner');
    } else if (role === 'ARTIST') {
      setUserRole('ARTIST');
      setMode('artist');
    } else {
      // Если нет роли или не авторизован - редирект на логин
      window.location.href = '/login';
      return;
    }
    
    loadExhibitionData();
  }, [exhibitionId]);

  const loadExhibitionData = async () => {
    try {
      setLoading(true);
      
      // 1. Загружаем выставку
      const exhibitionData = await commonApi.getExhibitionById(exhibitionId);
      setExhibition(exhibitionData);
      
      // 2. Загружаем карты залов С СОСТЯВДАМИ
      const mapsData = await commonApi.getHallMapsByEvent(exhibitionId);
      console.log('Получены карты залов:', mapsData);
      
      setHallMaps(mapsData);
      
      if (mapsData.length > 0) {
        const firstMap = mapsData[0];
        setSelectedMap(firstMap);
        
        // Проверяем, есть ли стенды в данных карты
        if (firstMap.exhibitionStands && firstMap.exhibitionStands.length > 0) {
          console.log('Стенды загружены вместе с картой:', firstMap.exhibitionStands.length);
          setStands(firstMap.exhibitionStands);
        } else {
          // Если нет, загружаем отдельно
          await loadStandsForMap(firstMap.id);
        }
      } else {
        setStands([]);
      }
      
    } catch (err) {
      console.error('Полная ошибка загрузки:', err);
      setError('Ошибка загрузки: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };
  

  const loadStandsForMap = async (hallMapId) => {
    try {
      if (!hallMapId) {
        console.warn('Нет ID карты для загрузки стендов');
        return;
      }
      
      console.log('Загрузка стендов для карты:', hallMapId);
      
      const standsData = await ownerApi.getStandsByHallMap(hallMapId);
      console.log('Получены стенды от API:', standsData);
      
      if (Array.isArray(standsData)) {
        setStands(standsData);
      } else if (standsData && standsData.stands) {
        setStands(standsData.stands);
      } else {
        console.warn('Неверный формат данных стендов:', standsData);
        setStands([]);
      }
      
    } catch (err) {
      console.error('Ошибка загрузки стендов:', err);
      setStands([]);
    }
  };
  const refreshStands = async () => {
    if (selectedMap?.id) {
      await loadStandsForMap(selectedMap.id);
    }
  };
  const handleDeleteStand = async (standId) => {
    if (!window.confirm('Удалить этот стенд?')) {
      return;
    }
    
    try {
      await ownerApi.deleteStand(standId);
      
      // Сразу обновляем состояние стендов
      setStands(prev => prev.filter(stand => stand.id !== standId));
      
      alert('✅ Стенд успешно удален');
    } catch (error) {
      console.error('Ошибка удаления стенда:', error);
      alert('❌ Ошибка удаления: ' + (error.response?.data?.error || error.message));
    }
  };
  // ========== ОБРАБОТЧИКИ ДЛЯ ВЛАДЕЛЬЦА ==========
  const handleUploadHallMap = async (imageFile, name = 'Карта зала') => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('exhibitionEventId', exhibitionId); // убедитесь, что exhibitionId доступен
    if (imageFile) {
      formData.append('mapImage', imageFile); // ← именно файл, не URL!
    }
  
    try {
      // Предполагается, что ownerApi.uploadHallMapWithImage отправляет FormData
      const response = await ownerApi.uploadHallMapWithImage(formData);
  
      // Обновляем данные
      const mapsData = await commonApi.getHallMapsByEvent(exhibitionId);
      setHallMaps(mapsData);
      if (mapsData.length > 0) {
        setSelectedMap(mapsData[0]);
        await loadStandsForMap(mapsData[0].id);
      }
      return response;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Ошибка загрузки карты');
    }
  };

  const handleCreateStand = async (standData) => {
    try {
      // Форматируем данные для нового DTO
      const dtoData = {
        exhibitionHallMapId: selectedMap.id, // Берем ID выбранной карты
        standNumber: standData.standNumber,
        positionX: standData.positionX,
        positionY: standData.positionY,
        width: standData.width,
        height: standData.height,
        type: standData.type, // Должно быть 'WALL', 'BOOTH' или 'OPEN_SPACE'
        status: standData.status || 'AVAILABLE'
      };
      
      console.log('Отправляемые данные:', JSON.stringify(dtoData, null, 2));
      
      // Отправляем запрос
      const newStand = await ownerApi.createStand(dtoData);
      console.log('Ответ сервера:', newStand);
      
      // Добавляем в локальное состояние
      setStands(prev => [...prev, {
        id: newStand.id,
        standNumber: newStand.standNumber,
        positionX: newStand.positionX,
        positionY: newStand.positionY,
        width: newStand.width,
        height: newStand.height,
        type: newStand.type,
        status: newStand.status,
        exhibitionHallMapId: newStand.exhibitionHallMapId
      }]);
      
      return newStand;
    } catch (error) {
      console.error('Полная ошибка создания стенда:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message;
      throw new Error('Ошибка создания стенда: ' + errorMessage);
    }
  };

  const handleChangeStandStatus = async (standId, status) => {
    try {
      const response = await ownerApi.changeStandStatus(standId, status);
      // Обновляем статус локально
      setStands(prev => prev.map(stand => 
        stand.id === standId ? { ...stand, status } : stand
      ));
      return response;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Ошибка изменения статуса');
    }
  };
  

  // ========== ОБРАБОТЧИКИ ДЛЯ ХУДОЖНИКА ==========
  const handleBookStand = async (standId) => {
    try {
      const response = await artistApi.createBooking(standId);
      
      // Обновляем локально: AVAILABLE → PENDING
      setStands(prev => prev.map(stand => 
        stand.id === standId ? { ...stand, status: 'PENDING' } : stand
      ));
      
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка бронирования');
    }
  };
  const handleApproveBooking = async (standId) => {
    try {
      console.log('Подтверждение бронирования для стенда:', standId);
  
      // 1. Получаем бронирования
      const response = await ownerApi.getPendingBookings();
      console.log('Ответ от getPendingBookings:', response);
  
      // 2. Извлекаем массив bookings
      const bookingsArray = response.bookings || response;
  
      if (!Array.isArray(bookingsArray)) {
        console.error('bookingsArray не является массивом:', bookingsArray);
        alert('Ошибка: получены некорректные данные о бронированиях');
        return;
      }
  
      console.log('Массив бронирований:', bookingsArray);
  
      // 3. Ищем бронирование: используем == для сравнения числа и строки
      const booking = bookingsArray.find(b => {
        const bookingStandId = b.exhibitionStandId;
        console.log(`Сравниваем: bookingStandId=${bookingStandId} (тип: ${typeof bookingStandId}), standId=${standId} (тип: ${typeof standId})`);
        return bookingStandId == standId; // ← ИСПОЛЬЗУЕМ ==, а не ===
      });
  
      console.log('Найденное бронирование:', booking);
  
      if (!booking) {
        alert('Бронирование для этого стенда не найдено.\n\n' +
              'Убедитесь, что:\n' +
              '- Вы владелец этой выставки\n' +
              '- Бронирование ещё не подтверждено или отклонено');
        return;
      }
  
      // 4. Подтверждаем бронирование
      await ownerApi.approveBooking(booking.id);
      console.log('Бронирование подтверждено, ID:', booking.id);
  
      // 5. Обновляем стенды
      await refreshStands();
  
      alert('✅ Бронирование подтверждено!');
  
    } catch (error) {
      console.error('Ошибка подтверждения:', error);
      alert(`❌ Ошибка: ${error.response?.data?.error || error.message}`);
    }
  };
  
  const handleRejectBooking = async (standId) => {
    try {
      console.log('Отклонение бронирования для стенда:', standId);
  
      const reason = prompt('Укажите причину отклонения бронирования:');
      if (!reason || reason.trim() === '') {
        alert('Причина отклонения обязательна');
        return;
      }
  
      // 1. Получаем бронирования
      const response = await ownerApi.getPendingBookings();
      const bookingsArray = response.bookings || response;
  
      if (!Array.isArray(bookingsArray)) {
        alert('Ошибка: получены некорректные данные о бронированиях');
        return;
      }
  
      // 2. Ищем бронирование с ==
      const booking = bookingsArray.find(b => b.exhibitionStandId == standId);
  
      if (!booking) {
        alert('Бронирование для этого стенда не найдено');
        return;
      }
  
      // 3. Отклоняем
      await ownerApi.rejectBooking(booking.id, reason);
      await refreshStands();
  
      alert('❌ Бронирование отклонено!');
  
    } catch (error) {
      console.error('Ошибка отклонения:', error);
      alert(`❌ Ошибка: ${error.response?.data?.error || error.message}`);
    }
  };
  // const handleApproveBooking = async (standId) => {
  //   try {
  //     console.log('Подтверждение бронирования для стенда:', standId);
      
  //     // 1. Получаем бронирования
  //     const response = await ownerApi.getPendingBookings();
  //     console.log('Ответ от getPendingBookings:', response);
      
  //     // 2. Извлекаем массив bookings из ответа
  //     // Ответ имеет структуру: { "bookings": [...] }
  //     const bookingsArray = response.bookings || response.data?.bookings || response;
      
  //     console.log('Массив бронирований:', bookingsArray);
  //     console.log('Это массив?', Array.isArray(bookingsArray));
      
  //     // 3. Проверяем что это массив
  //     if (!Array.isArray(bookingsArray)) {
  //       console.error('bookingsArray не является массивом:', bookingsArray);
  //       alert('Ошибка: получены некорректные данные о бронированиях');
  //       return;
  //     }
      
  //     // 4. Ищем бронирование для этого стенда
  //     const booking = bookingsArray.find(b => {
  //       // Используем exhibitionStandId из структуры ответа
  //       const bookingStandId = b.exhibitionStandId || b.exhibitionStand?.id || b.stand?.id;
  //       console.log(`Сравниваем: bookingStandId=${bookingStandId}, standId=${standId}`);
  //       return bookingStandId === standId;
  //     });
      
  //     console.log('Найденное бронирование:', booking);
      
  //     if (!booking) {
  //       alert('Бронирование для этого стенда не найдено');
  //       return;
  //     }
      
  //     // 5. Подтверждаем бронирование
  //     const approveResponse = await ownerApi.approveBooking(booking.id);
  //     console.log('Ответ подтверждения:', approveResponse);
      
  //     // 6. Обновляем стенды
  //     await refreshStands();
      
  //     alert('✅ Бронирование подтверждено!');
      
  //   } catch (error) {
  //     console.error('Ошибка подтверждения:', error);
  //     alert(`❌ Ошибка: ${error.response?.data?.error || error.message}`);
  //   }
  // };
  
  // const handleRejectBooking = async (standId) => {
  //   try {
  //     console.log('Отклонение бронирования для стенда:', standId);
      
  //     // Запрашиваем причину
  //     const reason = prompt('Укажите причину отклонения бронирования:');
  //     if (!reason || reason.trim() === '') {
  //       alert('Причина отклонения обязательна');
  //       return;
  //     }
      
  //     // 1. Получаем бронирования
  //     const response = await ownerApi.getPendingBookings();
      
  //     // 2. Извлекаем массив bookings из ответа
  //     const bookingsArray = response.bookings || response.data?.bookings || response;
      
  //     if (!Array.isArray(bookingsArray)) {
  //       alert('Ошибка: получены некорректные данные о бронированиях');
  //       return;
  //     }
      
  //     // 3. Ищем бронирование
  //     const booking = bookingsArray.find(b => {
  //       const bookingStandId = b.exhibitionStandId || b.exhibitionStand?.id || b.stand?.id;
  //       return bookingStandId === standId;
  //     });
      
  //     if (!booking) {
  //       alert('Бронирование для этого стенда не найдено');
  //       return;
  //     }
      
  //     // 4. Отклоняем бронирование
  //     const rejectResponse = await ownerApi.rejectBooking(booking.id, reason);
  //     console.log('Ответ отклонения:', rejectResponse);
      
  //     // 5. Обновляем стенды
  //     await refreshStands();
      
  //     alert('❌ Бронирование отклонено!');
      
  //   } catch (error) {
  //     console.error('Ошибка отклонения:', error);
  //     alert(`❌ Ошибка: ${error.response?.data?.error || error.message}`);
  //   }
  // };

  const handleMapSelect = async (mapId) => {
    const map = hallMaps.find(m => m.id === mapId);
    setSelectedMap(map);
    if (map) {
      await loadStandsForMap(map.id);
    }
  };

  if (loading) {
    return (
      <div className="exhibition-map-page loading">
        <div className="spinner"></div>
        <p>Загрузка карты выставки...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exhibition-map-page error">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Повторить</button>
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="exhibition-map-page error">
        <h2>Требуется авторизация</h2>
        <p>Пожалуйста, войдите в систему</p>
        <button onClick={() => window.location.href = '/login'}>Войти</button>
      </div>
    );
  }

  return (
    <div className="exhibition-map-page">
      <div className="map-header">
        <div className="exhibition-info">
          <h1>{exhibition?.title || 'Выставка'}</h1>
          <div className="details">
            {exhibition?.startDate && exhibition?.endDate && (
              <span className="dates">
                {new Date(exhibition.startDate).toLocaleDateString()} - 
                {new Date(exhibition.endDate).toLocaleDateString()}
              </span>
            )}
            {exhibition?.gallery && (
              <span className="gallery">Галерея: {exhibition.gallery.name}</span>
            )}
          </div>
        </div>
        
        <div className="header-controls">
          {/* <div className="mode-indicator">
            <span className="label">Режим:</span>
            <span className={`mode-badge ${mode}`}>
              {mode === 'owner' ? 'Владелец галереи' : 'Художник'}
            </span>
          </div> */}
          
          {/* {hallMaps.length > 0 && (
            <div className="map-selector">
              <label>Карта зала:</label>
              <select 
                value={selectedMap?.id || ''}
                onChange={(e) => handleMapSelect(Number(e.target.value))}
              >
                {hallMaps.map(map => (
                  <option key={map.id} value={map.id}>
                    {map.name || `Карта #${map.id}`}
                  </option>
                ))}
              </select>
            </div>
          )} */}
        </div>
      </div>

      <div className="map-container">
        <MapEditor
          mode={mode}
          hallMap={selectedMap}
          stands={stands}
          exhibitionId={exhibitionId} 
          // Обработчики для владельца
          onUploadHallMap={handleUploadHallMap}
          onCreateStand={handleCreateStand}
          onChangeStandStatus={handleChangeStandStatus}
          
          // Обработчики для художника
          onBookStand={handleBookStand}
          onDeleteStand={handleDeleteStand} 
          onRefreshStands={refreshStands} 

          onApproveBooking={handleApproveBooking}  
  onRejectBooking={handleRejectBooking} 
          // Общие
          onStandSelect={(stand) => {
            console.log('Выбран стенд:', stand);
          }}
        />
      </div>
    </div>
  );
};

export default ExhibitionMapPage;