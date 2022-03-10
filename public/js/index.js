import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateMe, updateMyPassword } from './updateUser';
import { bookTour } from './stripe';
import { showAlert } from './alerts';

// DOM elements=============================================================
const mapBox = document.getElementById('map');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logout');
const updateUserForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-password');
const bookTourBtn = document.getElementById('book-tour');

// Other values=============================================================

// display map===============================================================

if (mapBox) {
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations
  );
  displayMap(locations);
}

// Handle login form===========================================================
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
}

// Handle update user info form=================================
if (updateUserForm)
  updateUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelector('.btn--save-settings').textContent = 'Submitting...';
    const form = new FormData();
    form.append('name', document.querySelector('#name').value);
    form.append('email', document.querySelector('#email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    await updateMe(form);

    document.querySelector('.btn--save-settings').textContent = 'Save Settings';
  });

if (updatePasswordForm)
  updatePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.querySelector('#password-current').value;
    const newPassword = document.querySelector('#password').value;
    const newPasswordConfirm = document.querySelector('#password-confirm')
      .value;

    document.querySelector('.btn--save-password').textContent = 'Submitting...';
    await updateMyPassword(currentPassword, newPassword, newPasswordConfirm);
    document.querySelector('#password-current').value = '';
    document.querySelector('#password').value = '';
    document.querySelector('#password-confirm').value = '';

    document.querySelector('.btn--save-password').textContent = 'Save password';
  });

if (bookTourBtn)
  bookTourBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    e.target.textContent = 'Processing...';

    const { tourId } = e.target.dataset;
    await bookTour(tourId);

    e.target.textContent = 'Book tour now!';
  });

const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) showAlert('success', alertMessage, 11);
