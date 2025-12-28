//login logout register func

//helper to handle response parsing n errors

import api from "./api";


export const loginUser = async (credentials) => {
 
  const payload = {
    email: credentials.identifier,
    password: credentials.password
  };
  const response = await api.post('/auth/login', payload);

  //be returns {user, accessToken, refreshToken, }
  // if (response.data.accessToken) {
  //   localStorage.setItem('token', response.data.accessToken);
  //   if (response.data.refreshToken) {
  //       localStorage.setItem('refreshToken', response.data.refreshToken);
  //   }
  //   localStorage.setItem('user', JSON.stringify(response.data.user));
  // }
  return response.data;
};

export const registerUser = async (payload) => {
  //be expects {username, email, password, display_name}

  const body = {
    username: payload.form.email.split('@')[0]+ Math.floor(Math.random() * 1000), // user gen
    email: payload.form.email,
    password: payload.form.password,
    display_name: `${payload.form.firstName} ${payload.form.lastName}`.trim(),
    date_of_birth: payload.form.dob, 
    gender: payload.form.gender,
    phone: payload.form.phone
  };

  const response = await api.post('/auth/register', body);
  return response.data;
  
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = '/login';
};

export const changePassword = async (oldPassword, newPassword) => {
  const response = await api.post('/auth/change-password', {
    oldPassword,
    newPassword
  });
  return response.data;
};