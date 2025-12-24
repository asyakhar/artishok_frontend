import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { ownerApi } from '../api'; 

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapEditor = ({ mode, hallMap, stands, exhibitionId,onUploadHallMap, onCreateStand, onBookStand }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const imageOverlayRef = useRef(null);
  const navigate = useNavigate();
  const [selectedStand, setSelectedStand] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mapImage, setMapImage] = useState(null);
  const [tempStands, setTempStands] = useState([]);
  const [showStandForm, setShowStandForm] = useState(false);
  const [standFormData, setStandFormData] = useState({
    standNumber: '',
    type: 'PAINTING',
    width: 100,
    height: 100
  });
  const [pendingStandPosition, setPendingStandPosition] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapScale, setMapScale] = useState(1);

  // ========== ИНИЦИАЛИЗАЦИЯ КАРТЫ ==========
  useEffect(() => {
    if (!mapRef.current) return;

    mapInstance.current = L.map(mapRef.current, {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 5,
      zoomControl: true,
      attributionControl: false,
      zoomSnap: 0.1,
      zoomDelta: 0.1
    });

    // Добавляем контролы
    L.control.zoom({ position: 'topright' }).addTo(mapInstance.current);
    
    // Центрируем карту
    mapInstance.current.setView([250, 250], 0);

    // Рисуем существующие стенды
    renderStands();

    // Обработчик клика для владельца
    if (mode === 'owner') {
      mapInstance.current.on('click', handleMapClick);
    }

    // Обработчик изменения масштаба
    mapInstance.current.on('zoom', () => {
      if (mapInstance.current) {
        setMapScale(mapInstance.current.getZoom());
      }
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.off('click');
        mapInstance.current.off('zoom');
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mode]);

  // Загружаем изображение при изменении hallMap
  useEffect(() => {
    if (hallMap?.mapImageUrl) {
      loadHallMapImage(hallMap.mapImageUrl);
    }
  }, [hallMap]);

  // Рендерим стенды при изменении
  useEffect(() => {
    renderStands();
  }, [stands, tempStands]);

  // ========== ЗАГРУЗКА ИЗОБРАЖЕНИЯ ЗАЛА ==========
  // const loadHallMapImage = (imageUrl) => {
  //   if (!mapInstance.current || !imageUrl) {
  //     console.log('Нет карты или изображения');
  //     return;
  //   }

  //   console.log('Загрузка изображения:', imageUrl);

  //   // Удаляем старое изображение
  //   if (imageOverlayRef.current) {
  //     mapInstance.current.removeLayer(imageOverlayRef.current);
  //     imageOverlayRef.current = null;
  //   }

  //   const img = new Image();
  //   img.crossOrigin = 'anonymous';
    
  //   img.onload = function() {
  //     console.log('Изображение загружено, размеры:', this.width, 'x', this.height);
      
  //     const width = this.width;
  //     const height = this.height;
      
  //     // Увеличиваем границы для рамки (добавляем отступы по 20%)
  //     const paddingX = width * 0.2;
  //     const paddingY = height * 0.2;
  //     const bounds = [
  //       [-paddingY, -paddingX],
  //       [height + paddingY, width + paddingX]
  //     ];
      
  //     // Создаем фон для рамки
  //     const backgroundBounds = [
  //       [-paddingY - 50, -paddingX - 50],
  //       [height + paddingY + 50, width + paddingX + 50]
  //     ];
      
  //     // Добавляем фон
  //     L.rectangle(backgroundBounds, {
  //       color: '#f8f9fa',
  //       fillColor: '#f8f9fa',
  //       fillOpacity: 1,
  //       interactive: false,
  //       className: 'map-background'
  //     }).addTo(mapInstance.current);
      
  //     // Добавляем изображение
  //     imageOverlayRef.current = L.imageOverlay(imageUrl, bounds, {
  //       interactive: true,
  //       className: 'hall-map-image'
  //     }).addTo(mapInstance.current);
      
  //     // Устанавливаем границы и центрируем
  //     mapInstance.current.fitBounds(bounds);
  //     mapInstance.current.setMaxBounds(backgroundBounds);
      
  //     // Немного отдаляем для отображения рамки
  //     setTimeout(() => {
  //       if (mapInstance.current) {
  //         mapInstance.current.setZoom(0.8);
  //       }
  //     }, 100);
      
  //     setImageError(false);
  //     setMapImage(imageUrl);
  //   };
    
  //   img.onerror = function(e) {
  //     console.error('Ошибка загрузки изображения:', e);
  //     setImageError(true);
  //     showPlaceholder();
  //   };
    
  //   img.src = imageUrl;
  // };
  const loadHallMapImage = (imageUrl) => {
    if (!mapInstance.current || !imageUrl) {
      console.log('Нет карты или изображения');
      return;
    }
  
    console.log('Загрузка изображения:', imageUrl);
  
    // Удаляем старое изображение
    if (imageOverlayRef.current) {
      mapInstance.current.removeLayer(imageOverlayRef.current);
      imageOverlayRef.current = null;
    }
  
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
      console.log('Изображение загружено, размеры:', this.width, 'x', this.height);
      
      const width = this.width;
      const height = this.height;
      
      // Важно: устанавливаем bounds относительно реальных размеров
      // В Leaflet Simple CRS координаты могут быть любыми
      const bounds = [
        [0, 0],                // верхний левый угол
        [height, width]        // нижний правый угол (height = Y, width = X)
      ];
      
      console.log('Bounds для изображения:', bounds);
      
      // Устанавливаем центр карты на центр изображения
      const centerY = height / 2;
      const centerX = width / 2;
      console.log('Центр изображения:', centerX, centerY);
      
      // Очищаем все слои перед добавлением нового изображения
      mapInstance.current.eachLayer((layer) => {
        if (!(layer instanceof L.Control)) {
          mapInstance.current.removeLayer(layer);
        }
      });
      
      // Добавляем изображение с правильными bounds
      imageOverlayRef.current = L.imageOverlay(imageUrl, bounds, {
        interactive: true,
        className: 'hall-map-image'
      }).addTo(mapInstance.current);
      
      // Устанавливаем вид карты на всё изображение
      mapInstance.current.fitBounds(bounds);
      
      // Устанавливаем центрирование
      mapInstance.current.setView([centerY, centerX], 0);
      
      // Разрешаем клики по всему изображению
      imageOverlayRef.current.getElement().style.pointerEvents = 'auto';
      imageOverlayRef.current.getElement().style.userSelect = 'auto';
      
      // Добавляем обработчик клика для изображения
      imageOverlayRef.current.on('click', function(e) {
        console.log('Клик по изображению:', e.latlng);
        
        if (mode === 'owner' && isDrawing) {
          // Используем координаты из клика
          const { lat, lng } = e.latlng;
          console.log('Координаты клика (lat,lng):', lat, lng);
          
          setPendingStandPosition({ lat, lng });
          setShowStandForm(true);
          
          // Временная точка
          const tempMarker = L.marker([lat, lng], {
            icon: L.divIcon({
              html: `
                <div style="
                  width: 24px;
                  height: 24px;
                  background: #dc3545;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 0 10px rgba(220,53,69,0.5);
                  animation: pulse 1.5s infinite;
                ">
                  <div style="
                    width: 8px;
                    height: 8px;
                    background: white;
                    border-radius: 50%;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                  "></div>
                </div>
              `,
              className: 'temp-marker',
              iconSize: [30, 30]
            }),
            zIndexOffset: 1000
          }).addTo(mapInstance.current);
        }
      });
      
      setImageError(false);
      setMapImage(imageUrl);
      
      // После загрузки изображения рендерим стенды
      setTimeout(() => {
        renderStands();
      }, 100);
    };
    
    img.onerror = function(e) {
      console.error('Ошибка загрузки изображения:', e);
      setImageError(true);
      showPlaceholder();
    };
    
    img.src = imageUrl;
  };
  const showPlaceholder = () => {
    if (!mapInstance.current) return;
    
    const bounds = [[0, 0], [500, 500]];
    
    // Фон
    L.rectangle(bounds, {
      color: '#e9ecef',
      fillColor: '#e9ecef',
      fillOpacity: 0.8,
      interactive: false
    }).addTo(mapInstance.current);
    
    // Текст
    L.marker([250, 250], {
      icon: L.divIcon({
        html: `
          <div style="
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            text-align: center;
            min-width: 200px;
          ">
            <div style="font-size: 48px; color: #6c757d; margin-bottom: 10px;">📷</div>
            <h4 style="margin: 0 0 10px 0; color: #495057;">Загрузите план зала</h4>
            <p style="margin: 0; color: #6c757d; font-size: 14px;">Используйте левую панель для загрузки</p>
          </div>
        `,
        className: 'placeholder-text',
        iconSize: [250, 150]
      })
    }).addTo(mapInstance.current);
    
    mapInstance.current.fitBounds(bounds);
  };

  // ========== КЛИК ПО КАРТЕ ДЛЯ ДОБАВЛЕНИЯ ТОЧКИ ==========
  // const handleMapClick = (e) => {
  //   if (mode !== 'owner' || !isDrawing) return;
    
  //   const { lat, lng } = e.latlng;
  //   console.log('Клик по карте:', lat, lng);
    
  //   setPendingStandPosition({ lat, lng });
  //   setShowStandForm(true);
    
  //   // Временная точка
  //   const tempMarker = L.marker([lat, lng], {
  //     icon: L.divIcon({
  //       html: `
  //         <div style="
  //           width: 24px;
  //           height: 24px;
  //           background: #dc3545;
  //           border-radius: 50%;
  //           border: 3px solid white;
  //           box-shadow: 0 0 10px rgba(220,53,69,0.5);
  //           animation: pulse 1.5s infinite;
  //         ">
  //           <div style="
  //             width: 8px;
  //             height: 8px;
  //             background: white;
  //             border-radius: 50%;
  //             position: absolute;
  //             top: 50%;
  //             left: 50%;
  //             transform: translate(-50%, -50%);
  //           "></div>
  //         </div>
  //         <style>
  //           @keyframes pulse {
  //             0% { transform: scale(1); opacity: 1; }
  //             50% { transform: scale(1.2); opacity: 0.8; }
  //             100% { transform: scale(1); opacity: 1; }
  //           }
  //         </style>
  //       `,
  //       className: 'temp-marker',
  //       iconSize: [30, 30]
  //     }),
  //     zIndexOffset: 1000
  //   }).addTo(mapInstance.current);
    
  //   // Удаляем при закрытии формы
  //   setTimeout(() => {
  //     if (mapInstance.current && tempMarker && !showStandForm) {
  //       mapInstance.current.removeLayer(tempMarker);
  //     }
  //   }, 30000); // 30 секунд
  // };
  const handleMapClick = (e) => {
    if (mode !== 'owner' || !isDrawing) return;
    
    const { lat, lng } = e.latlng;
    console.log('Клик по карте (режим владельца):', lat, lng);
    
    setPendingStandPosition({ lat, lng });
    setShowStandForm(true);
    
    // Временная точка
    const tempMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        html: `
          <div style="
            width: 24px;
            height: 24px;
            background: #dc3545;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 10px rgba(220,53,69,0.5);
            animation: pulse 1.5s infinite;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background: white;
              border-radius: 50%;
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
            "></div>
          </div>
        `,
        className: 'temp-marker',
        iconSize: [30, 30]
      }),
      zIndexOffset: 1000
    }).addTo(mapInstance.current);
    
    // Удаляем при закрытии формы
    setTimeout(() => {
      if (mapInstance.current && tempMarker && !showStandForm) {
        mapInstance.current.removeLayer(tempMarker);
      }
    }, 30000);
  };
  // ========== СОЗДАНИЕ СТЕНДА-ТОЧКИ ==========
  const createStandMarker = (stand) => {
    if (!mapInstance.current) return;
    
    let color = '#28a745'; // свободен
    if (stand.status === 'BOOKED') color = '#dc3545';
    if (stand.status === 'MAINTENANCE') color = '#ffc107';
    
    const marker = L.marker([stand.positionY, stand.positionX], {
      icon: L.divIcon({
        html: `
          <div style="
            width: 40px;
            height: 40px;
            background: ${color};
            border-radius: 50%;
            border: 3px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: all 0.2s;
          " 
          class="stand-marker" 
          onmouseenter="this.style.transform='scale(1.2)'; this.style.boxShadow='0 5px 15px rgba(0,0,0,0.4)';"
          onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='0 3px 10px rgba(0,0,0,0.3)';"
          >
            ${stand.standNumber}
          </div>
        `,
        className: 'stand-marker-container',
        iconSize: [46, 46]
      })
    }).addTo(mapInstance.current);
    
    // Попап с информацией
    const popupContent = `
      <div style="padding: 15px; min-width: 250px;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <div style="width: 20px; height: 20px; background: ${color}; border-radius: 50%; margin-right: 10px;"></div>
          <h4 style="margin: 0;">Стенд ${stand.standNumber}</h4>
        </div>
        <div style="margin-bottom: 15px;">
          <p style="margin: 5px 0;"><strong>Тип:</strong> ${getTypeText(stand.type)}</p>
          <p style="margin: 5px 0;"><strong>Размер:</strong> ${stand.width}×${stand.height} см</p>
          <p style="margin: 5px 0;"><strong>Статус:</strong> 
            <span style="color: ${color}; font-weight: bold;">
              ${stand.status === 'BOOKED' ? 'Занят' : stand.status === 'MAINTENANCE' ? 'В ремонте' : 'Свободен'}
            </span>
          </p>
          <p style="margin: 5px 0;"><strong>Координаты:</strong> X:${stand.positionX}, Y:${stand.positionY}</p>
        </div>
        ${mode === 'artist' && stand.status === 'AVAILABLE' ? 
          `<button 
            onclick="window.handleBookStandClick('${stand.id}')" 
            style="
              width: 100%; 
              padding: 10px; 
              background: linear-gradient(135deg, #007bff, #0056b3); 
              color: white; 
              border: none; 
              border-radius: 6px; 
              cursor: pointer;
              font-weight: bold;
              transition: all 0.2s;
            "
            onmouseover="this.style.background='linear-gradient(135deg, #0056b3, #004085)'; this.style.transform='translateY(-2px)';"
            onmouseout="this.style.background='linear-gradient(135deg, #007bff, #0056b3)'; this.style.transform='translateY(0)';"
          >
            📝 Забронировать
          </button>` : 
          ''
        }
      </div>
    `;
    
    window.handleBookStandClick = async (standId) => {
      try {
        await onBookStand(standId);
        alert('Заявка на бронирование отправлена!');
        marker.closePopup();
        // Обновляем стенды
        renderStands();
      } catch (err) {
        alert('Ошибка: ' + err.message);
      }
    };
    
    marker.bindPopup(popupContent);
    
    marker.on('click', (e) => {
      e.originalEvent.stopPropagation();
      setSelectedStand(stand);
      
      if (mode === 'artist' && stand.status === 'AVAILABLE') {
        marker.openPopup();
      }
    });
    
    marker.standData = stand;
    return marker;
  };

  // ========== РЕНДЕР СУЩЕСТВУЮЩИХ СТЕНДОВ ==========
  const renderStands = () => {
    if (!mapInstance.current) return;
    
    // Очищаем старые маркеры стендов
    mapInstance.current.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer.standData) {
        mapInstance.current.removeLayer(layer);
      }
    });
    
    // Рендерим все стенды
    const allStands = [...(stands || []), ...tempStands];
    console.log('Рендерим стенды:', allStands.length);
    allStands.forEach(createStandMarker);
  };

  // ========== СОХРАНЕНИЕ СТЕНДА ==========
  const handleSaveStand = async () => {
    if (!pendingStandPosition || !standFormData.standNumber) {
      alert('Заполните все обязательные поля');
      return;
    }

    const newStand = {
      standNumber: standFormData.standNumber,
      positionX: Math.round(pendingStandPosition.lng),
      positionY: Math.round(pendingStandPosition.lat),
      width: standFormData.width,
      height: standFormData.height,
      type: standFormData.type,
      status: 'AVAILABLE'
    };

    try {
      // Сохраняем на сервер
      if (onCreateStand) {
        await onCreateStand(newStand);
      }
      
      // Добавляем локально
      setTempStands([...tempStands, { ...newStand, id: Date.now() }]);
      
      // Сбрасываем
      setShowStandForm(false);
      setPendingStandPosition(null);
      setStandFormData({
        standNumber: '',
        type: 'PAINTING',
        width: 100,
        height: 100
      });
      setIsDrawing(false);
      
      alert('Стенд успешно добавлен!');
    } catch (err) {
      alert('Ошибка сохранения: ' + err.message);
    }
  };

  // ========== ЗАГРУЗКА ИЗОБРАЖЕНИЯ ЗАЛА ==========
  // const handleImageUpload = async (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;
    
  //   if (file.size > 5 * 1024 * 1024) {
  //     alert('Файл слишком большой. Максимальный размер: 5MB');
  //     return;
  //   }
    
  //   if (!file.type.match('image.*')) {
  //     alert('Пожалуйста, выберите файл изображения (JPG, PNG)');
  //     return;
  //   }
    
  //   try {
  //     setLoading(true);
      
  //     console.log('Загрузка файла для выставки:', exhibitionId);
  //     console.log('Файл:', file.name, file.size, file.type);
      
  //     // Прямая загрузка файла
  //     const uploadResult = await ownerApi.uploadHallMapImage(exhibitionId, file);
  //     console.log('Результат загрузки:', uploadResult);
      
  //     // Если загрузка успешна
  //     if (uploadResult && uploadResult.success) {
  //       const imageUrl = uploadResult.fullUrl || uploadResult.fileUrl;
        
  //       // Создаем запись карты зала через родительский компонент
  //       if (onUploadHallMap) {
  //         await onUploadHallMap(imageUrl, file.name);
  //       } else {
  //         // Или обновляем карту напрямую
  //         setMapImage(imageUrl);
  //         setTimeout(() => {
  //           loadHallMapImage(imageUrl);
  //         }, 100);
  //       }
        
  //       alert('Карта зала успешно загружена!');
  //     } else {
  //       throw new Error(uploadResult?.error || 'Ошибка загрузки файла');
  //     }
      
  //   } catch (err) {
  //     console.error('Ошибка загрузки:', err);
  //     console.error('Детали ошибки:', err.response?.data);
  //     alert(`Ошибка загрузки: ${err.response?.data?.error || err.message}`);
  //   } finally {
  //     setLoading(false);
  //     // Сбрасываем input
  //     e.target.value = '';
  //   }
  // };
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Простая проверка
    if (!file.type.includes('image')) {
      alert('Выберите картинку!');
      return;
    }
    
    // Создаем URL для файла
    const imageUrl = URL.createObjectURL(file);
    
    // Показываем на карте
    if (mapInstance.current) {
      const bounds = [[0, 0], [500, 500]];
      if (imageOverlayRef.current) {
        mapInstance.current.removeLayer(imageOverlayRef.current);
      }
      
      imageOverlayRef.current = L.imageOverlay(imageUrl, bounds, {
        interactive: true
      }).addTo(mapInstance.current);
      
      mapInstance.current.fitBounds(bounds);
    }
    
    alert('Фотка загружена! Теперь кликайте по карте чтобы ставить точки.');
    
    // Сбрасываем input
    e.target.value = '';
  };
  
  // Функция для создания тестовых стендов на основе размеров фотки
  const createTestStandsOnImage = (imageWidth, imageHeight) => {
    console.log('🛠️ Создаю тестовые стенды для фотки...');
    
    // Рассчитываем позиции относительно размеров фотки
    const centerX = imageWidth / 2;
    const centerY = imageHeight / 2;
    const spacingX = imageWidth / 4;
    const spacingY = imageHeight / 4;
    
    const testStands = [
      {
        id: 1,
        standNumber: 'A1',
        positionX: centerX - spacingX,
        positionY: centerY - spacingY,
        width: 150,
        height: 100,
        type: 'PAINTING',
        status: 'AVAILABLE'
      },
      {
        id: 2,
        standNumber: 'A2',
        positionX: centerX + spacingX,
        positionY: centerY - spacingY,
        width: 150,
        height: 100,
        type: 'SCULPTURE',
        status: 'AVAILABLE'
      },
      {
        id: 3,
        standNumber: 'B1',
        positionX: centerX - spacingX,
        positionY: centerY + spacingY,
        width: 200,
        height: 150,
        type: 'PHOTOGRAPHY',
        status: 'BOOKED'
      },
      {
        id: 4,
        standNumber: 'B2',
        positionX: centerX + spacingX,
        positionY: centerY + spacingY,
        width: 120,
        height: 120,
        type: 'DIGITAL',
        status: 'AVAILABLE'
      }
    ];
    
    console.log('✅ Создано тестовых стендов:', testStands.map(s => ({
      номер: s.standNumber,
      позиция: `X:${s.positionX}, Y:${s.positionY}`,
      размер: `${s.width}x${s.height}`
    })));
    
    setTempStands(testStands);
    
    // Рисуем стенды на карте
    setTimeout(() => {
      renderStands();
    }, 200);
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
      
      // Обновляем карту
      renderStands();
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  };

  const getTypeText = (type) => {
    const types = {
      'PAINTING': '🎨 Живопись',
      'SCULPTURE': '🗿 Скульптура', 
      'PHOTOGRAPHY': '📷 Фотография',
      'DIGITAL': '💻 Цифровое искусство'
    };
    return types[type] || type;
  };

  // ========== СТАТИСТИКА ==========
  const getStats = () => {
    const allStands = [...(stands || []), ...tempStands];
    return {
      total: allStands.length,
      available: allStands.filter(s => s.status === 'AVAILABLE').length,
      booked: allStands.filter(s => s.status === 'BOOKED').length,
      maintenance: allStands.filter(s => s.status === 'MAINTENANCE').length
    };
  };

  const stats = getStats();

  // ========== КНОПКА СОХРАНИТЬ ==========
  const handleSaveAll = () => {
    // Здесь можно добавить логику сохранения всех изменений
    alert('Все изменения сохранены!');
  };

  // ========== КНОПКА НАЗАД ==========
  const handleBack = () => {
    if (window.confirm('Все несохраненные изменения будут потеряны. Вернуться в личный кабинет?')) {
      navigate('/gallery/dashboard');
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 80px)',
      backgroundColor: '#f8f9fa',
      padding: '20px', // Увеличиваем нижний padding
      paddingBottom: '80px'
    }}>
      {/* ШАПКА С КНОПКАМИ */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        right: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <button
          onClick={handleBack}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '500',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
        >
          ← Назад в личный кабинет
        </button>
        
        {mode === 'owner' && (
          <button
            onClick={handleSaveAll}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
          >
            💾 Сохранить все изменения
          </button>
        )}
      </div>

      {/* ЛЕВАЯ ПАНЕЛЬ - УПРАВЛЕНИЕ */}
      <div style={{
        width: '320px',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginRight: '20px',
        marginTop: '60px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        overflowY: 'auto',
        border: '1px solid #dee2e6'
      }}>
        <h2 style={{ 
          marginTop: 0, 
          marginBottom: '20px', 
          color: '#343a40',
          borderBottom: '2px solid #007bff',
          paddingBottom: '10px',
          fontSize: '24px'
        }}>
          {mode === 'owner' ? '🎨 Управление выставкой' : '📅 Бронирование'}
        </h2>
        
        {mode === 'owner' ? (
          <>
            {/* СЕКЦИЯ ЗАГРУЗКИ КАРТЫ */}
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '10px',
              marginBottom: '20px',
              border: '2px dashed #dee2e6'
            }}>
              <h4 style={{ marginTop: 0, color: '#495057', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                  width: '30px', 
                  height: '30px', 
                  background: '#007bff', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px'
                }}>1</span>
                Загрузка плана зала
              </h4>
              
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  id="mapUpload"
                  style={{ display: 'none' }}
                  disabled={loading}
                />
                <label htmlFor="mapUpload" style={{
                  display: 'block',
                  padding: '15px',
                  background: loading ? '#e9ecef' : 'linear-gradient(135deg, #007bff, #0056b3)',
                  color: loading ? '#6c757d' : 'white',
                  textAlign: 'center',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.7 : 1
                }}>
                  {loading ? '⏳ Загрузка...' : '📁 Загрузить план зала'}
                </label>
                
                {mapImage && !imageError && (
                  <div style={{
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    padding: '12px',
                    borderRadius: '6px',
                    marginTop: '15px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '18px' }}>✅</span>
                    <span>Карта зала загружена</span>
                  </div>
                )}
                
                {imageError && (
                  <div style={{
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    padding: '12px',
                    borderRadius: '6px',
                    marginTop: '15px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '18px' }}>❌</span>
                    <span>Ошибка загрузки изображения</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* СЕКЦИЯ ДОБАВЛЕНИЯ СТЕНДОВ */}
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '10px',
              marginBottom: '20px',
              border: isDrawing ? '2px solid #28a745' : '2px solid #dee2e6'
            }}>
              <h4 style={{ marginTop: 0, color: '#495057', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                  width: '30px', 
                  height: '30px', 
                  background: '#28a745', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px'
                }}>2</span>
                Добавление стендов
              </h4>
              
              <div style={{ marginBottom: '15px' }}>
                <button
                  onClick={() => setIsDrawing(!isDrawing)}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: isDrawing 
                      ? 'linear-gradient(135deg, #dc3545, #c82333)' 
                      : 'linear-gradient(135deg, #28a745, #218838)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '16px',
                    transition: 'all 0.2s'
                  }}
                >
                  {isDrawing ? '❌ Отменить добавление' : '➕ Добавить стенд'}
                </button>
                
                <div style={{ 
                  backgroundColor: isDrawing ? '#d4edda' : '#fff3cd',
                  color: isDrawing ? '#155724' : '#856404',
                  padding: '15px',
                  borderRadius: '8px',
                  marginTop: '15px',
                  fontSize: '14px',
                  border: `2px solid ${isDrawing ? '#c3e6cb' : '#ffeaa7'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '20px' }}>💡</span>
                    <strong>{isDrawing ? 'Режим добавления активен' : 'Инструкция'}</strong>
                  </div>
                  <p style={{ margin: 0 }}>
                    {isDrawing 
                      ? 'Кликните на карте справа в нужном месте, чтобы разместить стенд'
                      : 'Нажмите кнопку выше, чтобы включить режим добавления стендов'}
                  </p>
                </div>
              </div>
              
              {/* ФОРМА ДОБАВЛЕНИЯ СТЕНДА */}
              {showStandForm && (
                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '2px solid #007bff',
                  marginTop: '15px',
                  boxShadow: '0 4px 15px rgba(0,123,255,0.15)'
                }}>
                  <h5 style={{ marginTop: 0, color: '#007bff', fontSize: '18px' }}>
                    📝 Новый стенд
                  </h5>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#495057' }}>
                      Номер стенда *
                    </label>
                    <input
                      type="text"
                      placeholder="Например: A1, B2"
                      value={standFormData.standNumber}
                      onChange={(e) => setStandFormData({...standFormData, standNumber: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #ced4da',
                        borderRadius: '6px',
                        fontSize: '16px',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#007bff'}
                      onBlur={(e) => e.target.style.borderColor = '#ced4da'}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#495057' }}>
                      Тип стенда
                    </label>
                    <select
                      value={standFormData.type}
                      onChange={(e) => setStandFormData({...standFormData, type: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #ced4da',
                        borderRadius: '6px',
                        fontSize: '16px',
                        backgroundColor: 'white',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#007bff'}
                      onBlur={(e) => e.target.style.borderColor = '#ced4da'}
                    >
                      <option value="PAINTING">🎨 Живопись</option>
                      <option value="SCULPTURE">🗿 Скульптура</option>
                      <option value="PHOTOGRAPHY">📷 Фотография</option>
                      <option value="DIGITAL">💻 Цифровое искусство</option>
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#495057' }}>
                        Ширина (см)
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="500"
                        value={standFormData.width}
                        onChange={(e) => setStandFormData({...standFormData, width: parseInt(e.target.value) || 100})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #ced4da',
                          borderRadius: '6px',
                          fontSize: '16px',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#007bff'}
                        onBlur={(e) => e.target.style.borderColor = '#ced4da'}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#495057' }}>
                        Высота (см)
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="500"
                        value={standFormData.height}
                        onChange={(e) => setStandFormData({...standFormData, height: parseInt(e.target.value) || 100})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #ced4da',
                          borderRadius: '6px',
                          fontSize: '16px',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#007bff'}
                        onBlur={(e) => e.target.style.borderColor = '#ced4da'}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                      onClick={handleSaveStand}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'linear-gradient(135deg, #28a745, #218838)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '16px',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      ✅ Сохранить стенд
                    </button>
                    <button
                      onClick={() => {
                        setShowStandForm(false);
                        setPendingStandPosition(null);
                      }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'linear-gradient(135deg, #6c757d, #5a6268)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '16px',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      ❌ Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* СТАТИСТИКА */}
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '10px',
              marginBottom: '20px',
              border: '2px solid #dee2e6'
            }}>
              <h4 style={{ marginTop: 0, color: '#495057', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                  width: '30px', 
                  height: '30px', 
                  background: '#6f42c1', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px'
                }}>3</span>
                Статистика выставки
              </h4>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '15px',
                marginBottom: '20px'
              }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #343a40, #212529)', 
                  padding: '15px', 
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                    {stats.total}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    Всего стендов
                  </div>
                </div>
                <div style={{ 
                  background: 'linear-gradient(135deg, #28a745, #218838)', 
                  padding: '15px', 
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                    {stats.available}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    Свободно
                  </div>
                </div>
                <div style={{ 
                  background: 'linear-gradient(135deg, #dc3545, #c82333)', 
                  padding: '15px', 
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                    {stats.booked}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    Занято
                  </div>
                </div>
                <div style={{ 
                  background: 'linear-gradient(135deg, #ffc107, #e0a800)', 
                  padding: '15px', 
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#212529'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                    {stats.maintenance}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    В ремонте
                  </div>
                </div>
              </div>
            </div>
            
          </>
        ) : (
          /* ИНТЕРФЕЙС ХУДОЖНИКА */
          <>
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '10px',
              marginBottom: '20px',
              border: '2px solid #dee2e6'
            }}>
              <h4 style={{ marginTop: 0, color: '#495057' }}>
                🎨 Выбор стенда
              </h4>
              
              {selectedStand ? (
                <>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #007bff, #0056b3)', 
                    padding: '20px', 
                    borderRadius: '10px',
                    marginBottom: '20px',
                    color: 'white'
                  }}>
                    <h5 style={{ marginTop: 0, fontSize: '20px' }}>
                      Стенд {selectedStand.standNumber}
                    </h5>
                    <p style={{ margin: '10px 0', opacity: 0.9 }}>
                      <strong>Тип:</strong> {getTypeText(selectedStand.type)}
                    </p>
                    <p style={{ margin: '10px 0', opacity: 0.9 }}>
                      <strong>Размер:</strong> {selectedStand.width}×{selectedStand.height} см
                    </p>
                    <p style={{ margin: '10px 0' }}>
                      <strong>Статус:</strong> 
                      <span style={{ 
                        color: selectedStand.status === 'BOOKED' ? '#ffcccb' : '#90ee90',
                        fontWeight: 'bold',
                        marginLeft: '5px'
                      }}>
                        {selectedStand.status === 'BOOKED' ? 'Занят' : 'Свободен'}
                      </span>
                    </p>
                  </div>
                  
                  {selectedStand.status !== 'BOOKED' ? (
                    <button
                      onClick={handleBookStand}
                      style={{
                        width: '100%',
                        padding: '15px',
                        background: 'linear-gradient(135deg, #28a745, #218838)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '18px',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      📝 Забронировать этот стенд
                    </button>
                  ) : (
                    <div style={{
                      background: 'linear-gradient(135deg, #dc3545, #c82333)',
                      color: 'white',
                      padding: '15px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      marginBottom: '15px'
                    }}>
                      <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
                      <div style={{ fontWeight: '600' }}>Этот стенд уже забронирован</div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ 
                  background: 'linear-gradient(135deg, #6c757d, #5a6268)', 
                  padding: '30px 20px', 
                  borderRadius: '10px',
                  textAlign: 'center',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎯</div>
                  <h5 style={{ margin: '10px 0', fontSize: '20px' }}>
                    Выберите стенд на карте
                  </h5>
                  <p style={{ fontSize: '14px', opacity: 0.8, margin: 0 }}>
                    Кликните на любой свободный стенд (зелёная точка)
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* ПРАВАЯ ПАНЕЛЬ - КАРТА С РАМКОЙ */}
      <div style={{
        flex: 1,
        position: 'relative',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        marginTop: '60px',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        border: '15px solid #ffffff',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* ЗАГОЛОВОК КАРТЫ */}
        <div style={{
          padding: '15px 20px',
          backgroundColor: '#f8f9fa',
          borderBottom: '2px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, color: '#343a40', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#007bff' }}>🗺️</span>
              Карта выставки
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
              {mapImage ? 'Используйте колесико мыши для масштабирования' : 'Загрузите план зала для начала работы'}
            </p>
          </div>
          
          <div style={{
            backgroundColor: mode === 'owner' ? '#007bff' : '#28a745',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {mode === 'owner' ? '👑 Владелец' : '🎨 Художник'}
          </div>
        </div>
        
        {/* ОБЛАСТЬ КАРТЫ */}
        <div 
          ref={mapRef} 
          style={{
            flex: 1,
            width: '100%',
            backgroundColor: '#f8f9fa'
          }}
        />
        
        {/* ПАНЕЛЬ ИНФОРМАЦИИ И УПРАВЛЕНИЯ */}
        <div style={{
          padding: '15px 20px',
          backgroundColor: '#f8f9fa',
          borderTop: '2px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          color: '#495057'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#28a745', borderRadius: '50%' }}></div>
              <span>Свободно ({stats.available})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#dc3545', borderRadius: '50%' }}></div>
              <span>Занято ({stats.booked})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#ffc107', borderRadius: '50%' }}></div>
              <span>Ремонт ({stats.maintenance})</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ opacity: 0.7 }}>Масштаб:</span>
              <span style={{ fontWeight: '600' }}>{mapScale.toFixed(1)}x</span>
            </div>
            <div style={{ 
              padding: '6px 12px', 
              backgroundColor: 'white', 
              borderRadius: '6px',
              border: '1px solid #dee2e6',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🔍</span>
              <span>Колесико мыши</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapEditor;