import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://localhost:443', // HTTPS-URL сервера
  headers: {
    'Content-Type': 'application/json'
  }
});

export default apiClient;
