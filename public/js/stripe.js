import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51IieIBDo6kRQkwAyGGprtBknfmc4NSRBq8p7GwcpTQsH7fvzMFX0pjP0hWhWfsu1fkkMhrZvgxEXFUeDux96QRGW000olOj1hI'
  );
  // get session from the server
  try {
    const response = await axios.get(
      `/api/v1/bookings/checkout/${tourId}`
    );

    // create checkout form + credit card:
    await stripe.redirectToCheckout({ sessionId: response.data.session.id });
  } catch (err) {
    showAlert('error', err);
  }
};
