import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownerApi } from '../api';

const MapSelection = ({ exhibitionId }) => {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadMaps();
  }, [exhibitionId]);

  const loadMaps = async () => {
    if (!exhibitionId) return;
    
    try {
      setLoading(true);
      const mapsData = await ownerApi.getHallMapsByEvent(exhibitionId);
      setMaps(mapsData || []);
    } catch (err) {
      console.error('Ошибка загрузки карт:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMap = async () => {
    if (!newMapName.trim()) {
      alert('Введите название карты');
      return;
    }

    try {
      setLoading(true);
      const newMap = await ownerApi.createHallMapWithImage({
        name: newMapName,
        exhibitionEventId: exhibitionId
      });
      
      navigate(`/map-editor/${newMap.id}`);
    } catch (err) {
      alert('Ошибка создания карты: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Выбор карты зала</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>Создать новую карту</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            value={newMapName}
            onChange={(e) => setNewMapName(e.target.value)}
            placeholder="Название карты"
            style={{ padding: '10px', width: '300px' }}
          />
          <button 
            onClick={handleCreateMap}
            disabled={loading}
            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none' }}
          >
            {loading ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </div>

      <div>
        <h3>Существующие карты</h3>
        {loading ? (
          <p>Загрузка...</p>
        ) : maps.length === 0 ? (
          <p>Нет созданных карт</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {maps.map(map => (
              <div key={map.id} style={{ 
                border: '1px solid #ddd', 
                padding: '20px', 
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              onClick={() => navigate(`/map-editor/${map.id}`)}>
                <h4>{map.name}</h4>
                <p>ID: {map.id}</p>
                {map.mapImageUrl && <p>✅ Есть изображение</p>}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/map-editor/${map.id}`);
                  }}
                  style={{ 
                    marginTop: '10px', 
                    padding: '8px 16px', 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    border: 'none' 
                  }}
                >
                  Редактировать
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapSelection;