import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get tokens from URL parameters
        const params = new URLSearchParams(location.search);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const userData = params.get('user');

        if (!accessToken || !refreshToken) {
          throw new Error('No tokens found in URL');
        }

        // Store tokens in localStorage
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        
        // Store user data if available
        if (userData) {
          localStorage.setItem('user', userData);
        }

        // Dispatch auth state change event
        window.dispatchEvent(new Event('authStateChanged'));

        // Show success message
        toast({
          title: 'Login successful',
          description: 'You have been successfully logged in.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Auth callback error:', error);
        toast({
          title: 'Login failed',
          description: error.message || 'An error occurred during login.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate, location, toast]);

  return null; // This component doesn't render anything
};

export default AuthCallback; 