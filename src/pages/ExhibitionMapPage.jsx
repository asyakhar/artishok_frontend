import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import MapEditor from "../components/MapEditor";
import { artistApi, commonApi, ownerApi } from "../api";
import "./ExhibitionMapPage.css";

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
  const [bookings, setBookings] = useState([]);
  const [manualRefreshKey, setManualRefreshKey] = useState(0);

  useEffect(() => {
    // Получаем роль пользователя из sessionStorage
    const user = JSON.parse(sessionStorage.getItem("user") || "null");
    const role = user?.role || user?.authorities?.[0];

    if (role === "GALLERY_OWNER" || role === "ADMIN") {
      setUserRole("GALLERY_OWNER");
      setMode("owner");
    } else if (role === "ARTIST") {
      setUserRole("ARTIST");
      setMode("artist");
    } else {
      // Если нет роли или не авторизован - редирект на логин
      window.location.href = "/login";
      return;
    }

    loadExhibitionData();
    loadBookings();
  }, [exhibitionId]);

  const handleManualRefresh = () => {
    console.log("🔄 Ручное обновление");
    setManualRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    if (selectedMap?.id) {
      loadStandsForMap(selectedMap.id);
      if (userRole === "GALLERY_OWNER") {
        loadBookings();
      }
    }
  }, [manualRefreshKey, selectedMap?.id, userRole]);

  const loadBookings = async () => {
    try {
      if (userRole === "GALLERY_OWNER") {
        const response = await ownerApi.getPendingBookings();
        console.log("Загружены бронирования:", response);

        if (response.bookings && Array.isArray(response.bookings)) {
          setBookings(response.bookings);
        } else {
          setBookings([]);
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки бронирований:", error);
      setBookings([]);
    }
  };

  const loadExhibitionData = async () => {
    console.log("=== DEBUG: Начало загрузки ===");
    console.log("exhibitionId:", exhibitionId);
    try {
      setLoading(true);

      const exhibitionData = await commonApi.getExhibitionById(exhibitionId);
      setExhibition(exhibitionData);

      const mapsData = await commonApi.getHallMapsByEvent(exhibitionId);
      console.log("Получены карты залов:", mapsData);

      setHallMaps(mapsData);

      if (mapsData.length > 0) {
        const firstMap = mapsData[0];
        setSelectedMap(firstMap);

        // Загружаем стенды только если их нет в карте
        if (firstMap.exhibitionStands && firstMap.exhibitionStands.length > 0) {
          const validStands = filterValidStands(firstMap.exhibitionStands);
          console.log("Стенды загружены вместе с картой:", validStands.length);
          setStands(validStands);
        } else {
          // Загружаем отдельно, но с защитой от пустых ответов
          await loadStandsForMap(firstMap.id);
        }
      } else {
        setStands([]);
      }
    } catch (err) {
      console.error("Полная ошибка загрузки:", err);
      setError(
        "Ошибка загрузки: " + (err.response?.data?.error || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const loadStandsForMap = async (hallMapId, forceRefresh = false) => {
    try {
      if (!hallMapId) {
        console.warn("Нет ID карты для загрузки стендов");
        return;
      }

      console.log("=== DEBUG: Загрузка стендов ===");
      console.log("hallMapId:", hallMapId, "forceRefresh:", forceRefresh);

      const standsData = await ownerApi.getStandsByHallMap(hallMapId);
      console.log("Сырые данные от API:", standsData);

      // Защита от пустых ответов
      if (Array.isArray(standsData)) {
        // Проверяем, не пустой ли это массив объектов
        if (standsData.length > 0) {
          const isEmptyObjects = standsData.every((item) => {
            return (
              item === null ||
              typeof item !== "object" ||
              Object.keys(item).length === 0
            );
          });

          if (isEmptyObjects) {
            console.warn(
              "⚠️ API вернул массив пустых объектов. Не обновляем стенды."
            );
            return; // Не обновляем состояние
          }
        }
      }

      // Определяем, где находятся стенды в ответе
      let actualStands = [];

      if (Array.isArray(standsData)) {
        actualStands = standsData;
      } else if (standsData && typeof standsData === "object") {
        // Проверяем различные возможные структуры
        if (standsData.stands && Array.isArray(standsData.stands)) {
          actualStands = standsData.stands;
        } else if (
          standsData.exhibitionStands &&
          Array.isArray(standsData.exhibitionStands)
        ) {
          actualStands = standsData.exhibitionStands;
        } else if (standsData.content && Array.isArray(standsData.content)) {
          actualStands = standsData.content;
        }
      }

      console.log("Извлеченные стенды:", actualStands);

      // Фильтруем только валидные стенды
      const validStands = filterValidStands(actualStands);
      console.log("Валидные стенды после фильтрации:", validStands.length);

      if (validStands.length > 0 || forceRefresh) {
        setStands(validStands);
      }
    } catch (err) {
      console.error("Ошибка загрузки стендов:", err);
      // При ошибке не обнуляем стенды, чтобы не потерять существующие
      if (stands.length === 0) {
        setStands([]);
      }
    }
  };

  // В refreshStands добавьте forceRefresh
  const refreshStands = async () => {
    if (selectedMap?.id) {
      await loadStandsForMap(selectedMap.id, true); // forceRefresh = true
    }
  };

  const handleDeleteStand = async (standId) => {
    if (!window.confirm("Удалить этот стенд?")) {
      return;
    }

    try {
      await ownerApi.deleteStand(standId);

      // Сразу обновляем состояние стендов
      setStands((prev) => prev.filter((stand) => stand.id !== standId));

      alert("✅ Стенд успешно удален");
    } catch (error) {
      console.error("Ошибка удаления стенда:", error);
      alert(
        "❌ Ошибка удаления: " + (error.response?.data?.error || error.message)
      );
    }
  };
  // ========== ОБРАБОТЧИКИ ДЛЯ ВЛАДЕЛЬЦА ==========
  // const handleUploadHallMap = async (imageFile, name = "Карта зала") => {
  //   const formData = new FormData();
  //   formData.append("name", name);
  //   formData.append("exhibitionEventId", exhibitionId); // убедитесь, что exhibitionId доступен
  //   if (imageFile) {
  //     formData.append("mapImage", imageFile); // ← именно файл, не URL!
  //   }

  //   try {
  //     // Предполагается, что ownerApi.uploadHallMapWithImage отправляет FormData
  //     const response = await ownerApi.uploadHallMapWithImage(formData);

  //     // Обновляем данные
  //     const mapsData = await commonApi.getHallMapsByEvent(exhibitionId);
  //     setHallMaps(mapsData);
  //     if (mapsData.length > 0) {
  //       setSelectedMap(mapsData[0]);
  //       await loadStandsForMap(mapsData[0].id);
  //     }
  //     return response;
  //   } catch (err) {
  //     throw new Error(err.response?.data?.error || "Ошибка загрузки карты");
  //   }
  // };
  // const handleUploadHallMap = async (imageFile, name = "Карта зала") => {
  //   try {
  //     // Создаем объект для API
  //     const requestData = {
  //       name: name,
  //       exhibitionEventId: Number(exhibitionId), // Преобразуем в число
  //       mapImage: imageFile,
  //     };

  //     console.log("📤 Отправка данных для создания карты:", {
  //       name: requestData.name,
  //       exhibitionEventId: requestData.exhibitionEventId,
  //       hasImage: !!requestData.mapImage,
  //     });

  //     // Используем правильную функцию
  //     const response = await ownerApi.createHallMapWithImage(requestData);

  //     console.log(" Карта успешно создана:", response);

  //     // Обновляем данные
  //     const mapsData = await commonApi.getHallMapsByEvent(exhibitionId);
  //     setHallMaps(mapsData);

  //     if (mapsData.length > 0) {
  //       const newMap = mapsData[mapsData.length - 1];
  //       setSelectedMap(newMap);
  //       await loadStandsForMap(newMap.id);
  //       setManualRefreshKey((prev) => prev + 1);
  //     }

  //     return response;
  //   } catch (err) {
  //     console.error("Ошибка создания карты:", err);
  //     throw new Error(
  //       err.response?.data?.error ||
  //         err.response?.data?.message ||
  //         err.message ||
  //         "Ошибка создания карты"
  //     );
  //   }
  // };
  const handleUploadHallMap = async (newHallMapData) => {
    try {
      console.log("Получены данные карты от MapEditor:", {
        id: newHallMapData.id,
        name: newHallMapData.name,
        hasImage: !!newHallMapData.mapImageUrl,
      });

      // Если карта уже имеет ID (передан из MapEditor), значит она уже создана
      if (newHallMapData.id) {
        console.log("Карта уже создана, ID:", newHallMapData.id);

        // Обновляем состояние
        const updatedMaps = hallMaps.map((map) =>
          map.id === newHallMapData.id ? { ...map, ...newHallMapData } : map
        );
        setHallMaps(updatedMaps);

        // Если это текущая выбранная карта, обновляем ее
        if (selectedMap?.id === newHallMapData.id) {
          setSelectedMap(newHallMapData);
        }

        return newHallMapData;
      }

      // Если нет ID - это новая карта, но сначала проверяем, есть ли уже карты
      if (hallMaps.length > 0) {
        // Есть выбор: либо использовать существующую карту, либо создать новую
        const useExisting = window.confirm(
          "Для этой выставки уже есть карта зала.\n\n" +
            "Использовать существующую карту или создать новую?\n\n" +
            "OK - обновить существующую\n" +
            "Отмена - создать новую карту"
        );

        if (useExisting && selectedMap) {
          // Обновляем существующую карту
          console.log("Обновляем существующую карту:", selectedMap.id);
          const updatedMap = await ownerApi.updateHallMap(selectedMap.id, {
            name: newHallMapData.name || selectedMap.name,
          });

          // Если есть изображение, загружаем его
          if (newHallMapData.mapImage) {
            await ownerApi.uploadHallMapImage(
              selectedMap.id,
              newHallMapData.mapImage
            );
          }

          // Перезагружаем данные
          await loadExhibitionData();
          return updatedMap;
        }
      }

      // Создаем новую карту
      console.log("Создаем новую карту");
      const requestData = {
        name:
          newHallMapData.name || `План зала ${new Date().toLocaleDateString()}`,
        exhibitionEventId: Number(exhibitionId),
        mapImage: newHallMapData.mapImage,
      };

      const response = await ownerApi.createHallMapWithImage(requestData);
      console.log("Новая карта создана:", response);

      // Обновляем данные
      await loadExhibitionData();

      return response;
    } catch (err) {
      console.error("Ошибка обработки карты:", err);
      throw new Error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Ошибка загрузки карты"
      );
    }
  };
  // Обработчик для обновления изображения существующей карты
  const handleMapImageUpload = async (hallMapId, imageUrl) => {
    try {
      console.log("Обновление изображения карты:", { hallMapId, imageUrl });

      // Обновляем состояние карты
      setHallMaps((prev) =>
        prev.map((map) =>
          map.id === hallMapId ? { ...map, mapImageUrl: imageUrl } : map
        )
      );

      if (selectedMap?.id === hallMapId) {
        setSelectedMap((prev) => ({ ...prev, mapImageUrl: imageUrl }));
      }
    } catch (error) {
      console.error("Ошибка обновления карты:", error);
      throw error;
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
        status: standData.status || "AVAILABLE",
      };

      console.log("Отправляемые данные:", JSON.stringify(dtoData, null, 2));

      // Отправляем запрос
      const newStand = await ownerApi.createStand(dtoData);
      console.log("Ответ сервера:", newStand);

      if (Object.keys(newStand).length === 0) {
        console.warn("⚠️ Сервер вернул пустой объект, создаем стенд локально");

        // Создаем временный ID для React key
        const tempStand = {
          id: `temp-${Date.now()}`,
          standNumber: standData.standNumber,
          positionX: standData.positionX,
          positionY: standData.positionY,
          width: standData.width,
          height: standData.height,
          type: standData.type,
          status: standData.status || "AVAILABLE",
          exhibitionHallMapId: selectedMap.id,
          isTemp: true, // Флаг для временного стенда
        };

        setStands((prev) => [...filterValidStands(prev), tempStand]);

        // Обновляем данные с сервера
        setTimeout(() => {
          loadStandsForMap(selectedMap.id);
        }, 500);

        return tempStand;
      } else {
        // Сервер вернул нормальный ответ
        const standToAdd = {
          id: newStand.id,
          standNumber: newStand.standNumber || standData.standNumber,
          positionX: newStand.positionX || standData.positionX,
          positionY: newStand.positionY || standData.positionY,
          width: newStand.width || standData.width,
          height: newStand.height || standData.height,
          type: newStand.type || standData.type,
          status: newStand.status || standData.status || "AVAILABLE",
          exhibitionHallMapId: newStand.exhibitionHallMapId || selectedMap.id,
        };

        setStands((prev) => [...filterValidStands(prev), standToAdd]);

        return standToAdd;
      }
    } catch (error) {
      console.error("Полная ошибка создания стенда:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message;
      throw new Error("Ошибка создания стенда: " + errorMessage);
    }
  };

  const filterValidStands = (standsArray) => {
    if (!standsArray || !Array.isArray(standsArray)) return [];

    return standsArray.filter((stand) => {
      if (!stand || typeof stand !== "object") return false;

      // Проверяем, не пустой ли это объект
      const keys = Object.keys(stand);
      if (keys.length === 0) return false;

      // Проверяем, что есть номер стенда
      const hasStandNumber = stand.standNumber !== undefined;

      // Для временных стендов пропускаем другие проверки
      if (stand.isTemp) return true;

      // Проверяем координаты
      const hasCoords =
        stand.positionX !== undefined && stand.positionY !== undefined;

      return hasStandNumber && hasCoords;
    });
  };

  const handleChangeStandStatus = async (standId, status) => {
    try {
      const response = await ownerApi.changeStandStatus(standId, status);
      // Обновляем статус локально
      setStands((prev) =>
        prev.map((stand) =>
          stand.id === standId ? { ...stand, status } : stand
        )
      );
      return response;
    } catch (err) {
      throw new Error(err.response?.data?.error || "Ошибка изменения статуса");
    }
  };

  // ========== ОБРАБОТЧИКИ ДЛЯ ХУДОЖНИКА ==========
  const handleBookStand = async (standId) => {
    try {
      const response = await artistApi.createBooking(standId);

      // Обновляем локально: AVAILABLE → PENDING
      setStands((prev) =>
        prev.map((stand) =>
          stand.id === standId ? { ...stand, status: "PENDING" } : stand
        )
      );

      return response;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Ошибка бронирования");
    }
  };
  const handleApproveBooking = async (standId) => {
    try {
      console.log("Подтверждение бронирования для стенда:", standId);

      // 1. Получаем бронирования
      const response = await ownerApi.getPendingBookings();
      console.log("Ответ от getPendingBookings:", response);

      // 2. Извлекаем массив bookings
      const bookingsArray = response.bookings || response;

      if (!Array.isArray(bookingsArray)) {
        console.error("bookingsArray не является массивом:", bookingsArray);
        alert("Ошибка: получены некорректные данные о бронированиях");
        return;
      }

      console.log("Массив бронирований:", bookingsArray);

      // 3. Ищем бронирование: используем == для сравнения числа и строки
      const booking = bookingsArray.find((b) => {
        const bookingStandId = b.exhibitionStandId;
        console.log(
          `Сравниваем: bookingStandId=${bookingStandId} (тип: ${typeof bookingStandId}), standId=${standId} (тип: ${typeof standId})`
        );
        return bookingStandId == standId; // ← ИСПОЛЬЗУЕМ ==, а не ===
      });

      console.log("Найденное бронирование:", booking);

      if (!booking) {
        alert(
          "Бронирование для этого стенда не найдено.\n\n" +
            "Убедитесь, что:\n" +
            "- Вы владелец этой выставки\n" +
            "- Бронирование ещё не подтверждено или отклонено"
        );
        return;
      }

      // 4. Подтверждаем бронирование
      await ownerApi.approveBooking(booking.id);
      console.log("Бронирование подтверждено, ID:", booking.id);

      // 5. Обновляем стенды
      await refreshStands();
      await loadBookings();

      alert("✅ Бронирование подтверждено!");
    } catch (error) {
      console.error("Ошибка подтверждения:", error);
      alert(`❌ Ошибка: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleRejectBooking = async (standId) => {
    try {
      console.log("Отклонение бронирования для стенда:", standId);

      const reason = prompt("Укажите причину отклонения бронирования:");
      if (!reason || reason.trim() === "") {
        alert("Причина отклонения обязательна");
        return;
      }

      // 1. Получаем бронирования
      const response = await ownerApi.getPendingBookings();
      const bookingsArray = response.bookings || response;

      if (!Array.isArray(bookingsArray)) {
        alert("Ошибка: получены некорректные данные о бронированиях");
        return;
      }

      // 2. Ищем бронирование с ==
      const booking = bookingsArray.find((b) => b.exhibitionStandId == standId);

      if (!booking) {
        alert("Бронирование для этого стенда не найдено");
        return;
      }

      // 3. Отклоняем
      await ownerApi.rejectBooking(booking.id, reason);
      await refreshStands();
      await loadBookings();
      alert("❌ Бронирование отклонено!");
    } catch (error) {
      console.error("Ошибка отклонения:", error);
      alert(`❌ Ошибка: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleMapSelect = async (mapId) => {
    const map = hallMaps.find((m) => m.id === mapId);
    setSelectedMap(map);
    if (map) {
      await loadStandsForMap(map.id);
    }
  };
  const combineStandsWithBookings = (standsData, bookingsData) => {
    // Фильтруем только валидные стенды
    const validStands = filterValidStands(standsData);

    if (!bookingsData || !Array.isArray(bookingsData)) return validStands;

    console.log("Объединяем стенды и бронирования:", {
      "исходные стенды": standsData?.length || 0,
      "валидные стенды": validStands.length,
      бронирований: bookingsData.length,
    });

    return validStands.map((stand) => {
      const booking = bookingsData.find((b) => {
        // Несколько способов поиска соответствия
        return (
          b.exhibitionStandId == stand.id || // ID бронирования
          (b.standNumber && b.standNumber === stand.standNumber)
        ); // по номеру стенда
      });

      if (booking) {
        console.log(`✅ Найден художник для стенда ${stand.standNumber}:`, {
          художник: booking.artistName,
          email: booking.artistEmail,
        });

        return {
          ...stand,
          artistName: booking.artistName,
          artistEmail: booking.artistEmail,
          bookingDate: booking.bookingDate,
          exhibitionTitle: booking.exhibitionTitle,
          hallMapName: booking.hallMapName,
          status: booking.status === "PENDING" ? "PENDING" : stand.status,
        };
      }

      return stand;
    });
  };

  // Создаем объединенные данные стендов
  const combinedStands = combineStandsWithBookings(stands, bookings);

  // Для отладки - выводим в консоль
  useEffect(() => {
    console.log("Объединенные стенды для MapEditor:", combinedStands);
    console.log(
      "Стенды с художниками:",
      combinedStands
        .filter((s) => s.artistName)
        .map((s) => ({
          стенд: s.standNumber,
          художник: s.artistName,
          email: s.artistEmail,
        }))
    );
  }, [combinedStands]);
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
        <button onClick={() => (window.location.href = "/login")}>Войти</button>
      </div>
    );
  }

  return (
    <div className="exhibition-map-page">
      <div className="map-header">
        <div className="exhibition-info">
          <h1>{exhibition?.title || "Выставка"}</h1>
          <div className="details">
            {exhibition?.startDate && exhibition?.endDate && (
              <span className="dates">
                {new Date(exhibition.startDate).toLocaleDateString()} -
                {new Date(exhibition.endDate).toLocaleDateString()}
              </span>
            )}
            {exhibition?.gallery && (
              <span className="gallery">
                Галерея: {exhibition.gallery.name}
              </span>
            )}
          </div>
        </div>

        <div className="header-controls">
          <button
            onClick={handleManualRefresh}
            style={{
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              marginLeft: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            Обновить
          </button>
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
          stands={combinedStands}
          exhibitionId={exhibitionId}
          // Обработчики для владельца
          onUploadHallMap={handleUploadHallMap}
          onCreateStand={handleCreateStand}
          onChangeStandStatus={handleChangeStandStatus}
          // Обработчики для художника
          onBookStand={handleBookStand}
          onMapImageUpload={handleMapImageUpload}
          onDeleteStand={handleDeleteStand}
          onRefreshStands={refreshStands}
          onApproveBooking={handleApproveBooking}
          onRejectBooking={handleRejectBooking}
          // Общие
          onStandSelect={(stand) => {
            console.log("Выбран стенд:", stand);
          }}
        />
      </div>
    </div>
  );
};

export default ExhibitionMapPage;
