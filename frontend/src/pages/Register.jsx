import { useState } from 'react';
import { Box, Container, Heading, Text, Button, VStack, Image, Stack, Input, FormControl, FormLabel, HStack, SimpleGrid, Icon, useColorModeValue, Divider, useToast, Checkbox } from '@chakra-ui/react'
import { Link, useNavigate } from 'react-router-dom'
import { FaGithub } from 'react-icons/fa'
import GoogleAuthButton from '../components/GoogleAuthButton'

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
  const [isLoading, setIsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!email || !password || !firstName || !lastName) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (!termsAccepted) {
      toast({
        title: 'Terms and Conditions',
        description: 'Please accept the terms and conditions to continue',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password
        })
      });

      const data = await res.json();

      if (res.ok) {
        console.log('Register - Setting token:', data.access_token ? 'Present' : 'Not present');
        // Store the token and user data
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Force a storage event to update other components
        window.dispatchEvent(new Event('storage'));
        
        toast({
          title: 'Registration successful',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Ensure navigation happens after state updates
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      } else {
        toast({
          title: 'Registration failed',
          description: data.message || 'Something went wrong',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Registration failed:', err);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        status: 'error',
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
                    isChecked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
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
                  <GoogleAuthButton 
                    label="Google"
                    redirectPath="/dashboard"
                    onSuccess={(result) => {
                      toast({
                        title: 'Registration successful',
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