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
 
      // Загрузка карты зала (изображение)
  uploadHallMapImage: (exhibitionId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return axios.post(`${API_BASE_URL}/api/exhibitions/${exhibitionId}/upload-map`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('auth_token')}`
      }
    });
  },
  
  // Создание записи о карте зала (URL изображения)
  uploadHallMap: (exhibitionId, data) =>
    api.post(`/gallery-owner/exhibitions/${exhibitionId}/hall-map`, data),
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