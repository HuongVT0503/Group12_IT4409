//axios instance (baseURL, headers)
import axios from 'axios';
// const api = axios.create({ baseURL: 'http://localhost:8080' });
// export default api;

const api=axios.create({
    baseURL:"/api/v1",
    headers:{
        "Content-Type":"application/json"
    },

});

//req interceptor used to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

//resp interceptors to handle 401
api.interceptors.response.use(
  (response) => response, //return data directly
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      //clear token n redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');//
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);


export default api