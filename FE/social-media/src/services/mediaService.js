import api from './api';

export const uploadMedia = async (file) => {
  const formData = new FormData();
  formData.append('files', file);

  try {
    const response = await api.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // be returns { files: [{ filename, url }] }
    return response.data.files[0]; 
  } catch (error) {
    console.error("Media upload failed", error);
    throw error;
  }
};