import axios from 'axios';
import { showAlert } from './alerts';

export const updateMe = async (form) => {
  return axios
    .patch('/api/v1/users/update', form)
    .then((result) => {
      if (result.data.success) {
        showAlert('success', 'Data updated successfully');
      }
    })
    .catch((err) => showAlert('error', err.response.data.message));
};

export const updateMyPassword = async (
  currentPassword,
  newPassword,
  newPasswordConfirm
) => {
  return axios
    .patch(`/api/v1/users/password`, {
      currentPassword,
      newPassword,
      newPasswordConfirm,
    })
    .then((result) => {
      if (result.data.success)
        showAlert('success', 'Password updated successfully');
    })
    .catch((err) => showAlert('error', err.response.data.message));
};