import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './Login';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

export default function LoginWithProvider() {
  if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
    console.warn('Please set VITE_GOOGLE_CLIENT_ID in your .env file for Google OAuth to work');
  }
  
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Login />
    </GoogleOAuthProvider>
  );
}
