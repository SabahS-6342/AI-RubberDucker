import { Box, Container, Heading, Text, Button, VStack, Image, Stack, Input, FormControl, FormLabel, HStack, SimpleGrid, Icon, AspectRatio, Grid, GridItem, Divider, Avatar, useToast } from '@chakra-ui/react'
import { Link, useNavigate } from 'react-router-dom'
import { FaRobot, FaGraduationCap, FaChartLine, FaCode, FaGoogle, FaGithub, FaQuoteLeft } from 'react-icons/fa'
import GoogleAuthButton from '../components/GoogleAuthButton'

function FeatureCard({ icon, title, description }) {
  return (
    <Box 
      bg="white" 
      p={8} 
      borderRadius="lg" 
      boxShadow="0 2px 4px rgba(0, 0, 0, 0.08)" 
      transition="all 0.3s ease-in-out" 
      _hover={{ 
        transform: 'translateY(-4px)', 
        boxShadow: 'lg',
        '& svg': { transform: 'scale(1.1)' } 
      }}
    >
      <Icon 
        as={icon} 
        w={10} 
        h={10} 
        color="orange.400" 
        mb={4} 
        transition="transform 0.3s ease-in-out"
      />
      <Heading size="md" mb={3} color="gray.700">{title}</Heading>
      <Text color="gray.500" fontSize="sm" lineHeight="tall">{description}</Text>
    </Box>
  )
}

