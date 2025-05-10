import { Button, Icon } from '@chakra-ui/react';
import { FaGoogle } from 'react-icons/fa';
import { googleLogin } from '../services/auth';
import { useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const GoogleAuthButton = ({ label = "Continue with Google", onSuccess, redirectPath = "/dashboard" }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  useEffect(() => {
    // Check if client ID is set
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'your_google_client_id_here') {
      console.error('Google Client ID is not set in environment variables');
      toast({
        title: 'Configuration Error',
        description: 'Google Client ID is not configured. Please contact support.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Load Google API script
    const loadGoogleScript = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google API script loaded');
        setIsGoogleLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Google API script');
        toast({
          title: 'Error',
          description: 'Failed to load Google API. Please refresh the page.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      };
      document.body.appendChild(script);
    };

    if (!window.google) {
      loadGoogleScript();
    } else {
      setIsGoogleLoaded(true);
    }

    return () => {
      // Cleanup if needed
    };
  }, [toast]);

  const handleGoogleLogin = async () => {
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId || clientId === 'your_google_client_id_here') {
        toast({
          title: 'Configuration Error',
          description: 'Google Client ID is not configured. Please contact support.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (!isGoogleLoaded) {
        toast({
          title: 'Error',
          description: 'Google API is still loading. Please wait.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const google = window.google;
      if (!google) {
        throw new Error('Google API not loaded');
      }

      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile',
        callback: async (response) => {
          if (response.error) {
            console.error('Google OAuth error:', response.error);
            toast({
              title: 'Google Authentication Error',
              description: response.error,
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
            return;
          }
          
          try {
            const result = await googleLogin(response.access_token);
            toast({
              title: 'Login successful',
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
            
            if (onSuccess) {
              onSuccess(result);
            } else {
              navigate(redirectPath);
            }
          } catch (error) {
            console.error('Backend error:', error);
            toast({
              title: 'Login failed',
              description: error.message,
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
        },
      });

      client.requestAccessToken();
    } catch (error) {
      console.error('Google OAuth error:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="lg"
      borderColor="gray.300"
      _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
      leftIcon={<Icon as={FaGoogle} />}
      iconSpacing={3}
      onClick={handleGoogleLogin}
      w="100%"
      isLoading={!isGoogleLoaded}
      loadingText="Loading Google..."
    >
      {label}
    </Button>
  );
};

export default GoogleAuthButton; 