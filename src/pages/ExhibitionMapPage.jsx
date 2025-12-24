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
      
      // 2. Загружаем карты залов
      const mapsData = await commonApi.getHallMapsByEvent(exhibitionId);
      setHallMaps(mapsData);
      
      if (mapsData.length > 0) {
        const firstMap = mapsData[0];
        setSelectedMap(firstMap);
        await loadStandsForMap(firstMap.id);
      } else {
        // Если нет карт, создаем пустой массив стендов
        setStands([]);
      }
      
    } catch (err) {
      setError('Ошибка загрузки: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadStandsForMap = async (hallMapId) => {
    try {
      if (mode === 'owner') {
        // Для владельца загружаем все стенды
        const ownerStands = await ownerApi.getExhibitionStands(exhibitionId);
        setStands(ownerStands.stands || ownerStands || []);
      } else if (mode === 'artist') {
        // Для художника загружаем доступные стенды
        const availableStands = await artistApi.getAvailableStands(exhibitionId);
        const standsData = availableStands.stands || availableStands || [];
        
        // Обновляем статусы стендов
        setStands(standsData.map(stand => ({
          ...stand,
          available: true // Все стенды из этого endpoint доступны
        })));
      }
    } catch (err) {
      console.error('Ошибка загрузки стендов:', err);
      setStands([]);
    }
  };

  // ========== ОБРАБОТЧИКИ ДЛЯ ВЛАДЕЛЬЦА ==========
  const handleUploadHallMap = async (mapImageUrl, name = 'Карта зала') => {
    try {
      const response = await ownerApi.uploadHallMap(exhibitionId, { mapImageUrl, name });
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
      const response = await ownerApi.addExhibitionStand(exhibitionId, standData);
      // Обновляем стенды
      await loadStandsForMap(selectedMap.id);
      return response;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Ошибка создания стенда');
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
      // Обновляем стенды - помечаем как недоступные
      setStands(prev => prev.map(stand => 
        stand.id === standId ? { ...stand, available: false } : stand
      ));
      return response;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Ошибка бронирования');
    }
  };

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
          <div className="mode-indicator">
            <span className="label">Режим:</span>
            <span className={`mode-badge ${mode}`}>
              {mode === 'owner' ? 'Владелец галереи' : 'Художник'}
            </span>
          </div>
          
          {hallMaps.length > 0 && (
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
          )}
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