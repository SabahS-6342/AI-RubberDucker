import { useState } from 'react';
import { Box, Container, Heading, Text, Button, VStack, Image, Stack, Input, FormControl, FormLabel, HStack, SimpleGrid, Icon, useColorModeValue, Divider, useToast } from '@chakra-ui/react'
import { Link, useNavigate } from 'react-router-dom'
import { FaGithub } from 'react-icons/fa'
import GoogleAuthButton from '../components/GoogleAuthButton'
import config from '../config';

function SocialButton({ icon, label, ...props }) {
  return (
    <Button
      variant="outline"
      size="lg"
      borderColor="gray.300"
      _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
      leftIcon={<Icon as={icon} />}
      iconSpacing={3}
      {...props}
    >
      {label}
    </Button>
  )
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful, token received:', data.token ? 'Present' : 'Not present');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Dispatch custom event for auth state change
        console.log('Dispatching authStateChanged event');
        window.dispatchEvent(new Event('authStateChanged'));
        toast({
          title: 'Success',
          description: 'Successfully logged in!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/dashboard');
      } else {
        throw new Error(data.detail || 'Login failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" py={12}>
      <Container maxW="container.xl">
        <Stack direction={{ base: 'column', lg: 'row' }} spacing={12} align="center">
          {/* Left Side - Welcome Message */}
          <VStack
            spacing={8}
            align="flex-start"
            maxW="480px"
            display={{ base: 'none', lg: 'flex' }}
          >
            <VStack align="flex-start" spacing={3}>
              <Heading size="2xl" color="gray.700" lineHeight="shorter">
                Welcome Back to AI RubberDucker
              </Heading>
              <Text fontSize="lg" color="gray.600" lineHeight="tall">
                Ready to continue your coding journey? Sign in to access your personalized learning experience, track your progress, and get help from your AI coding companion.
              </Text>
            </VStack>

            <Box position="relative" w="full">
              <Image
                src="/ducks/6.png"
                alt="AI RubberDucker Mascot"
                h="300px"
                objectFit="contain"
                mx="auto"
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
                transition="transform 0.3s ease-in-out"
                _hover={{ transform: 'scale(1.05)' }}
              />
            </Box>
          </VStack>

          {/* Right Side - Login Form */}
          <Box
            bg="white"
            p={12}
            borderRadius="xl"
            boxShadow="xl"
            maxW="480px"
            w="full"
            position="relative"
            overflow="hidden"
          >
            {/* Decorative Corner */}
            <Box
              position="absolute"
              top={-10}
              right={-10}
              w={20}
              h={20}
              bg="orange.50"
              transform="rotate(45deg)"
            />

            <VStack spacing={8} align="stretch" position="relative">
              <VStack spacing={2} align="start">
                <Heading size="lg" color="gray.700">Sign In to Your Account</Heading>
                <Text color="gray.500">
                  New to AI RubberDucker? <Link to="/register" style={{ color: 'var(--chakra-colors-orange-400)', fontWeight: 500 }}>Create an account</Link>
                </Text>
              </VStack>

              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel color="gray.600">Email</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    size="lg"
                    borderColor="gray.300"
                    _hover={{ borderColor: 'gray.400' }}
                    _focus={{ borderColor: 'orange.400', boxShadow: '0 0 0 1px var(--chakra-colors-orange-400)' }}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color="gray.600">Password</FormLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    size="lg"
                    borderColor="gray.300"
                    _hover={{ borderColor: 'gray.400' }}
                    _focus={{ borderColor: 'orange.400', boxShadow: '0 0 0 1px var(--chakra-colors-orange-400)' }}
                  />
                </FormControl>

                <Box alignSelf="flex-start">
                  <Link to="/forgot-password">
                    <Text color="gray.500" fontSize="sm" _hover={{ color: 'orange.400' }}>
                      Forgot password?
                    </Text>
                  </Link>
                </Box>

                <Button
                  onClick={handleLogin}
                  colorScheme="orange"
                  size="lg"
                  w="full"
                  isLoading={isLoading}
                  loadingText="Signing in..."
                  bg="#F47B3F"
                  _hover={{ bg: '#E16C30' }}
                >
                  Sign In
                </Button>

                <HStack>
                  <Divider />
                  <Text fontSize="sm" color="gray.500" whiteSpace="nowrap" px={3}>
                    or continue with
                  </Text>
                  <Divider />
                </HStack>

                <SimpleGrid columns={2} spacing={4} w="full">
                  <GoogleAuthButton 
                    label="Google"
                    redirectPath="/dashboard"
                    onSuccess={(result) => {
                      toast({
                        title: 'Login successful',
                        status: 'success',
                        duration: 3000,
                        isClosable: true,
                      });
                      navigate('/dashboard');
                    }}
                  />
                  <SocialButton
                    icon={FaGithub}
                    label="GitHub"
                    onClick={() => window.location.href = `${config.API_BASE_URL}/api/auth/github/login`}
                  />
                </SimpleGrid>
              </VStack>
            </VStack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

export default Login; 