/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// TYPE IS 'password' OR 'data
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/users/updateMyPassword'
        : '/api/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully`);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
