import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080'; 

// Создаем экземпляр axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработчик ошибок
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      // Если токен просрочен
      localStorage.removeItem('authToken');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ========== ВЛАДЕЛЕЦ ГАЛЕРЕИ ==========
export const ownerApi = {
  // Карты залов
 
 // === КАРТЫ ЗАЛОВ ===
  // Получить все карты (для владельца)
  getAllHallMaps: () => 
    api.get('/api/maps'),

  // Получить карты по ID события
  getHallMapsByEvent: (eventId) => 
    api.get(`/api/maps/event/${eventId}`),

  // Получить конкретную карту
  getHallMapById: (id) => 
    api.get(`/api/maps/${id}`),

  // Создать карту с изображением (новый метод)
  createHallMapWithImage: (data) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('exhibitionEventId', data.exhibitionEventId);
    if (data.mapImage) {
      formData.append('mapImage', data.mapImage);
    }
    
    return axios.post(`${API_BASE_URL}/api/maps/create-with-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('auth_token')}`
      }
    }).then(res => res.data);
  },

  // Загрузить/обновить изображение карты
  uploadHallMapImage: (mapId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return axios.post(`${API_BASE_URL}/api/maps/${mapId}/upload-map-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('auth_token')}`
      }
    }).then(res => res.data);
  },

  // Обновить карту с изображением
  updateHallMapWithImage: (mapId, data) => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.file) formData.append('file', data.file);
    
    return axios.put(`${API_BASE_URL}/api/maps/${mapId}/with-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('auth_token')}`
      }
    }).then(res => res.data);
  },

  // Удалить карту
  deleteHallMap: (mapId) => 
    api.delete(`/api/maps/${mapId}`),

  // Удалить изображение карты
  deleteHallMapImage: (mapId) => 
    api.delete(`/api/maps/${mapId}/image`),
  // Стенды
  getExhibitionStands: (exhibitionId) =>
    api.get(`/gallery-owner/exhibitions/${exhibitionId}/stands`),

  addExhibitionStand: (exhibitionId, standData) =>
    api.post(`/gallery-owner/exhibitions/${exhibitionId}/stands`, standData),

  changeStandStatus: (standId, status) =>
    api.put(`/gallery-owner/stands/${standId}/status`, { status }),

  getAvailableStands: (exhibitionId) =>
    api.get(`/gallery-owner/exhibitions/${exhibitionId}/available-stands`),

  // Бронирования
  getGalleryBookings: (params = {}) =>
    api.get('/gallery-owner/bookings', { params }),

  confirmBooking: (bookingId, message = '') =>
    api.put(`/gallery-owner/bookings/${bookingId}/confirm`, message ? { message } : {}),

  rejectBooking: (bookingId, reason) =>
    api.put(`/gallery-owner/bookings/${bookingId}/reject`, { reason }),

  // Выставки
  getMyExhibitions: (params = {}) =>
    api.get('/gallery-owner/exhibitions', { params }),

  createExhibition: (exhibitionData) =>
    api.post('/gallery-owner/exhibitions', exhibitionData),
 deleteStand: (standId) => 
    api.delete(`/gallery-owner/stands/${standId}`),

// Создание стенда с координатами
createStandWithCoords: (exhibitionId, standData) => 
  api.post(`/gallery-owner/exhibitions/${exhibitionId}/stand`, standData),

// Обновление стенда
updateStandPosition: (standId, updates) => 
  api.put(`/gallery-owner/stands/${standId}`, updates),

// Удаление стенда
deleteStand: (standId) => 
  api.delete(`/gallery-owner/stands/${standId}`),
};

// ========== ХУДОЖНИК ==========
export const artistApi = {
  // Выставки
  getAvailableExhibitions: () =>
    api.get('/artist/available-exhibitions'),

  getAvailableStands: (exhibitionId) =>
    api.get(`/artist/exhibitions/${exhibitionId}/available-stands`),

  // Бронирования
  createBooking: (standId) =>
    api.post('/artist/bookings', { exhibitionStandId: standId }),

  getMyBookings: (params = {}) =>
    api.get('/artist/bookings', { params }),
};

// ========== ОБЩИЕ API ==========
export const commonApi = {
  // Выставки
  getExhibitionById: (id) =>
    api.get(`/exhibition-events/${id}`),

  getExhibitionsByGallery: (galleryId) =>
    api.get(`/exhibition-events/gallery/${galleryId}`),

  // Карты залов
  getHallMapsByEvent: (eventId) =>
    api.get(`/exhibition-hall-maps/event/${eventId}`),

  getHallMapById: (id) =>
    api.get(`/exhibition-hall-maps/${id}`),

  // Стенды
  getStandsByHallMap: (hallMapId) =>
    api.get(`/exhibition-stands/hall-map/${hallMapId}`),

  getStandById: (id) =>
    api.get(`/exhibition-stands/${id}`),

  // Бронирования
  getBookingById: (id) =>
    api.get(`/bookings/${id}`),

  // Произведения
  getArtworkById: (id) =>
    api.get(`/artworks/${id}`),
};

// ========== АВТОРИЗАЦИЯ ==========
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

export default api;