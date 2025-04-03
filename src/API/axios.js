import axios from 'axios';


// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const apiClient = axios.create({
  baseURL: 'https://localhost:443', // HTTPS-URL сервера
  headers: {
    'Content-Type': 'application/json'
  }
});

export default apiClient;
