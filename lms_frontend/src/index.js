import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import './styles/theme.css';
import App from './App';
import useAuthStore from './store/useAuthStore';
import useCartStore from './store/useCartStore';
import LiveRegion from './components/UI/LiveRegion';

function Bootstrap() {
  // Initialize auth and cart behavior on startup
  const { initialize, user } = useAuthStore();
  const { initGuestCart, loadCartForUser, mergeGuestCartToUser } = useCartStore();

  useEffect(() => {
    initialize();
    // initialize guest cart until user detected
    initGuestCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.id) {
      // When user logs in, merge guest cart and then load user's cart
      (async () => {
        await mergeGuestCartToUser(user.id);
        await loadCartForUser(user.id);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <>
      <App />
      <LiveRegion />
      <Toaster position="top-right" />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Bootstrap />
    </BrowserRouter>
  </React.StrictMode>
);
