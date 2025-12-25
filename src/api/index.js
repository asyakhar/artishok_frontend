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
      localStorage.removeItem('authToken');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
export const imageApi = {
  // Загрузка изображения через ImageController
  uploadImage: (file, category, entityId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (entityId) {
      formData.append('entityId', entityId.toString());
    }
    
    return axios.post(`${API_BASE_URL}/api/images/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('auth_token')}`
      }
    }).then(res => res.data);
  },
  
  // Тестовый метод
  testMinio: () => 
    api.get('/api/images/test'),
};

// ========== ВЛАДЕЛЕЦ ГАЛЕРЕИ ==========
export const ownerApi = {
  approveBooking: async (bookingId) => {
    const response = await axios.post(`/gallery-owner/bookings/${bookingId}/confirm`);
    return response.data;
  },
  
  rejectBooking: async (bookingId) => {
    const response = await axios.post(`/bookings/${bookingId}/reject`);
    return response.data;
  },
  
  getPendingBookings: async () => {
    const response = await axios.get('/api/bookings/pending');
    return response.data;
  },
  // === КАРТЫ ЗАЛОВ ===
  getAllHallMaps: () => 
    api.get('/exhibition-hall-maps'),

  getHallMapsByEvent: (eventId) => 
    api.get(`/exhibition-hall-maps/event/${eventId}`),

  getHallMapById: (id) => 
    api.get(`/exhibition-hall-maps/${id}`),
    getHallMapWithStands: (id) =>
    api.get(`/exhibition-hall-maps/${id}/with-stands`),

  // Создать карту с изображением
  // api.js - метод createHallMapWithImage
createHallMapWithImage: (data) => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('exhibitionEventId', data.exhibitionEventId.toString()); // ← Преобразуйте в строку!
  if (data.mapImage) {
    formData.append('mapImage', data.mapImage);
  }
  
  console.log('Отправка FormData:', {
    name: data.name,
    exhibitionEventId: data.exhibitionEventId,
    hasImage: !!data.mapImage
  });
  
  return axios.post(`${API_BASE_URL}/exhibition-hall-maps/create-with-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('auth_token')}`
    }
  }).then(res => res.data);
},

  // Загрузить изображение для существующей карты
  uploadHallMapImage: (mapId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return axios.post(`${API_BASE_URL}/exhibition-hall-maps/${mapId}/upload-map-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('auth_token')}`
      }
    }).then(res => res.data);
  },
  uploadMapImageDirect: (file, hallMapId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'map');
    formData.append('entityId', hallMapId.toString());
    
    return axios.post(`${API_BASE_URL}/api/images/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('auth_token')}`
      }
    }).then(res => res.data);
  },
  // Обновить карту
  updateHallMap: (mapId, data) => 
    api.put(`/exhibition-hall-maps/${mapId}`, data),

  // Удалить карту
  deleteHallMap: (mapId) => 
    api.delete(`/exhibition-hall-maps/${mapId}`),

  // Удалить изображение карты
  deleteHallMapImage: (mapId) => 
    api.delete(`/exhibition-hall-maps/${mapId}/image`),

  // === СТЕНДЫ ===

   getStandsByHallMap: (hallMapId) =>
   api.get(`/exhibition-stands/hall-map/${hallMapId}`),

 createStand: (standData) => {
   // Форматируем данные для нового DTO
   const dtoData = {
     exhibitionHallMapId: standData.exhibitionHallMapId,
     standNumber: standData.standNumber,
     positionX: standData.positionX,
     positionY: standData.positionY,
     width: standData.width,
     height: standData.height,
     type: standData.type, 
     status: standData.status || 'AVAILABLE'
   };
   
   return api.post('/exhibition-stands', dtoData);
 },

 updateStand: (standId, standData) => {
   const dtoData = {
     exhibitionHallMapId: standData.exhibitionHallMapId,
     standNumber: standData.standNumber,
     positionX: standData.positionX,
     positionY: standData.positionY,
     width: standData.width,
     height: standData.height,
     type: standData.type,
     status: standData.status || 'AVAILABLE'
   };
   
   return api.put(`/exhibition-stands/${standId}`, dtoData);
 },

 deleteStand: (standId) =>
   api.delete(`/exhibition-stands/${standId}`),
   

 changeStandStatus: (standId, status) =>
   api.put(`/exhibition-stands/${standId}/status?status=${status}`),

  // === ВЫСТАВКИ ===
  getMyExhibitions: (params = {}) =>
    api.get('/gallery-owner/exhibitions', { params }),

  createExhibition: (exhibitionData) =>
    api.post('/gallery-owner/exhibitions', exhibitionData),

  // === БРОНИРОВАНИЯ ===
  getGalleryBookings: (params = {}) =>
    api.get('/gallery-owner/bookings', { params }),

  confirmBooking: (bookingId, message = '') =>
    api.put(`/gallery-owner/bookings/${bookingId}/confirm`, message ? { message } : {}),

  rejectBooking: (bookingId, reason) =>
    api.put(`/gallery-owner/bookings/${bookingId}/reject`, { reason }),
};

// ========== ХУДОЖНИК ==========
export const artistApi = {
  getAvailableExhibitions: () =>
    api.get('/artist/available-exhibitions'),

  getAvailableStands: (exhibitionId) =>
    api.get(`/artist/exhibitions/${exhibitionId}/available-stands`),

  createBooking: (standId) =>
    api.post('/artist/bookings', { exhibitionStandId: standId }),

  getMyBookings: () =>
    api.get('/gallery-owner/bookings', { params:'PENDING' }),
};

// ========== ОБЩИЕ API ==========
export const commonApi = {
  getExhibitionById: (id) =>
    api.get(`/exhibition-events/${id}`),

  getHallMapsByEvent: (eventId) =>
    api.get(`/exhibition-hall-maps/event/${eventId}`),

  getHallMapById: (id) =>
    api.get(`/exhibition-hall-maps/${id}`),

  getStandById: (id) =>
    api.get(`/exhibition-stands/${id}`),

  getBookingById: (id) =>
    api.get(`/bookings/${id}`),
};

// ========== АВТОРИЗАЦИЯ ==========
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

export default api;