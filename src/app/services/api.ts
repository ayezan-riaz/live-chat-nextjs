import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const userApi = {
  createUser: (userData: { phoneNumber: string; name: string }) =>
    api.post('/users', userData),
  
  getUserByPhone: (phoneNumber: string) =>
    api.get(`/users/${phoneNumber}`),
  
  getAllUsers: () => api.get('/users'),
};

export const chatApi = {
  getUserChats: (phoneNumber: string) =>
    api.get(`/chats/user/${phoneNumber}`),
  
  getChatHistory: (chatId: number, limit: number = 50) =>
    api.get(`/chats/${chatId}/history?limit=${limit}`),
};

export default api;


export const fileApi = {
  uploadFile: (chatId: number | string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/files/upload/${chatId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};