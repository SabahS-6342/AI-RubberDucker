import { useState } from 'react';
import { Box, Container, Heading, Text, Button, VStack, Image, Stack, Input, FormControl, FormLabel, HStack, SimpleGrid, Icon, useColorModeValue, Divider, useToast } from '@chakra-ui/react'
import { Link, useNavigate } from 'react-router-dom'
import { FaGoogle, FaGithub } from 'react-icons/fa'

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

  const handleGoogleLogin = () => {
    try {
      window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/login`;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initiate Google login',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleLogin = async () => {
    console.log("Login button clicked");
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
      console.log("Attempting login with:", {
        url: `${import.meta.env.VITE_API_URL}/api/auth/login`,
        email,
        password,
      });
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful, token received:', data.access_token ? 'Present' : 'Not present');
        localStorage.setItem('token', data.access_token);
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
        throw new Error(data.message || 'Login failed');
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
    <Box minH="calc(100vh - 60px)" position="relative" overflow="hidden">
      {/* Background with Pattern and Gradient */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bgGradient="linear(to-br, orange.300, orange.200)"
        opacity={0.1}
        backgroundImage="url('data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ED8936' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E')"
      />
      <Container maxW="container.lg" py={20} position="relative">
        <Stack
          direction={{ base: 'column', lg: 'row' }}
          spacing={{ base: 8, lg: 16 }}
          align="center"
          justify="center"
        >
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
                      Sign In !
                    </Button>

                <HStack>
                  <Divider />
                  <Text fontSize="sm" color="gray.500" whiteSpace="nowrap" px={3}>
                    or continue with
                  </Text>
                  <Divider />
                  </HStack>

                <SimpleGrid columns={2} spacing={4} w="full">
                  <SocialButton
                    icon={FaGoogle}
                    label="Google"
                    onClick={handleGoogleLogin}
                    color="gray.600"
                  />
                  <SocialButton
                    icon={FaGithub}
                    label="GitHub"
                    onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/auth/github`}
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