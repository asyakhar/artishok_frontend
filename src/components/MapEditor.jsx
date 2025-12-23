import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapEditor.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapEditor = ({ mode, hallMap, stands, onUploadHallMap, onCreateStand, onBookStand }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const imageOverlayRef = useRef(null);
  const [selectedStand, setSelectedStand] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawRectangle, setDrawRectangle] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [mapImage, setMapImage] = useState(null);
  const [tempStands, setTempStands] = useState([]);

  // ========== ИНИЦИАЛИЗАЦИЯ КАРТЫ ==========
  useEffect(() => {
    if (!mapRef.current) return;

    mapInstance.current = L.map(mapRef.current, {
      crs: L.CRS.Simple, // Используем простую систему координат для изображений
      minZoom: -2,
      maxZoom: 5,
      zoomControl: false
    });

    // Загружаем изображение, если оно есть
    if (hallMap?.mapImageUrl || mapImage) {
      loadHallMapImage(hallMap?.mapImageUrl || mapImage);
    }

    // Рисуем существующие стенды
    renderStands();

    // Обработчик клика для рисования (только для владельца)
    if (mode === 'owner') {
      mapInstance.current.on('mousedown', handleMapMouseDown);
      mapInstance.current.on('mousemove', handleMapMouseMove);
      mapInstance.current.on('mouseup', handleMapMouseUp);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.off('mousedown');
        mapInstance.current.off('mousemove');
        mapInstance.current.off('mouseup');
        mapInstance.current.remove();
      }
    };
  }, [mode]);

  // ========== ЗАГРУЗКА ИЗОБРАЖЕНИЯ ЗАЛА ==========
  const loadHallMapImage = (imageUrl) => {
    if (!mapInstance.current || !imageUrl) return;

    // Удаляем старое изображение
    if (imageOverlayRef.current) {
      mapInstance.current.removeLayer(imageOverlayRef.current);
    }

    // Загружаем изображение чтобы получить его размеры
    const img = new Image();
    img.onload = function() {
      const width = this.width;
      const height = this.height;
      
      // Создаем границы изображения
      const bounds = [[0, 0], [height, width]];
      
      // Добавляем изображение на карту
      imageOverlayRef.current = L.imageOverlay(imageUrl, bounds, {
        interactive: true
      }).addTo(mapInstance.current);
      
      // Настраиваем карту под изображение
      mapInstance.current.fitBounds(bounds);
      mapInstance.current.setMaxBounds(bounds);
      
      // Отключаем перетаскивание за пределы изображения
      mapInstance.current.options.maxBounds = bounds;
      mapInstance.current.options.maxBoundsViscosity = 1.0;
    };
    img.src = imageUrl;
  };

  // ========== ФУНКЦИИ ДЛЯ РИСОВАНИЯ (ВЛАДЕЛЕЦ) ==========
  const handleMapMouseDown = (e) => {
    if (mode !== 'owner' || !isDrawing) return;
    
    const point = mapInstance.current.mouseEventToLayerPoint(e.originalEvent);
    const latLng = mapInstance.current.layerPointToLatLng(point);
    
    setStartPoint(latLng);
    
    // Создаем временный прямоугольник
    const rect = L.rectangle([latLng, latLng], {
      color: '#007bff',
      weight: 2,
      fillColor: '#007bff',
      fillOpacity: 0.3,
      dashArray: '5, 5'
    }).addTo(mapInstance.current);
    
    setDrawRectangle(rect);
  };

  const handleMapMouseMove = (e) => {
    if (!isDrawing || !startPoint || !drawRectangle) return;
    
    const point = mapInstance.current.mouseEventToLayerPoint(e.originalEvent);
    const endPoint = mapInstance.current.layerPointToLatLng(point);
    
    // Обновляем размеры прямоугольника
    drawRectangle.setBounds([startPoint, endPoint]);
  };

  const handleMapMouseUp = (e) => {
    if (!isDrawing || !startPoint || !drawRectangle) return;
    
    const point = mapInstance.current.mouseEventToLayerPoint(e.originalEvent);
    const endPoint = mapInstance.current.layerPointToLatLng(point);
    
    // Получаем границы прямоугольника
    const bounds = drawRectangle.getBounds();
    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();
    
    // Рассчитываем размеры
    const width = Math.abs(northEast.lng - southWest.lng);
    const height = Math.abs(northEast.lat - southWest.lat);
    
    // Запрашиваем данные у пользователя
    const standNumber = prompt('Введите номер стенда:', `A${tempStands.length + 1}`);
    const standType = prompt('Выберите тип стенда:\n1 - Живопись\n2 - Скульптура\n3 - Фотография\n4 - Цифровое искусство', '1');
    
    if (standNumber) {
      const typeMap = {
        '1': 'PAINTING',
        '2': 'SCULPTURE', 
        '3': 'PHOTOGRAPHY',
        '4': 'DIGITAL'
      };
      
      const newStand = {
        id: Date.now(), // Временный ID
        standNumber,
        positionX: Math.round(southWest.lng),
        positionY: Math.round(southWest.lat),
        width: Math.round(width),
        height: Math.round(height),
        type: typeMap[standType] || 'PAINTING',
        status: 'AVAILABLE'
      };
      
      // Добавляем в временный список
      setTempStands([...tempStands, newStand]);
      
      // Создаем постоянный прямоугольник
      createStandRectangle(newStand);
      
      // Сохраняем на сервер
      if (onCreateStand) {
        onCreateStand(newStand);
      }
    }
    
    // Очищаем временный прямоугольник
    mapInstance.current.removeLayer(drawRectangle);
    setDrawRectangle(null);
    setStartPoint(null);
    setIsDrawing(false);
  };

  // ========== СОЗДАНИЕ СТЕНДА ==========
  const createStandRectangle = (stand) => {
    if (!mapInstance.current) return;
    
    const bounds = [
      [stand.positionY, stand.positionX],
      [stand.positionY + stand.height, stand.positionX + stand.width]
    ];
    
    const color = stand.status === 'BOOKED' ? '#dc3545' : '#28a745';
    
    const rectangle = L.rectangle(bounds, {
      color: color,
      weight: 2,
      fillColor: color,
      fillOpacity: 0.5,
      className: 'stand-rectangle'
    }).addTo(mapInstance.current);
    
    // Добавляем номер стенда
    const center = rectangle.getBounds().getCenter();
    const label = L.divIcon({
      html: `<div class="stand-label">${stand.standNumber}</div>`,
      className: 'stand-label-container',
      iconSize: [30, 30]
    });
    
    const labelMarker = L.marker(center, { icon: label }).addTo(mapInstance.current);
    
    // Добавляем попап с информацией
    const popupContent = createPopupContent(stand);
    rectangle.bindPopup(popupContent);
    
    // Обработчик клика
    rectangle.on('click', (e) => {
      e.originalEvent.stopPropagation();
      setSelectedStand(stand);
      
      if (mode === 'artist' && stand.status !== 'BOOKED') {
        rectangle.openPopup();
      }
    });
    
    // Сохраняем ссылку на элемент
    rectangle.standData = stand;
    rectangle.label = labelMarker;
  };

  // ========== РЕНДЕР СУЩЕСТВУЮЩИХ СТЕНДОВ ==========
  const renderStands = () => {
    if (!mapInstance.current) return;
    
    // Очищаем старые стенды
    mapInstance.current.eachLayer((layer) => {
      if (layer instanceof L.Rectangle && layer.standData) {
        mapInstance.current.removeLayer(layer);
      }
      if (layer instanceof L.Marker && layer.options.icon?.options?.className === 'stand-label-container') {
        mapInstance.current.removeLayer(layer);
      }
    });
    
    // Рендерим все стенды
    const allStands = [...(stands || []), ...tempStands];
    allStands.forEach(createStandRectangle);
  };

  useEffect(() => {
    renderStands();
  }, [stands, tempStands]);

  // ========== СОЗДАНИЕ ПОПАПА ==========
  const createPopupContent = (stand) => {
    let content = `
      <div class="stand-popup">
        <h4>Стенд ${stand.standNumber}</h4>
        <div class="stand-info">
          <p><strong>Тип:</strong> ${getTypeText(stand.type)}</p>
          <p><strong>Размер:</strong> ${stand.width} × ${stand.height} пикс.</p>
          <p><strong>Статус:</strong> ${stand.status === 'BOOKED' ? 'Занят' : 'Свободен'}</p>
          <p><strong>Координаты:</strong> X:${stand.positionX}, Y:${stand.positionY}</p>
        </div>
    `;
    
    if (mode === 'artist' && stand.status !== 'BOOKED') {
      content += `
        <div class="popup-actions">
          <button onclick="window.handleBookStand(${stand.id})" class="popup-btn btn-book">
            Забронировать
          </button>
        </div>
      `;
    }
    
    content += '</div>';
    
    window.handleBookStand = async (standId) => {
      try {
        await onBookStand(standId);
        alert('Заявка на бронирование отправлена!');
      } catch (err) {
        alert('Ошибка: ' + err.message);
      }
    };
    
    return content;
  };

  const getTypeText = (type) => {
    const types = {
      'PAINTING': 'Живопись',
      'SCULPTURE': 'Скульптура',
      'PHOTOGRAPHY': 'Фотография',
      'DIGITAL': 'Цифровое искусство'
    };
    return types[type] || type;
  };

  // ========== ЗАГРУЗКА ИЗОБРАЖЕНИЯ ==========
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target.result;
      setMapImage(imageUrl);
      loadHallMapImage(imageUrl);
      
      // Сохраняем на сервер
      if (onUploadHallMap) {
        onUploadHallMap(imageUrl, `План зала - ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  // ========== БРОНИРОВАНИЕ (ХУДОЖНИК) ==========
  const handleBookStand = async () => {
    if (!selectedStand) {
      alert('Выберите стенд на карте');
      return;
    }
    
    try {
      await onBookStand(selectedStand.id);
      alert('Заявка на бронирование отправлена!');
      setSelectedStand(null);
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  };

  return (
    <div className="map-editor">
      <div className="map-container">
        <div ref={mapRef} className="leaflet-map" />
        
        {mode === 'owner' && (
          <div className="owner-controls">
            {/* Загрузка изображения */}
            <div className="control-section">
              <h4>Загрузить план зала</h4>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="file-input"
              />
              <p className="help-text">Загрузите фото/план выставочного зала</p>
            </div>
            
            {/* Рисование стендов */}
            <div className="control-section">
              <h4>Добавить стенды</h4>
              <button
                className={`draw-btn ${isDrawing ? 'active' : ''}`}
                onClick={() => setIsDrawing(!isDrawing)}
              >
                {isDrawing ? 'Завершить рисование' : 'Нарисовать стенд'}
              </button>
              <p className="help-text">
                {isDrawing 
                  ? 'Зажмите и растяните прямоугольник на карте' 
                  : 'Включите режим рисования для добавления стендов'}
              </p>
            </div>
            
            {/* Инструкция */}
            <div className="instruction">
              <h5>Инструкция:</h5>
              <ol>
                <li>Загрузите фото зала</li>
                <li>Нажмите "Нарисовать стенд"</li>
                <li>Зажмите и растяните прямоугольник на нужном месте</li>
                <li>Укажите номер и тип стенда</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      <div className="sidebar">
        {mode === 'owner' ? (
          <div className="owner-sidebar">
            <h3>Управление стендами</h3>
            
            <div className="stats">
              <div className="stat-item">
                <span>Всего стендов:</span>
                <span>{(stands?.length || 0) + tempStands.length}</span>
              </div>
              <div className="stat-item">
                <span>Свободно:</span>
                <span>{(stands?.filter(s => s.status === 'AVAILABLE').length || 0) + tempStands.length}</span>
              </div>
            </div>
            
            {selectedStand && (
              <div className="selected-stand-info">
                <h4>Выбранный стенд</h4>
                <p><strong>Номер:</strong> {selectedStand.standNumber}</p>
                <p><strong>Размер:</strong> {selectedStand.width} × {selectedStand.height}</p>
                <p><strong>Тип:</strong> {getTypeText(selectedStand.type)}</p>
              </div>
            )}
            
            <div className="tips">
              <h5>Советы:</h5>
              <ul>
                <li>Делайте стенды разного размера для разных работ</li>
                <li>Нумеруйте стенды понятно (A1, A2, B1 и т.д.)</li>
                <li>Оставляйте проходы между стендами</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="artist-sidebar">
            <h3>Бронирование стенда</h3>
            
            {selectedStand ? (
              <>
                <div className="stand-details">
                  <h4>Стенд {selectedStand.standNumber}</h4>
                  <p><strong>Тип:</strong> {getTypeText(selectedStand.type)}</p>
                  <p><strong>Размеры:</strong> {selectedStand.width} × {selectedStand.height} пикс.</p>
                  <p><strong>Статус:</strong> {selectedStand.status === 'BOOKED' ? 'Занят' : 'Свободен'}</p>
                </div>
                
                {selectedStand.status !== 'BOOKED' ? (
                  <button 
                    className="book-btn"
                    onClick={handleBookStand}
                  >
                    Забронировать этот стенд
                  </button>
                ) : (
                  <div className="booked-message">
                    <p>Этот стенд уже забронирован</p>
                  </div>
                )}
              </>
            ) : (
              <div className="instructions">
                <h4>Как забронировать:</h4>
                <ol>
                  <li>Найдите свободный стенд (зелёный)</li>
                  <li>Нажмите на стенд для выбора</li>
                  <li>Нажмите "Забронировать" в этом окне</li>
                  <li>Ожидайте подтверждения от владельца</li>
                </ol>
                
                <div className="legend">
                  <div className="legend-item">
                    <div className="color-box available"></div>
                    <span>Свободные стенды</span>
                  </div>
                  <div className="legend-item">
                    <div className="color-box booked"></div>
                    <span>Забронированные</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapEditor;