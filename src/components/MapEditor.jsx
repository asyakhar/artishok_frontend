import React, { useState, useRef, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { ownerApi, imageApi } from "../api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapEditor = ({
  mode,
  hallMap,
  stands,
  exhibitionId,
  onUploadHallMap,
  onCreateStand,
  onBookStand,
  onDeleteStand = () => {},
  onMapImageUpload,
  onRefreshStands = () => {},
  onApproveBooking = () => {},
  onRejectBooking = () => {},
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const imageOverlayRef = useRef(null);
  const isDrawingRef = useRef(false);
  const navigate = useNavigate();
  const [selectedStand, setSelectedStand] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mapImage, setMapImage] = useState(null);
  const [tempStands, setTempStands] = useState([]);
  const [showStandForm, setShowStandForm] = useState(false);
  const [standFormData, setStandFormData] = useState({
    standNumber: "",
    type: "WALL",
    width: 100,
    height: 100,
  });
  const [pendingStandPosition, setPendingStandPosition] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapScale, setMapScale] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [hallMapId, setHallMapId] = useState(hallMap?.id || null);
  const [hasShownMapLoaded, setHasShownMapLoaded] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const showError = (message, title = "Ошибка") => {
    if (window.toast && window.toast.error) {
      window.toast.error(`${title}: ${message}`, 6000);
    } else {
      console.error(`${title}: ${message}`);
      // Fallback на стандартный alert
      alert(`${title}: ${message}`);
    }
  };

  const showSuccess = (message) => {
    if (window.toast && window.toast.success) {
      window.toast.success(message, 4000);
    } else {
      console.log("✅", message);
      alert("✅ " + message);
    }
  };

  const showWarning = (message) => {
    if (window.toast && window.toast.warning) {
      window.toast.warning(message, 5000);
    } else {
      console.warn("", message);
      alert("" + message);
    }
  };

  const showInfo = (message) => {
    if (window.toast && window.toast.info) {
      window.toast.info(message, 3000);
    } else {
      console.info("", message);
      alert("ℹ " + message);
    }
  };
  useEffect(() => {
    window.handleBookStand = async (standId, standNumber) => {
      try {
        if (onBookStand) {
          await onBookStand(standId);

          if (mapInstance.current) {
            mapInstance.current.closePopup();
          }

          if (onRefreshStands) {
            setTimeout(() => onRefreshStands(), 300);
          }
          showSuccess(
            `Запрос на бронирование стенда ${standNumber} отправлен!`
          );
        }
      } catch (err) {
        showError(errorMessage, "Ошибка бронирования");
        console.error("Ошибка бронирования:", err);
      }
    };

    window.handleApproveBooking = async (standId, standNumber) => {
      try {
        if (onApproveBooking) {
          await onApproveBooking(standId);

          if (mapInstance.current) {
            mapInstance.current.closePopup();
          }

          if (onRefreshStands) {
            setTimeout(() => onRefreshStands(), 300);
          }
          showSuccess(`Бронирование стенда ${standNumber} подтверждено!`);
        }
      } catch (err) {
        showError(errorMessage, "Ошибка подтверждения");
        console.error("Ошибка подтверждения:", err);
      }
    };

    window.handleRejectBooking = async (standId, standNumber) => {
      try {
        if (onRejectBooking) {
          await onRejectBooking(standId);

          if (mapInstance.current) {
            mapInstance.current.closePopup();
          }

          if (onRefreshStands) {
            setTimeout(() => onRefreshStands(), 300);
          }
          showInfo(`Бронирование стенда ${standNumber} отклонено`);
        }
      } catch (err) {
        console.error("Ошибка отклонения:", err);
        showError(errorMessage, "Ошибка отклонения");
      }
    };

    window.handleDeleteStand = async (standId, standNumber) => {
      try {
        if (onDeleteStand) {
          await onDeleteStand(standId);

          if (mapInstance.current) {
            mapInstance.current.closePopup();
          }

          if (onRefreshStands) {
            setTimeout(() => onRefreshStands(), 300);
          }
          showSuccess(`Стенд ${standNumber} успешно удален`);
        }
      } catch (err) {
        showError(errorMessage, "Ошибка удаления");
        console.error("Ошибка удаления:", err);
      }
    };

    return () => {
      delete window.handleBookStand;
      delete window.handleApproveBooking;
      delete window.handleRejectBooking;
      delete window.handleDeleteStand;
    };
  }, [
    onBookStand,
    onApproveBooking,
    onRejectBooking,
    onDeleteStand,
    onRefreshStands,
  ]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    mapInstance.current = L.map(mapRef.current, {
      crs: L.CRS.Simple,
      minZoom: -3,
      maxZoom: 5,
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      center: [0, 0],
      zoom: 0,
      dragging: true,
      doubleClickZoom: true,
      scrollWheelZoom: true,
    });

    // const defaultBounds = [[-250, -250], [250, 250]];
    // mapInstance.current.setMaxBounds(defaultBounds);

    L.control.zoom({ position: "topright" }).addTo(mapInstance.current);
    mapInstance.current.setView([0, 0], 0);
    mapInstance.current.on("click", handleMapClick);
    mapInstance.current.on("zoom", () => {
      if (mapInstance.current) {
        setMapScale(mapInstance.current.getZoom());
      }
    });
    mapInstance.current.whenReady(() => {
      setIsMapReady(true);
      console.log("✅ Карта Leaflet полностью готова");
    });
    return () => {
      setIsMapReady(false);
      if (mapInstance.current) {
        mapInstance.current.off("click", handleMapClick);
        mapInstance.current.off("zoom");
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mode]);

  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  useEffect(() => {
    if (!mapInstance.current || mode !== "owner") return;

    if (isDrawing) {
      mapInstance.current.dragging.disable();
      mapRef.current.style.cursor = "crosshair";
    } else {
      mapInstance.current.dragging.enable();
      mapRef.current.style.cursor = "grab";
    }
  }, [isDrawing, mode]);

  useEffect(() => {
    // Ждем пока карта будет готова
    if (hallMap?.mapImageUrl && isMapReady) {
      console.log("Загружаем изображение карты, карта готова");
      loadHallMapImage(hallMap.mapImageUrl);
      setHallMapId(hallMap.id);
    } else if (hallMap?.mapImageUrl && !isMapReady) {
      console.log("Изображение есть, но карта не готова. Ждем...");
      // Создаем таймер для повторной попытки
      const timer = setTimeout(() => {
        if (isMapReady && hallMap?.mapImageUrl) {
          loadHallMapImage(hallMap.mapImageUrl);
          setHallMapId(hallMap.id);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hallMap, isMapReady]); // Добавьте isMapReady в зависимости

  useEffect(() => {
    renderStands();
  }, [stands, tempStands]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await new Promise((resolve) => setTimeout(resolve, 300));
    // ВАЖНО: Проверяем, создана ли карта и готова ли она
    if (!mapInstance.current || !isMapReady) {
      console.warn("Карта не готова, ожидаем...");
      showInfo("Подождите, карта загружается...");

      // Ждем до 3 секунд пока карта не будет готова
      const waitForMap = () => {
        return new Promise((resolve) => {
          let attempts = 0;
          const checkMap = () => {
            attempts++;
            if (mapInstance.current && isMapReady) {
              console.log("✅ Карта готова через", attempts * 100, "мс");
              resolve(true);
            } else if (attempts < 30) {
              // 30 попыток * 100мс = 3 секунды
              setTimeout(checkMap, 100);
            } else {
              console.error("Карта не загрузилась за 3 секунды");
              resolve(false);
            }
          };
          checkMap();
        });
      };

      const mapReady = await waitForMap();
      if (!mapReady) {
        showError("Не удалось загрузить карту. Пожалуйста, обновите страницу.");
        e.target.value = "";
        return;
      }
    }

    try {
      setLoading(true);
      setUploadProgress(10);

      const fileName = file.name;

      // Всегда проверяем, есть ли уже карта
      if (hallMapId || hallMap?.id) {
        // Есть существующая карта - обновляем ее
        console.log("Обновляем существующую карту:", hallMapId || hallMap?.id);

        setUploadProgress(30);
        const result = await ownerApi.uploadHallMapImage(
          hallMapId || hallMap?.id,
          file
        );
        const uploadedUrl = result.mapImageUrl;
        setUploadProgress(70);

        // Обновляем карту через родительский компонент
        if (onMapImageUpload) {
          await onMapImageUpload(hallMapId || hallMap?.id, uploadedUrl);
        }

        // Загружаем изображение на карту
        setUploadedImageUrl(uploadedUrl);
        await loadImageToMap(uploadedUrl);
        setUploadProgress(100);

        // Сохраняем в localStorage
        const mapKey = `hall_map_${exhibitionId}_${hallMapId || hallMap?.id}`;
        localStorage.setItem(
          mapKey,
          JSON.stringify({
            id: hallMapId || hallMap?.id,
            mapImageUrl: uploadedUrl,
            exhibitionId: exhibitionId,
            name: fileName,
            timestamp: Date.now(),
          })
        );

        showSuccess(`Карта "${fileName}" успешно обновлена!`);
      } else {
        // Нет карты - создаем новую
        console.log("Создаем новую карту");

        const mapData = {
          name: fileName || `План зала ${new Date().toLocaleDateString()}`,
          exhibitionEventId: exhibitionId,
          mapImage: file,
        };

        setUploadProgress(30);

        // Создаем через родительский компонент
        if (onUploadHallMap) {
          const result = await onUploadHallMap(mapData);

          if (result && result.id) {
            setHallMapId(result.id);
            setUploadProgress(70);

            if (result.mapImageUrl) {
              setUploadedImageUrl(result.mapImageUrl);
              await loadImageToMap(result.mapImageUrl);
            }

            setUploadProgress(100);
            showSuccess(`Карта "${fileName}" успешно создана!`);
          }
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Неизвестная ошибка";
      showError(errorMessage, "Ошибка загрузки");
      setImageError(true);
    } finally {
      setLoading(false);
      e.target.value = "";
      setTimeout(() => setUploadProgress(0), 500);
    }
  };
  const loadHallMapImage = (imageUrl) => {
    if (!mapInstance.current || !imageUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = function () {
      const width = this.width;
      const height = this.height;
      const bounds = [
        [0, 0],
        [height, width],
      ];

      mapInstance.current.eachLayer((layer) => {
        if (!(layer instanceof L.Control)) {
          mapInstance.current.removeLayer(layer);
        }
      });

      imageOverlayRef.current = L.imageOverlay(imageUrl, bounds, {
        interactive: false,
        className: "hall-map-image",
      }).addTo(mapInstance.current);

      mapInstance.current.fitBounds(bounds);

      setTimeout(() => {
        const currentZoom = mapInstance.current.getZoom();

        if (currentZoom > 0) {
          mapInstance.current.setZoom(currentZoom - 1);
        }
      }, 100);

      setImageError(false);
      setMapImage(imageUrl);

      setTimeout(() => {
        renderStands();
      }, 200);
      if (!hasShownMapLoaded) {
        // showSuccess("Карта зала успешно загружена");
        setHasShownMapLoaded(true);
      }
    };

    img.onerror = function () {
      console.error("Ошибка загрузки изображения");
      setImageError(true);
      showPlaceholder();
      showError("Не удалось загрузить изображение карты", "Ошибка загрузки");
    };

    img.src = imageUrl;
  };

  const loadImageToMap = (imageUrl) => {
    return new Promise((resolve, reject) => {
      try {
        if (!mapInstance.current) {
          console.log("⏳ Карта не создана, ждем 300мс...");
          setTimeout(() => {
            loadImageToMap(imageUrl).then(resolve).catch(reject);
          }, 300);
          return;
        }

        if (!imageUrl) {
          console.error("URL изображения не предоставлен:", imageUrl);
          reject("URL изображения не предоставлен");
          return;
        }

        // Проверяем, является ли imageUrl валидным URL
        let urlToUse = imageUrl;
        if (typeof imageUrl === "object" && imageUrl.url) {
          // Если передан объект с полем url
          urlToUse = imageUrl.url;
        } else if (imageUrl.mapImageUrl) {
          // Если передан объект с полем mapImageUrl
          urlToUse = imageUrl.mapImageUrl;
        }

        if (
          !urlToUse ||
          typeof urlToUse !== "string" ||
          urlToUse.trim() === ""
        ) {
          console.error("Невалидный URL изображения:", urlToUse);
          reject("Невалидный URL изображения");
          return;
        }

        console.log("Загрузка изображения в карту:", {
          originalUrl: imageUrl,
          urlToUse: urlToUse,
          mapInstanceExists: !!mapInstance.current,
        });

        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = function () {
          try {
            const width = this.width;
            const height = this.height;
            console.log("Изображение загружено:", {
              width,
              height,
              url: urlToUse,
            });

            const bounds = [
              [0, 0],
              [height, width],
            ];

            // Очищаем предыдущее изображение, если есть
            if (imageOverlayRef.current) {
              mapInstance.current.removeLayer(imageOverlayRef.current);
              imageOverlayRef.current = null;
            }

            // Создаем новое изображение
            imageOverlayRef.current = L.imageOverlay(urlToUse, bounds, {
              interactive: false,
              className: "hall-map-image",
            }).addTo(mapInstance.current);

            // Настраиваем вид карты
            mapInstance.current.fitBounds(bounds);

            setTimeout(() => {
              const currentZoom = mapInstance.current.getZoom();
              if (currentZoom > 0) {
                mapInstance.current.setZoom(currentZoom - 1);
              }
            }, 100);

            setImageError(false);
            setMapImage(urlToUse);

            console.log("Изображение успешно добавлено на карту");
            resolve();
          } catch (innerError) {
            console.error(
              "Ошибка при обработке загруженного изображения:",
              innerError
            );
            reject("Ошибка обработки изображения: " + innerError.message);
          }
        };

        img.onerror = function () {
          console.error("Ошибка загрузки изображения:", urlToUse);
          setImageError(true);
          reject("Ошибка загрузки изображения по URL: " + urlToUse);
        };

        img.src = urlToUse;
      } catch (error) {
        console.error("Критическая ошибка в loadImageToMap:", error);
        reject("Критическая ошибка: " + error.message);
      }
    });
  };
  const showPlaceholder = () => {
    if (!mapInstance.current) return;

    const bounds = [
      [0, 0],
      [500, 500],
    ];

    L.rectangle(bounds, {
      color: "#e9ecef",
      fillColor: "#e9ecef",
      fillOpacity: 0.8,
      interactive: false,
    }).addTo(mapInstance.current);

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
        className: "placeholder-text",
        iconSize: [250, 150],
      }),
    }).addTo(mapInstance.current);

    mapInstance.current.fitBounds(bounds);
  };

  const handleMapClick = (e) => {
    if (mode !== "owner" || !isDrawingRef.current) {
      return;
    }

    const { lat, lng } = e.latlng;

    if (!imageOverlayRef.current) {
      alert("⚠️ Сначала загрузите план зала!");
      setIsDrawing(false);
      return;
    }

    const standPosition = {
      lat: Math.round(lat * 100) / 100,
      lng: Math.round(lng * 100) / 100,
    };

    setPendingStandPosition(standPosition);
    setShowStandForm(true);
    clearTempMarkers();
    addTempMarker(standPosition);
  };

  const clearTempMarkers = () => {
    if (!mapInstance.current) return;

    mapInstance.current.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer.options && layer.options.isTemp) {
        mapInstance.current.removeLayer(layer);
      }
    });
  };

  const addTempMarker = (position) => {
    if (!mapInstance.current) return;

    const tempMarker = L.marker([position.lat, position.lng], {
      icon: L.divIcon({
        html: `
          <div style="
            width: 30px;
            height: 30px;
            background: #ff0000;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 15px rgba(255,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="
              width: 12px;
              height: 12px;
              background: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        className: "temp-stand-marker",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
      zIndexOffset: 1000,
      isTemp: true,
      draggable: false,
    }).addTo(mapInstance.current);

    tempMarker
      .bindPopup(
        `
      <div style="padding: 10px; min-width: 150px;">
        <strong>Новая точка</strong>
        <div style="margin-top: 5px; font-size: 12px;">
          X: ${Math.round(position.lng)}<br>
          Y: ${Math.round(position.lat)}
        </div>
        <div style="margin-top: 8px; font-size: 11px; color: #666;">
          Заполните форму слева
        </div>
      </div>
    `
      )
      .openPopup();

    return tempMarker;
  };

  const handleToggleDrawing = () => {
    if (mode !== "owner") {
      showWarning("Эта функция доступна только владельцам выставки");
      return;
    }

    if (!imageOverlayRef.current && !isDrawing) {
      showWarning("Сначала загрузите план зала!");
      return;
    }

    const newState = !isDrawing;
    setIsDrawing(newState);

    if (!newState) {
      clearTempMarkers();
      showInfo("Режим добавления стендов отключен");
    } else {
      showSuccess("Режим добавления стендов включен");
    }
  };

  const createStandMarker = (stand) => {
    if (!mapInstance.current) return;
    const positionX = stand.positionX ?? stand.position?.lng;
    const positionY = stand.positionY ?? stand.position?.lat;

    if (positionX === undefined || positionY === undefined) {
      console.warn(
        `Пропускаем стенд ${stand.standNumber || stand.id}: нет координат`,
        stand
      );
      return null;
    }
    const x = Number(positionX);
    const y = Number(positionY);

    if (isNaN(x) || isNaN(y)) {
      console.warn(
        `Пропускаем стенд ${stand.standNumber}: некорректные координаты`,
        stand
      );
      return null;
    }

    // Определяем цвет по статусу
    let color = "#28a745";
    let statusText = "Свободен";

    if (stand.status === "BOOKED" || stand.standStatus === "BOOKED") {
      color = "#dc3545";
      statusText = "Забронирован";
    } else if (stand.status === "PENDING" || stand.standStatus === "PENDING") {
      color = "#ff9800";
      statusText = "Ожидает подтверждения";
    }

    const marker = L.marker([y, x], {
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
        ">
          ${stand.standNumber}
        </div>
      `,
        className: "stand-marker-container",
        iconSize: [46, 46],
      }),
    }).addTo(mapInstance.current);

    // Полный popupContent с информацией о художнике
    const popupContent = `
    <div style="padding: 15px; min-width: 300px;">
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <div style="width: 20px; height: 20px; background: ${color}; border-radius: 50%; margin-right: 10px;"></div>
        <h4 style="margin: 0;">Стенд ${stand.standNumber}</h4>
      </div>
      
      <div style="margin-bottom: 15px;">
        <p style="margin: 5px 0;"><strong>Тип:</strong> ${getTypeText(
          stand.type || stand.standType
        )}</p>
        <p style="margin: 5px 0;"><strong>Размер:</strong> ${stand.width}×${
      stand.height
    } см</p>
        <p style="margin: 5px 0;"><strong>Статус:</strong> 
          <span style="color: ${color}; font-weight: bold;">
            ${statusText}
          </span>
        </p>
        <p style="margin: 5px 0;"><strong>Координаты:</strong> X:${
          stand.positionX
        }, Y:${stand.positionY}</p>
        
        ${
          (stand.status === "PENDING" || stand.standStatus === "PENDING") &&
          stand.artistName
            ? `
          <div style="
            background: linear-gradient(135deg, #fff3cd, #ffeaa7);
            border: 2px solid #ffc107;
            border-radius: 8px;
            padding: 12px;
            margin-top: 10px;
          ">
            <h5 style="margin: 0 0 8px 0; color: #856404; font-size: 14px;">
              🎨 Запрос на бронирование
            </h5>
            <p style="margin: 5px 0; font-size: 13px;">
              <strong>Художник:</strong> ${stand.artistName}
            </p>
            <p style="margin: 5px 0; font-size: 13px;">
              <strong>Email:</strong> ${stand.artistEmail}
            </p>
            ${
              stand.bookingDate
                ? `
              <p style="margin: 5px 0; font-size: 12px; color: #6c757d;">
                <strong>Дата запроса:</strong> ${formatDate(stand.bookingDate)}
              </p>
            `
                : ""
            }
            ${
              stand.exhibitionTitle
                ? `
              <p style="margin: 5px 0; font-size: 12px;">
                <strong>Выставка:</strong> ${stand.exhibitionTitle}
              </p>
            `
                : ""
            }
          </div>
        `
            : ""
        }
        
        ${
          (stand.status === "BOOKED" || stand.standStatus === "BOOKED") &&
          stand.artistName
            ? `
          <div style="
            background: linear-gradient(135deg, #d4edda, #c3e6cb);
            border: 2px solid #28a745;
            border-radius: 8px;
            padding: 12px;
            margin-top: 10px;
          ">
            <h5 style="margin: 0 0 8px 0; color: #155724; font-size: 14px;">
              ✅ Забронирован
            </h5>
            <p style="margin: 5px 0; font-size: 13px;">
              <strong>Художник:</strong> ${stand.artistName}
            </p>
            ${
              stand.artistEmail
                ? `
              <p style="margin: 5px 0; font-size: 13px;">
                <strong>Email:</strong> ${stand.artistEmail}
              </p>
            `
                : ""
            }
            ${
              stand.exhibitionTitle
                ? `
              <p style="margin: 5px 0; font-size: 12px;">
                <strong>Выставка:</strong> ${stand.exhibitionTitle}
              </p>
            `
                : ""
            }
          </div>
        `
            : ""
        }
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${
          mode === "owner"
            ? `<div style="display: flex; flex-direction: column; gap: 8px;">
            ${
              stand.status === "PENDING" || stand.standStatus === "PENDING"
                ? `<div style="display: flex; gap: 8px;">
                <button 
                  onclick="if(confirm('Подтвердить бронирование стенда ${
                    stand.standNumber
                  } для художника ${stand.artistName} (${
                    stand.artistEmail
                  })?')) { 
                    if(window.handleApproveBooking) { 
                      window.handleApproveBooking('${
                        stand.exhibitionStandId || stand.id
                      }', '${stand.standNumber}'); 
                    }
                  }" 
                  style="
                    flex: 1;
                    padding: 10px; 
                    background: linear-gradient(135deg, #28a745, #218838); 
                    color: white; 
                    border: none; 
                    border-radius: 6px; 
                    cursor: pointer;
                    font-weight: bold;
                  "
                >
                  ✅ Подтвердить
                </button>
                <button 
                  onclick="if(confirm('Отклонить бронирование стенда ${
                    stand.standNumber
                  } от художника ${stand.artistName}?')) { 
                    if(window.handleRejectBooking) { 
                      window.handleRejectBooking('${
                        stand.exhibitionStandId || stand.id
                      }', '${stand.standNumber}'); 
                    }
                  }" 
                  style="
                    flex: 1;
                    padding: 10px; 
                    background: linear-gradient(135deg, #dc3545, #c82333); 
                    color: white; 
                    border: none; 
                    border-radius: 6px; 
                    cursor: pointer;
                    font-weight: bold;
                  "
                >
                  ❌ Отклонить
                </button>
              </div>`
                : ""
            }
            <button 
              onclick="if(confirm('Удалить стенд ${stand.standNumber}?')) { 
                if(window.handleDeleteStand) { 
                  window.handleDeleteStand('${
                    stand.exhibitionStandId || stand.id
                  }', '${stand.standNumber}'); 
                }
              }" 
              style="
                padding: 10px; 
                background: linear-gradient(135deg, #6c757d, #5a6268); 
                color: white; 
                border: none; 
                border-radius: 6px; 
                cursor: pointer;
                font-weight: bold;
              "
            >
              🗑️ Удалить стенд
            </button>
          </div>`
            : ""
        }
        ${
          mode === "artist" &&
          (stand.status === "AVAILABLE" || stand.standStatus === "AVAILABLE")
            ? `<button 
            onclick="if(confirm('Забронировать стенд ${stand.standNumber}?')) { 
              if(window.handleBookStand) { 
                window.handleBookStand('${
                  stand.exhibitionStandId || stand.id
                }', '${stand.standNumber}'); 
              }
            }" 
            style="
              padding: 10px; 
              background: linear-gradient(135deg, #007bff, #0056b3); 
              color: white; 
              border: none; 
              border-radius: 6px; 
              cursor: pointer;
              font-weight: bold;
            "
          >
            📝 Забронировать
          </button>`
            : ""
        }
        ${
          mode === "artist" &&
          (stand.status === "PENDING" || stand.standStatus === "PENDING")
            ? `<div style="
            padding: 10px; 
            background: linear-gradient(135deg, #ff9800, #f57c00); 
            color: white; 
            border-radius: 6px; 
            text-align: center;
            font-weight: bold;
          ">
            ⏳ Ожидает подтверждения
          </div>`
            : ""
        }
        ${
          mode === "artist" &&
          (stand.status === "BOOKED" || stand.standStatus === "BOOKED")
            ? `<div style="
            padding: 10px; 
            background: linear-gradient(135deg, #dc3545, #c82333); 
            color: white; 
            border-radius: 6px; 
            text-align: center;
            font-weight: bold;
          ">
            ✅ Забронировано
          </div>`
            : ""
        }
      </div>
    </div>
  `;

    marker.bindPopup(popupContent);

    marker.on("click", (e) => {
      e.originalEvent.stopPropagation();
      setSelectedStand(stand);
      marker.openPopup();
    });

    marker.standData = stand;
    return marker;
  };
  const renderStands = () => {
    if (!mapInstance.current) return;

    // Удаляем существующие маркеры стендов
    mapInstance.current.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer.standData) {
        mapInstance.current.removeLayer(layer);
      }
    });

    console.log("Рендерим стенды из пропсов:", stands?.length || 0);
    console.log("Детали стендов:", stands);

    // ДОБАВЬТЕ ЭТУ ПРОВЕРКУ:
    if (!stands || !Array.isArray(stands)) {
      console.warn("Stands is not an array or is undefined:", stands);
      return;
    }

    // Фильтруем валидные стенды с ПРАВИЛЬНЫМИ координатами
    const validStands = stands.filter((stand) => {
      if (!stand) return false;

      // Проверяем разные варианты структуры данных
      const hasValidCoords =
        (stand.positionX !== undefined && stand.positionY !== undefined) || // ваша структура
        (stand.position?.lng !== undefined &&
          stand.position?.lat !== undefined); // альтернативная

      const hasStandNumber = stand.standNumber !== undefined;

      if (!hasValidCoords || !hasStandNumber) {
        console.warn(`Пропускаем невалидный стенд:`, stand);
        return false;
      }

      return true;
    });

    console.log(
      "Валидные стенды для рендеринга:",
      validStands.length,
      validStands
    );

    // Создаем маркеры
    validStands.forEach((stand) => {
      createStandMarker(stand);
    });
  };

  const handleSaveStand = async () => {
    if (!pendingStandPosition || !standFormData.standNumber) {
      showWarning("Заполните все обязательные поля");
      return;
    }

    try {
      const newStand = {
        standNumber: standFormData.standNumber,
        positionX: Math.round(pendingStandPosition.lng),
        positionY: Math.round(pendingStandPosition.lat),
        width: standFormData.width,
        height: standFormData.height,
        type: standFormData.type,
        status: "AVAILABLE",
      };

      console.log("Создаем новый стенд:", newStand);

      if (onCreateStand) {
        await onCreateStand(newStand);
      }

      // setTempStands([...tempStands, { ...newStand, id: Date.now() }]);

      setShowStandForm(false);
      setPendingStandPosition(null);
      setStandFormData({
        standNumber: "",
        type: "WALL",
        width: 100,
        height: 100,
      });

      clearTempMarkers();

      showSuccess(`Стенд ${newStand.standNumber} успешно добавлен!`);
    } catch (err) {
      showError(errorMessage, "Ошибка сохранения стенда");
    }
  };

  const getTypeText = (type) => {
    const types = {
      WALL: "🎨 Стена для живописи",
      BOOTH: "🗿 Будка для скульптур",
      OPEN_SPACE: "📷 Открытое пространство",
    };
    return types[type] || type;
  };
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };
  const getStats = () => {
    const allStands = stands || [];
    return {
      total: allStands.length,
      available: allStands.filter((s) => s.status === "AVAILABLE").length,
      pending: allStands.filter((s) => s.status === "PENDING").length,
      booked: allStands.filter((s) => s.status === "BOOKED").length,
    };
  };

  const stats = getStats();
  const handleSaveAll = async () => {
    try {
      if (tempStands.length > 0) {
        showSuccess(`Сохранено ${tempStands.length} стендов!`);
      } else {
        showInfo("Все изменения уже сохранены");
      }
    } catch (error) {
      showError(errorMessage, "Ошибка сохранения");
    }
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  // ========== RENDER ==========
  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 80px)",
        backgroundColor: "#f8f9fa",
        padding: "20px",
        paddingBottom: "80px",
      }}
    >
      {/* ШАПКА С КНОПКАМИ */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          right: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 1000,
        }}
      >
        <button
          onClick={handleBack}
          style={{
            padding: "10px 20px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "500",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#5a6268")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#6c757d")}
        >
          ← Назад в личный кабинет
        </button>
      </div>

      {/* ЛЕВАЯ ПАНЕЛЬ - УПРАВЛЕНИЕ */}
      <div
        style={{
          width: "320px",
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "12px",
          marginRight: "20px",
          marginTop: "60px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          overflowY: "auto",
          border: "1px solid #dee2e6",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: "20px",
            color: "#343a40",
            borderBottom: "2px solid #007bff",
            paddingBottom: "10px",
            fontSize: "24px",
          }}
        >
          {mode === "owner" ? "Управление выставкой" : "Бронирование"}
        </h2>

        {mode === "owner" ? (
          <>
            {/* СЕКЦИЯ ЗАГРУЗКИ КАРТЫ НА СЕРВЕР */}
            <div
              style={{
                backgroundColor: "#f8f9fa",
                padding: "20px",
                borderRadius: "10px",
                marginBottom: "20px",
                border: "2px dashed #dee2e6",
              }}
            >
              <h4
                style={{
                  marginTop: 0,
                  color: "#495057",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    width: "30px",
                    height: "30px",
                    background: "#007bff",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "16px",
                  }}
                >
                  1
                </span>
                Загрузка плана зала
              </h4>

              <div style={{ marginBottom: "15px" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  id="mapUpload"
                  style={{ display: "none" }}
                  disabled={loading}
                />
                <label
                  htmlFor="mapUpload"
                  style={{
                    display: "block",
                    padding: "15px",
                    background: loading
                      ? "#e9ecef"
                      : "linear-gradient(135deg, #007bff, #0056b3)",
                    color: loading ? "#6c757d" : "white",
                    textAlign: "center",
                    borderRadius: "8px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontWeight: "600",
                    fontSize: "16px",
                    transition: "all 0.2s",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? "Загрузка на сервер..." : "Загрузить"}
                </label>

                {/* Прогресс бар */}
                {loading && uploadProgress > 0 && (
                  <div
                    style={{
                      marginTop: "15px",
                      background: "#e9ecef",
                      borderRadius: "6px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${uploadProgress}%`,
                        height: "6px",
                        background: "linear-gradient(90deg, #28a745, #20c997)",
                        transition: "width 0.3s",
                      }}
                    ></div>
                    <div
                      style={{
                        padding: "8px 12px",
                        fontSize: "12px",
                        color: "#495057",
                        textAlign: "center",
                      }}
                    >
                      Загрузка: {uploadProgress}%
                    </div>
                  </div>
                )}

                {/* Информация о загруженном изображении */}
                {/* {uploadedImageUrl && !loading && (
                  <div
                    style={{
                      backgroundColor: "#d4edda",
                      color: "#155724",
                      padding: "12px",
                      borderRadius: "6px",
                      marginTop: "15px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <div>
                        <strong>Изображение загружено на сервер</strong>
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          opacity: 0.8,
                          marginTop: "4px",
                        }}
                      >
                        ID карты: {hallMapId || "новый"}
                      </div>
                    </div>
                  </div>
                )} */}

                {mapImage && !imageError && !loading && (
                  <div
                    style={{
                      backgroundColor: "#cce5ff",
                      color: "#004085",
                      padding: "12px",
                      borderRadius: "6px",
                      marginTop: "15px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}></span>
                    <span>Карта зала загружена</span>
                  </div>
                )}

                {imageError && (
                  <div
                    style={{
                      backgroundColor: "#f8d7da",
                      color: "#721c24",
                      padding: "12px",
                      borderRadius: "6px",
                      marginTop: "15px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>❌</span>
                    <span>Ошибка загрузки изображения</span>
                  </div>
                )}
              </div>

              {/* Информация о карте */}
              {/* {hallMapId && (
                <div
                  style={{
                    backgroundColor: "#fff3cd",
                    color: "#856404",
                    padding: "12px",
                    borderRadius: "6px",
                    marginTop: "10px",
                    fontSize: "13px",
                    border: "1px solid #ffeaa7",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "5px",
                    }}
                  >
                    <strong>Информация</strong>
                  </div>
                  <div style={{ fontSize: "12px", opacity: 0.9 }}>
                    ID карты: <code>{hallMapId}</code>
                    <br />
                    {hallMap?.name && `Название: ${hallMap.name}`}
                  </div>
                </div>
              )} */}
            </div>
            {/* СЕКЦИЯ ДОБАВЛЕНИЯ СТЕНДОВ */}
            <div
              style={{
                backgroundColor: "#f8f9fa",
                padding: "20px",
                borderRadius: "10px",
                marginBottom: "20px",
                border: isDrawing ? "2px solid #28a745" : "2px solid #dee2e6",
              }}
            >
              <h4
                style={{
                  marginTop: 0,
                  color: "#495057",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    width: "30px",
                    height: "30px",
                    background: "#28a745",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "16px",
                  }}
                >
                  2
                </span>
                Добавление стендов
              </h4>

              <div style={{ marginBottom: "15px" }}>
                <button
                  onClick={handleToggleDrawing}
                  style={{
                    width: "100%",
                    padding: "15px",
                    background: isDrawing
                      ? "linear-gradient(135deg, #dc3545, #c82333)"
                      : "linear-gradient(135deg, #28a745, #218838)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "16px",
                    transition: "all 0.2s",
                  }}
                >
                  {isDrawing ? "Отменить добавление" : "Добавить стенд"}
                </button>

                <div
                  style={{
                    backgroundColor: isDrawing ? "#d4edda" : "#fff3cd",
                    color: isDrawing ? "#155724" : "#856404",
                    padding: "15px",
                    borderRadius: "8px",
                    marginTop: "15px",
                    fontSize: "14px",
                    border: `2px solid ${isDrawing ? "#c3e6cb" : "#ffeaa7"}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <strong>
                      {isDrawing ? "Режим добавления активен" : "Инструкция"}
                    </strong>
                  </div>
                  <p style={{ margin: 0 }}>
                    {isDrawing
                      ? "Кликните на карте справа в нужном месте, чтобы разместить стенд"
                      : "Нажмите кнопку выше, чтобы включить режим добавления стендов"}
                  </p>
                </div>

                {/* ВИЗУАЛЬНЫЙ ИНДИКАТОР РЕЖИМА */}
                {isDrawing && (
                  <div
                    style={{
                      backgroundColor: "#d1ecf1",
                      border: "2px solid #bee5eb",
                      color: "#0c5460",
                      padding: "12px",
                      borderRadius: "8px",
                      marginTop: "15px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    {/* <div
                      style={{
                        width: "20px",
                        height: "20px",
                        background: "#17a2b8",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "12px",
                      }}
                    >
                      🎯
                    </div> */}
                    <div>
                      <strong>Режим добавления активен</strong>
                      <div
                        style={{
                          fontSize: "12px",
                          marginTop: "4px",
                          opacity: 0.8,
                        }}
                      >
                        Кликните на карте, чтобы разместить стенд
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ФОРМА ДОБАВЛЕНИЯ СТЕНДА */}
              {showStandForm && (
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "20px",
                    borderRadius: "10px",
                    border: "2px solid #007bff",
                    marginTop: "15px",
                    boxShadow: "0 4px 15px rgba(0,123,255,0.15)",
                  }}
                >
                  <h5
                    style={{ marginTop: 0, color: "#007bff", fontSize: "18px" }}
                  >
                    📝 Новый стенд
                  </h5>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#495057",
                      }}
                    >
                      Номер стенда *
                    </label>
                    <input
                      type="text"
                      placeholder="Например: A1, B2"
                      value={standFormData.standNumber}
                      onChange={(e) =>
                        setStandFormData({
                          ...standFormData,
                          standNumber: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "2px solid #ced4da",
                        borderRadius: "6px",
                        fontSize: "16px",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#007bff")}
                      onBlur={(e) => (e.target.style.borderColor = "#ced4da")}
                    />
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#495057",
                      }}
                    >
                      Тип стенда
                    </label>

                    <select
                      value={standFormData.type}
                      onChange={(e) =>
                        setStandFormData({
                          ...standFormData,
                          type: e.target.value,
                        })
                      }
                    >
                      <option value="WALL">🎨 Стена для живописи</option>
                      <option value="BOOTH">🗿 Будка для скульптур</option>
                      <option value="OPEN_SPACE">
                        📷 Открытое пространство
                      </option>
                    </select>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "15px",
                      marginBottom: "20px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#495057",
                        }}
                      >
                        Ширина (см)
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="500"
                        value={standFormData.width}
                        onChange={(e) =>
                          setStandFormData({
                            ...standFormData,
                            width: parseInt(e.target.value) || 100,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "2px solid #ced4da",
                          borderRadius: "6px",
                          fontSize: "16px",
                          transition: "border-color 0.2s",
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "#007bff")
                        }
                        onBlur={(e) => (e.target.style.borderColor = "#ced4da")}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#495057",
                        }}
                      >
                        Высота (см)
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="500"
                        value={standFormData.height}
                        onChange={(e) =>
                          setStandFormData({
                            ...standFormData,
                            height: parseInt(e.target.value) || 100,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "2px solid #ced4da",
                          borderRadius: "6px",
                          fontSize: "16px",
                          transition: "border-color 0.2s",
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "#007bff")
                        }
                        onBlur={(e) => (e.target.style.borderColor = "#ced4da")}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "15px" }}>
                    <button
                      onClick={handleSaveStand}
                      style={{
                        flex: 1,
                        padding: "12px",
                        background: "linear-gradient(135deg, #28a745, #218838)",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "16px",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.target.style.transform = "translateY(-2px)")
                      }
                      onMouseOut={(e) =>
                        (e.target.style.transform = "translateY(0)")
                      }
                    >
                      ✅ Сохранить стенд
                    </button>
                    <button
                      onClick={() => {
                        setShowStandForm(false);
                        setPendingStandPosition(null);
                        clearTempMarkers();
                      }}
                      style={{
                        flex: 1,
                        padding: "12px",
                        background: "linear-gradient(135deg, #6c757d, #5a6268)",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "16px",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.target.style.transform = "translateY(-2px)")
                      }
                      onMouseOut={(e) =>
                        (e.target.style.transform = "translateY(0)")
                      }
                    >
                      ❌ Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* СТАТИСТИКА */}
            <div
              style={{
                backgroundColor: "#f8f9fa",
                padding: "20px",
                borderRadius: "10px",
                marginBottom: "20px",
                border: "2px solid #dee2e6",
              }}
            >
              <h4
                style={{
                  marginTop: 0,
                  color: "#495057",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    width: "30px",
                    height: "30px",
                    background: "#6f42c1",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "16px",
                  }}
                >
                  3
                </span>
                Статистика выставки
              </h4>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    background: "linear-gradient(135deg, #343a40, #212529)",
                    padding: "15px",
                    borderRadius: "8px",
                    textAlign: "center",
                    color: "white",
                  }}
                >
                  <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                    {stats.total}
                  </div>
                  <div style={{ fontSize: "12px", opacity: 0.9 }}>
                    Всего стендов
                  </div>
                </div>
                <div
                  style={{
                    background: "linear-gradient(135deg, #28a745, #218838)",
                    padding: "15px",
                    borderRadius: "8px",
                    textAlign: "center",
                    color: "white",
                  }}
                >
                  <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                    {stats.available}
                  </div>
                  <div style={{ fontSize: "12px", opacity: 0.9 }}>Свободно</div>
                </div>
                <div
                  style={{
                    background: "linear-gradient(135deg, #dc3545, #c82333)",
                    padding: "15px",
                    borderRadius: "8px",
                    textAlign: "center",
                    color: "white",
                  }}
                >
                  <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                    {stats.booked}
                  </div>
                  <div style={{ fontSize: "12px", opacity: 0.9 }}>Занято</div>
                </div>
                <div
                  style={{
                    background: "linear-gradient(135deg, #ff9800, #f57c00)",
                    padding: "15px",
                    borderRadius: "8px",
                    textAlign: "center",
                    color: "white",
                  }}
                >
                  <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                    {stats.pending}
                  </div>
                  <div style={{ fontSize: "12px", opacity: 0.9 }}>
                    В ожидании
                  </div>
                </div>
              </div>
            </div>
            {/* СЕКЦИЯ ОЖИДАЮЩИХ ПОДТВЕРЖДЕНИЯ */}
            {mode === "owner" && stats.pending > 0 && (
              <div
                style={{
                  backgroundColor: "#fff3cd",
                  padding: "20px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  border: "2px solid #ffc107",
                }}
              >
                <h4
                  style={{
                    marginTop: 0,
                    color: "#856404",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span
                    style={{
                      width: "30px",
                      height: "30px",
                      background: "#ff9800",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "16px",
                    }}
                  >
                    !
                  </span>
                  Ожидают подтверждения: {stats.pending}
                </h4>

                <p
                  style={{
                    fontSize: "13px",
                    color: "#856404",
                    margin: "0 0 15px 0",
                  }}
                >
                  Новые запросы на бронирование:
                </p>

                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {stands
                    .filter(
                      (s) =>
                        (s.status === "PENDING" ||
                          s.standStatus === "PENDING") &&
                        s.artistName
                    )
                    .map((stand) => (
                      <div
                        key={stand.exhibitionStandId || stand.id}
                        style={{
                          backgroundColor: "white",
                          padding: "15px",
                          borderRadius: "8px",
                          marginBottom: "12px",
                          border: "2px solid #ffeaa7",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseOver={(e) =>
                          (e.target.style.boxShadow =
                            "0 4px 12px rgba(255,193,7,0.2)")
                        }
                        onMouseOut={(e) => (e.target.style.boxShadow = "none")}
                        onClick={() => {
                          if (
                            mapInstance.current &&
                            stand.positionY &&
                            stand.positionX
                          ) {
                            mapInstance.current.setView(
                              [stand.positionY, stand.positionX],
                              Math.max(mapInstance.current.getZoom(), 2)
                            );
                          }
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "10px",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "5px",
                              }}
                            >
                              <strong
                                style={{ fontSize: "16px", color: "#343a40" }}
                              >
                                Стенд {stand.standNumber}
                              </strong>
                              <span
                                style={{
                                  fontSize: "12px",
                                  padding: "2px 8px",
                                  backgroundColor:
                                    (stand.type || stand.standType) === "WALL"
                                      ? "#007bff"
                                      : (stand.type || stand.standType) ===
                                        "BOOTH"
                                      ? "#6f42c1"
                                      : "#17a2b8",
                                  color: "white",
                                  borderRadius: "12px",
                                }}
                              >
                                {(stand.type || stand.standType) === "WALL"
                                  ? "🎨 Стена"
                                  : (stand.type || stand.standType) === "BOOTH"
                                  ? "🗿 Будка"
                                  : "📷 Открытое"}
                              </span>
                            </div>

                            <div
                              style={{
                                fontSize: "14px",
                                color: "#495057",
                                marginBottom: "8px",
                              }}
                            >
                              <strong>Художник:</strong> {stand.artistName}
                            </div>

                            <div style={{ fontSize: "13px", color: "#6c757d" }}>
                              <strong>Email:</strong> {stand.artistEmail}
                            </div>

                            {stand.exhibitionTitle && (
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#6c757d",
                                  marginTop: "5px",
                                }}
                              >
                                <strong>Выставка:</strong>{" "}
                                {stand.exhibitionTitle}
                              </div>
                            )}

                            {stand.bookingDate && (
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#adb5bd",
                                  marginTop: "8px",
                                }}
                              >
                                📅 {formatDate(stand.bookingDate)}
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              marginLeft: "10px",
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  confirm(
                                    `Подтвердить бронирование для ${stand.artistName}?`
                                  )
                                ) {
                                  if (window.handleApproveBooking) {
                                    window.handleApproveBooking(
                                      stand.exhibitionStandId || stand.id,
                                      stand.standNumber
                                    );
                                  }
                                }
                              }}
                              style={{
                                padding: "8px 12px",
                                background:
                                  "linear-gradient(135deg, #28a745, #218838)",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "bold",
                              }}
                            >
                              ✅
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  confirm(
                                    `Отклонить запрос от ${stand.artistName}?`
                                  )
                                ) {
                                  if (window.handleRejectBooking) {
                                    window.handleRejectBooking(
                                      stand.exhibitionStandId || stand.id,
                                      stand.standNumber
                                    );
                                  }
                                }
                              }}
                              style={{
                                padding: "8px 12px",
                                background:
                                  "linear-gradient(135deg, #dc3545, #c82333)",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "bold",
                              }}
                            >
                              ❌
                            </button>
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6c757d",
                            padding: "8px",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "4px",
                            marginTop: "10px",
                          }}
                        >
                          <strong>Размер:</strong> {stand.width}×{stand.height}{" "}
                          см
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* ИНТЕРФЕЙС ХУДОЖНИКА */
          <>
            <div
              style={{
                backgroundColor: "#f8f9fa",
                padding: "20px",
                borderRadius: "10px",
                marginBottom: "20px",
                border: "2px solid #dee2e6",
              }}
            >
              <h4 style={{ marginTop: 0, color: "#495057" }}>Выбор стенда</h4>

              {selectedStand ? (
                <>
                  <div
                    style={{
                      backgroundColor: "white",
                      padding: "20px",
                      borderRadius: "10px",
                      marginBottom: "20px",
                      border: "2px solid #007bff",
                      borderLeft: `8px solid ${
                        selectedStand.status === "BOOKED"
                          ? "#dc3545"
                          : selectedStand.status === "PENDING"
                          ? "#ff9800"
                          : "#28a745"
                      }`,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "15px",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          background:
                            selectedStand.status === "BOOKED"
                              ? "#dc3545"
                              : selectedStand.status === "PENDING"
                              ? "#ff9800"
                              : "#28a745",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: "bold",
                          fontSize: "16px",
                          marginRight: "12px",
                        }}
                      >
                        {selectedStand.standNumber}
                      </div>
                      <div>
                        <h5
                          style={{
                            margin: 0,
                            color: "#343a40",
                            fontSize: "18px",
                          }}
                        >
                          Стенд {selectedStand.standNumber}
                        </h5>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#6c757d",
                            marginTop: "2px",
                          }}
                        >
                          {getTypeText(selectedStand.type)}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "15px",
                          marginBottom: "15px",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6c757d",
                              marginBottom: "4px",
                            }}
                          >
                            Ширина
                          </div>
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: "500",
                              color: "#495057",
                            }}
                          >
                            {selectedStand.width} см
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6c757d",
                              marginBottom: "4px",
                            }}
                          >
                            Высота
                          </div>
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: "500",
                              color: "#495057",
                            }}
                          >
                            {selectedStand.height} см
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "10px",
                          borderRadius: "6px",
                          background:
                            selectedStand.status === "BOOKED"
                              ? "#f8d7da"
                              : selectedStand.status === "PENDING"
                              ? "#fff3cd"
                              : "#d4edda",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: "14px", color: "#495057" }}>
                          Статус:
                        </span>
                        <span
                          style={{
                            fontWeight: "600",
                            fontSize: "14px",
                            color:
                              selectedStand.status === "BOOKED"
                                ? "#721c24"
                                : selectedStand.status === "PENDING"
                                ? "#856404"
                                : "#155724",
                          }}
                        >
                          {selectedStand.status === "BOOKED"
                            ? "Забронирован"
                            : selectedStand.status === "PENDING"
                            ? "Ожидает подтверждения"
                            : "Свободен"}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #6c757d 0%, #5a6268 100%)",
                    padding: "30px 20px",
                    borderRadius: "10px",
                    textAlign: "center",
                    color: "#ffffff", // Явно указываем белый цвет для всего контейнера
                    width: "100%",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "200px",
                  }}
                >
                  <h5
                    style={{
                      margin: "10px 0",
                      fontSize: "20px",
                      fontWeight: "600",
                      lineHeight: "1.3",
                      color: "#ffffff", // Явно белый для заголовка
                    }}
                  >
                    Выберите стенд на карте
                  </h5>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "rgba(255, 255, 255, 0.9)", // Полупрозрачный белый
                      margin: "10px 0 0 0",
                      maxWidth: "300px",
                      lineHeight: "1.4",
                    }}
                  >
                    Кликните на любой свободный стенд (зелёная точка)
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ПРАВАЯ ПАНЕЛЬ - КАРТА */}
      <div
        style={{
          flex: 1,
          position: "relative",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          marginTop: "60px",
          overflow: "hidden",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          border: "15px solid #ffffff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ЗАГОЛОВОК КАРТЫ */}
        <div
          style={{
            padding: "15px 20px",
            backgroundColor: "#f8f9fa",
            borderBottom: "2px solid #dee2e6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                color: "#343a40",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              Карта выставки
            </h3>
            <p
              style={{
                margin: "5px 0 0 0",
                color: "#6c757d",
                fontSize: "14px",
              }}
            >
              {mapImage
                ? "Используйте колесико мыши для масштабирования"
                : "Загрузите план зала для начала работы"}
            </p>
          </div>

          <div
            style={{
              backgroundColor: mode === "owner" ? "#007bff" : "#28a745",
              color: "white",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {mode === "owner" ? "Владелец галереи" : "Художник"}
          </div>
        </div>

        {/* ОБЛАСТЬ КАРТЫ */}
        <div
          ref={mapRef}
          style={{
            flex: 1,
            width: "100%",
            backgroundColor: "#f8f9fa",
          }}
        />

        {/* ПАНЕЛЬ ИНФОРМАЦИИ */}
        <div
          style={{
            padding: "15px 20px",
            backgroundColor: "#f8f9fa",
            borderTop: "2px solid #dee2e6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "14px",
            color: "#495057",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: "#28a745",
                    borderRadius: "50%",
                  }}
                ></div>
                <span>Свободно ({stats.available})</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: "#ff9800",
                    borderRadius: "50%",
                  }}
                ></div>
                <span>Ожидает ({stats.pending})</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: "#dc3545",
                    borderRadius: "50%",
                  }}
                ></div>
                <span>Забронировано ({stats.booked})</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ opacity: 0.7 }}>Масштаб:</span>
              <span style={{ fontWeight: "600" }}>{mapScale.toFixed(1)}x</span>
            </div>
            <div
              style={{
                padding: "6px 12px",
                backgroundColor: "white",
                borderRadius: "6px",
                border: "1px solid #dee2e6",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
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
