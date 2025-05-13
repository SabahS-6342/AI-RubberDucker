import { useState } from 'react';
import { Box, Container, Heading, Text, Button, VStack, Image, Stack, Input, FormControl, FormLabel, HStack, SimpleGrid, Icon, useColorModeValue, Divider, useToast, Checkbox } from '@chakra-ui/react'
import { Link, useNavigate } from 'react-router-dom'
import { FaGoogle, FaGithub } from 'react-icons/fa'
import { register } from '../services/auth'

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

function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google/login`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to initiate Google login');
      }
      const data = await response.json();
      window.location.href = data.redirectUrl;
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate Google login',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate all fields
      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        toast({
          title: "Error",
          description: "Please fill in all fields",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Validate password match
      if (password !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Validate terms acceptance
      if (!acceptTerms) {
        toast({
          title: "Error",
          description: "Please accept the terms and conditions",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Create username from first and last name
      const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;

      const response = await register(username, email, password, confirmPassword);
      
      toast({
        title: "Success",
        description: "Registration successful! Redirecting to dashboard...",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Navigate to dashboard after successful registration
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Registration failed. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  console.log("Registering with:")
  console.log("First Name:", firstName)
  console.log("Last Name:", lastName)
  console.log("Email:", email)
  console.log("Password:", password)

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
                Join AI RubberDucker Today
              </Heading>
              <Text fontSize="lg" color="gray.600" lineHeight="tall">
                Start your coding journey with personalized learning and real-time assistance. Our AI tutor is here to help you master programming concepts at your own pace.
              </Text>
            </VStack>

            <Box position="relative" w="full">
              <Image
                src="/ducks/cute.png"
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

          {/* Right Side - Registration Form */}
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
                <Heading size="lg" color="gray.700">Create Your Account</Heading>
                <Text color="gray.500">
                  Already have an account? <Link to="/login" style={{ color: 'var(--chakra-colors-orange-400)', fontWeight: 500 }}>Sign in here</Link>
                </Text>
              </VStack>

              <VStack spacing={6}>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} w="full">
                  <FormControl isRequired>
                    <FormLabel color="gray.600">First Name</FormLabel>
                    <Input 
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel color="gray.600">Last Name</FormLabel>
                    <Input 
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl isRequired>
                  <FormLabel color="gray.600">Email</FormLabel>
                  <Input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color="gray.600">Password</FormLabel>
                  <Input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color="gray.600">Confirm Password</FormLabel>
                  <Input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                  />
                </FormControl>

                <FormControl>
                  <Checkbox 
                    isChecked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    colorScheme="orange"
                  >
                    <Text fontSize="sm" color="gray.600">
                      I agree to the <Link style={{ color: 'var(--chakra-colors-orange-400)', fontWeight: 500 }}>Terms of Service</Link> and <Link style={{ color: 'var(--chakra-colors-orange-400)', fontWeight: 500 }}>Privacy Policy</Link>
                    </Text>
                  </Checkbox>
                </FormControl>

                <Button
                  onClick={handleRegister}
                  colorScheme="orange"
                  size="lg"
                  w="full"
                  py={6}
                  isLoading={isLoading}
                  loadingText="Creating account..."
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                  }}
                >
                  Create Account
                </Button>
              </VStack>

              <VStack spacing={6}>
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
  )
}

export default Register