function VideoCard({ title, description, videoId }) {
  return (
    <Box 
      bg="white" 
      borderRadius="lg" 
      overflow="hidden"
      boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
      transition="all 0.3s ease-in-out"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
      sx={{
        '@media (forced-colors: active)': {
          '--chakra-colors-white': 'Canvas',
          '--chakra-colors-gray-700': 'CanvasText',
          '--chakra-colors-gray-500': 'CanvasText',
          borderColor: 'CanvasText',
          borderWidth: '1px'
        }
      }}
    >
      <AspectRatio ratio={16 / 9}>
        <Box
          as="iframe"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=0&origin=${window.location.origin}`}
          title={title}
          allowFullScreen
          loading="lazy"
          aria-label={`${title} video`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sx={{
            border: 'none',
            '@media (forced-colors: active)': {
              border: '1px solid CanvasText'
            }
          }}
        />
      </AspectRatio>
      <Box p={6}>
        <Heading size="md" mb={2} color="gray.700">{title}</Heading>
        <Text color="gray.500" fontSize="sm" lineHeight="tall">{description}</Text>
      </Box>
    </Box>
  )
}

function TestimonialCard({ name, role, company, image, quote }) {
  return (
    <Box 
      bg="white" 
      p={8} 
      borderRadius="lg" 
      boxShadow="0 2px 4px rgba(0, 0, 0, 0.08)"
      transition="all 0.3s ease-in-out"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top={-4}
        left={-4}
        w={16}
        h={16}
        bg="orange.50"
        transform="rotate(-45deg)"
      />
      <Icon 
        as={FaQuoteLeft} 
        w={8} 
        h={8} 
        color="orange.400" 
        position="absolute"
        top={4}
        left={4}
        opacity={0.8}
      />
      <VStack spacing={6} align="start">
        <Text color="gray.700" fontSize="md" fontStyle="italic" pt={6} lineHeight="tall">
          "{quote}"
        </Text>
        <HStack spacing={4}>
          <Avatar 
            size="md" 
            src={image} 
            name={name}
            border="2px solid"
            borderColor="orange.400"
          />
          <Box>
            <Text fontWeight="bold" color="gray.700">{name}</Text>
            <Text fontSize="sm" color="gray.500">{role} at {company}</Text>
          </Box>
        </HStack>
      </VStack>
    </Box>
  )
}

function SocialButton({ icon, label, onClick, ...props }) {
  return (
    <Button
      variant="outline"
      size="lg"
      borderColor="gray.300"
      _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
      leftIcon={<Icon as={icon} />}
      iconSpacing={3}
      onClick={onClick}
      {...props}
    >
      {label}
    </Button>
  )
}

function Home() {
  const navigate = useNavigate();
  const toast = useToast();

  const handleGoogleLogin = async () => {
    try {
      // Initialize Google OAuth
      const google = window.google;
      if (!google) {
        throw new Error('Google API not loaded');
      }

      const client = google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: 'email profile',
        callback: async (response) => {
          if (response.error) {
            throw new Error(response.error);
          }
          
          try {
            await googleLogin(response.access_token);
            toast({
              title: 'Login successful',
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
            navigate('/dashboard');
          } catch (error) {
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
    <Box minH="calc(100vh - 60px)" position="relative" overflow="hidden">
      {/* Welcome Banner */}
      <Box 
        w="100%" 
        bg="orange.50" 
        py={3}
        textAlign="center"
        borderBottom="1px"
        borderColor="orange.100"
      >
        <Text
          fontSize="4xl"
          fontWeight="extrabold"
          color="orange.400"
          letterSpacing="tight"
          textShadow="0 2px 4px rgba(0,0,0,0.1)"
        >
          Welcome to AI RubberDucker - Your Coding Companion! 
        </Text>
      </Box>
      
      {/* Hero Section */}
      <Box bg="orange.300" py={20} position="relative">
        <Container maxW="container.lg" position="relative" px={{ base: 4, md: 8 }}>
          <Stack direction={{ base: 'column', lg: 'row' }} spacing={{ base: 8, lg: 16 }} alignItems="center">
            <Box flex={1} color="white" maxW={{ base: "100%", lg: "45%" }}>
              <Heading 
                size="2xl" 
                mb={6}
                lineHeight="shorter"
                fontWeight="bold"
              >
                Master Programming with Your AI Coding Companion
              </Heading>
              <Text fontSize="lg" mb={8} lineHeight="tall">
                Experience personalized learning, real-time code assistance, and expert guidance. Start your coding journey today with AI RubberDucker.
              </Text>
              <Box 
                display="flex" 
                justifyContent="center" 
                bg="whiteAlpha.200" 
                p={6} 
                borderRadius="xl"
                boxShadow="sm"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                transition="all 0.3s ease-in-out"
              >
                <VStack spacing={3}>
                  <Icon as={FaCode} w={16} h={16} color="white" />
                  <Text color="white" fontSize="lg" fontWeight="medium">
                    Smart Code Analysis & Learning
                  </Text>
                </VStack>
              </Box>
            </Box>
            
            <Box flex={1} position="relative">
              <Box
                bg="white"
                p={8}
                borderRadius="xl"
                boxShadow="xl"
                maxW="450px"
                mx="auto"
              >
                <VStack spacing={6} align="stretch">
                  <VStack spacing={2} align="start">
                    <Heading size="md" color="gray.700">Sign In to Get Started</Heading>
                    <Text color="gray.500" fontSize="sm">
                      Don't have an account? <Link to="/register" style={{ color: 'var(--chakra-colors-orange-400)', fontWeight: 500 }}>Sign up here</Link>
                    </Text>
                  </VStack>
                  <FormControl>
                    <FormLabel color="gray.600">Email</FormLabel>
                    <Input 
                      type="email" 
                      placeholder="Enter your email"
                      size="lg"
                      borderColor="gray.300"
                      _hover={{ borderColor: 'gray.400' }}
                      _focus={{ borderColor: 'orange.400', boxShadow: '0 0 0 1px var(--chakra-colors-orange-400)' }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="gray.600">Password</FormLabel>
                    <Input 
                      type="password" 
                      placeholder="Enter your password"
                      size="lg"
                      borderColor="gray.300"
                      _hover={{ borderColor: 'gray.400' }}
                      _focus={{ borderColor: 'orange.400', boxShadow: '0 0 0 1px var(--chakra-colors-orange-400)' }}
                    />
                  </FormControl>
                  <Button colorScheme="orange" size="lg">
                    Sign In
                  </Button>
                  <Box>
                    <Text textAlign="center" color="gray.500" fontSize="sm" mb={4}>
                      Or continue with
                    </Text>
                    <SimpleGrid columns={2} spacing={3}>
                      <GoogleAuthButton label="Google" />
                      <SocialButton 
                        icon={FaGithub}
                        label="GitHub"
                        onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/auth/github`}
                        color="gray.600"
                      />
                    </SimpleGrid>
                  </Box>
                </VStack>
              </Box>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box bg="white" py={24}>
        <Container maxW="container.lg" px={{ base: 4, md: 8 }}>
          <VStack spacing={16}>
            <VStack spacing={4} textAlign="center" maxW="container.md" mx="auto">
              <Heading size="2xl" color="gray.700" fontWeight="bold">
                Why Choose AI RubberDucker?
              </Heading>
              <Text color="gray.500" fontSize="lg" maxW="600px">
                Experience the future of programming education with our intelligent learning platform
              </Text>
            </VStack>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8} w="100%">
              <FeatureCard 
                icon={FaRobot}
                title="AI-Powered Learning"
                description="Get personalized assistance and instant feedback from our advanced AI tutor that adapts to your learning style"
              />
              <FeatureCard 
                icon={FaGraduationCap}
                title="Structured Learning"
                description="Follow a carefully designed curriculum that progressively builds your skills from beginner to advanced"
              />
              <FeatureCard 
                icon={FaChartLine}
                title="Track Progress"
                description="Monitor your learning journey with detailed analytics and insights to stay motivated and focused"
              />
              <FeatureCard 
                icon={FaCode}
                title="Real-world Projects"
                description="Apply your skills to practical projects and build a professional portfolio to showcase your abilities"
              />
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box bg="orange.50" py={24} position="relative">
        <Container maxW="container.lg" px={{ base: 4, md: 8 }} position="relative">
          <VStack spacing={16}>
            <VStack spacing={4} textAlign="center" maxW="container.md" mx="auto">
              <Heading size="2xl" color="gray.700" fontWeight="bold">
                What Our Users Say
              </Heading>
              <Text color="gray.500" fontSize="lg" maxW="600px">
                Join thousands of developers who have transformed their coding journey with AI RubberDucker
              </Text>
            </VStack>
            
            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8} w="100%">
              <TestimonialCard 
                name="Sarah Chen"
                role="Software Engineer"
                company="TechCorp"
                image="https://images.unsplash.com/photo-1494790108377-be9c29b29330"
                quote="AI RubberDucker helped me transition from a beginner to a confident developer. The personalized feedback and structured learning path made all the difference."
              />
              <TestimonialCard 
                name="Michael Rodriguez"
                role="Full Stack Developer"
                company="StartupHub"
                image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
                quote="The real-time code assistance is like having a senior developer by your side 24/7. It's helped me write better code and learn best practices."
              />
              <TestimonialCard 
                name="Emily Johnson"
                role="Computer Science Student"
                company="Tech University"
                image="https://images.unsplash.com/photo-1438761681033-6461ffad8d80"
                quote="As a student, having AI RubberDucker to explain complex concepts and guide me through projects has been invaluable. It's like having a personal tutor!"
              />
            </SimpleGrid>
          </VStack>
        </Container>
        
        {/* Background Pattern */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          opacity={0.1}
          backgroundImage="url('data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ED8936' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E')"
        />
      </Box>

      {/* Demo Videos Section */}
      <Box bg="white" py={24}>
        <Container maxW="container.lg" px={{ base: 4, md: 8 }}>
          <VStack spacing={16}>
            <VStack spacing={4} textAlign="center" maxW="container.md" mx="auto">
              <Heading size="2xl" color="gray.700" fontWeight="bold">
                See It In Action
              </Heading>
              <Text color="gray.500" fontSize="lg" maxW="600px">
                Watch how AI RubberDucker helps you master programming concepts through interactive learning
              </Text>
            </VStack>
            
            <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={8} w="100%">
              <VideoCard 
                title="Getting Started with AI RubberDucker"
                description="Learn how to use our AI-powered platform to enhance your coding skills and accelerate your learning journey"
                videoId="s4DA9w_7-fk"
              />
              <VideoCard 
                title="Real-time Code Assistance"
                description="See how our AI provides instant feedback and suggestions while you code, helping you write better code faster"
                videoId="jxKtFILNlnw"
              />
            </Grid>
          </VStack>
        </Container>
      </Box>

      {/* Call to Action Section */}
      <Box bg="gray.50" py={24} position="relative">
        <Container maxW="container.lg" px={{ base: 4, md: 8 }}>
          <Box 
            bg="white" 
            p={12} 
            borderRadius="xl" 
            boxShadow="0 4px 6px rgba(0, 0, 0, 0.05)"
            maxW="800px"
            mx="auto"
            w="100%"
            textAlign="left"
            transition="all 0.3s ease-in-out"
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            position="relative"
          >
            <HStack spacing={8} justify="flex-start" mb={8}>
              <Image
                src="/ducks/3.png"
                alt="AI RubberDucker Mascot"
                h="120px"
                objectFit="contain"
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
                transition="transform 0.3s ease-in-out"
                _hover={{ transform: 'scale(1.05)' }}
              />
              <VStack spacing={4} align="start">
                <Heading size="xl" color="gray.700">Ready to Start Your Journey?</Heading>
                <Text color="gray.500" fontSize="lg" maxW="400px">
                  Join thousands of developers who are already improving their coding skills with AI RubberDucker
                </Text>
              </VStack>
            </HStack>
            <HStack spacing={6} justify="flex-start">
              <Button
                colorScheme="orange"
                size="lg"
                px={12}
                py={7}
                fontSize="md"
                as={Link}
                to="/register"
                transition="all 0.3s ease-in-out"
                _hover={{ 
                  transform: 'translateY(-2px)', 
                  boxShadow: 'lg',
                }}
              >
                Get Started Free
              </Button>
              <Button
                variant="outline"
                colorScheme="orange"
                size="lg"
                px={12}
                py={7}
                fontSize="md"
                as={Link}
                to="/pricing"
                transition="all 0.3s ease-in-out"
                _hover={{ 
                  transform: 'translateY(-2px)', 
                  boxShadow: 'lg',
                }}
              >
                View Pricing
              </Button>
            </HStack>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default Home