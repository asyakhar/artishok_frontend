import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080'; 


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('authToken') || sessionStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
export const imageApi = {
  
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
        'Authorization': `Bearer ${sessionStorage.getItem('authToken') || sessionStorage.getItem('auth_token')}`
      }
    }).then(res => res.data);
  },
  
  
  testMinio: () => 
    api.get('/api/images/test'),
};


export const ownerApi = {

  approveBooking: (bookingId) =>
    api.put(`/gallery-owner/bookings/${bookingId}/confirm`),


  rejectBooking: (bookingId, reason) =>
    api.put(`/gallery-owner/bookings/${bookingId}/reject`, { reason }),
  
  getPendingBookings: () => 
  api.get('/gallery-owner/bookings', { params: { status: 'PENDING' } }),
  
  getAllHallMaps: () => 
    api.get('/exhibition-hall-maps'),

  getHallMapsByEvent: (eventId) => 
    api.get(`/exhibition-hall-maps/event/${eventId}`),

  getHallMapById: (id) => 
    api.get(`/exhibition-hall-maps/${id}`),
    getHallMapWithStands: (id) =>
    api.get(`/exhibition-hall-maps/${id}/with-stands`),

  
  
createHallMapWithImage: (data) => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('exhibitionEventId', data.exhibitionEventId.toString()); 
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
      'Authorization': `Bearer ${sessionStorage.getItem('authToken') || sessionStorage.getItem('auth_token')}`
    }
  }).then(res => res.data);
},

  
  uploadHallMapImage: (mapId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return axios.post(`${API_BASE_URL}/exhibition-hall-maps/${mapId}/upload-map-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${sessionStorage.getItem('authToken') || sessionStorage.getItem('auth_token')}`
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
        'Authorization': `Bearer ${sessionStorage.getItem('authToken') || sessionStorage.getItem('auth_token')}`
      }
    }).then(res => res.data);
  },
  
  updateHallMap: (mapId, data) => 
    api.put(`/exhibition-hall-maps/${mapId}`, data),

  
  deleteHallMap: (mapId) => 
    api.delete(`/exhibition-hall-maps/${mapId}`),

  
  deleteHallMapImage: (mapId) => 
    api.delete(`/exhibition-hall-maps/${mapId}/image`),

  

   getStandsByHallMap: (hallMapId) =>
   api.get(`/exhibition-stands/hall-map/${hallMapId}`),

 createStand: (standData) => {
   
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

  
  getMyExhibitions: (params = {}) =>
    api.get('/gallery-owner/exhibitions', { params }),

  createExhibition: (exhibitionData) =>
    api.post('/gallery-owner/exhibitions', exhibitionData),

  
  getGalleryBookings: (params = {}) =>
    api.get('/gallery-owner/bookings', { params }),

  confirmBooking: (bookingId, message = '') =>
    api.put(`/gallery-owner/bookings/${bookingId}/confirm`, message ? { message } : {}),

  rejectBooking: (bookingId, reason) =>
    api.put(`/gallery-owner/bookings/${bookingId}/reject`, { reason }),
};


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


export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

export default api;