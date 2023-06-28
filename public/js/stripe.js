/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const bookProduct = async (productId) => {
  const stripe = Stripe(
    'pk_test_51Kame0BSH4fQuSRgSPPDtkXHfXaUGDa8JDCvIRKSj6fuhSC1aCf2NMPVKGLnEp3rz0nFTedw0ggfpmx2JViwTVs8001nH4KD6r'
  );

  try {
    // GET SESSION FROM SERVER (with a route onto client side)
    const session = await axios(
      `http://127.0.0.1:7000/api/bookings/checkout-session/${productId}`
    );
    console.log(session);

    // USE STRIPE OBJECT TO AUTO-CREATE CHECKOUT + CHARGE CARDS
    // await stripe.redirectToCheckout({
    //   sessionId: session.data.session.id,
    // });
    window.location.replace(session.data.session.url);
  } catch (error) {
    console.log(error);
    showAlert('error', error);
  }
};
