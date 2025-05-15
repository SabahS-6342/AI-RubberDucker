import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Button,
  useColorModeValue,
  Icon,
  List,
  ListItem,
  ListIcon,
  Badge,
  useToast
} from '@chakra-ui/react'
import { FaCheck, FaRocket, FaCrown, FaStar } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

const PricingCard = ({ title, price, features, isPopular = false, colorScheme = 'orange' }) => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const popularBg = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.900`)
  
  return (
    <Box
      position="relative"
      bg={bgColor}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={isPopular ? `${colorScheme}.300` : borderColor}
      p={8}
      shadow={isPopular ? 'xl' : 'md'}
      _hover={{
        transform: 'translateY(-5px)',
        shadow: 'xl',
        transition: 'all 0.2s'
      }}
      transition="all 0.2s"
    >
      {isPopular && (
        <Badge
          position="absolute"
          top={-4}
          left="50%"
          transform="translateX(-50%)"
          colorScheme={colorScheme}
          px={4}
          py={1}
          borderRadius="full"
          fontSize="sm"
        >
          Most Popular
        </Badge>
      )}
      <VStack spacing={4} align="stretch">
        <Box textAlign="center">
          <Heading size="lg">{title}</Heading>
          <Text fontSize="4xl" fontWeight="bold" mt={4}>
            {price}
            <Text as="span" fontSize="lg" fontWeight="normal" color="gray.500">
              /month
            </Text>
          </Text>
        </Box>
        <List spacing={3}>
          {features.map((feature, index) => (
            <ListItem key={index} display="flex" alignItems="center">
              <ListIcon as={FaCheck} color={`${colorScheme}.500`} />
              {feature}
            </ListItem>
          ))}
        </List>
        <Button
          colorScheme={colorScheme}
          size="lg"
          variant={isPopular ? 'solid' : 'outline'}
          mt={4}
          leftIcon={isPopular ? <FaRocket /> : undefined}
        >
          Get Started
        </Button>
      </VStack>
    </Box>
  )
}

const Pricing = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const bgColor = useColorModeValue('gray.50', 'gray.900')

  const handleSubscribe = (plan) => {
    toast({
      title: "Subscription Started",
      description: `You've subscribed to the ${plan} plan!`,
      status: "success",
      duration: 5000,
      isClosable: true,
    })
    navigate('/home')
  }

  const plans = [
    {
      title: "Starter",
      price: "$9.99",
      features: [
        "Basic coding assistance",
        "5 coding exercises per week",
        "Standard response time",
        "Community support",
        "Basic code analysis"
      ],
      colorScheme: "blue"
    },
    {
      title: "Pro",
      price: "$19.99",
      features: [
        "Advanced coding assistance",
        "Unlimited coding exercises",
        "Priority response time",
        "Priority support",
        "Advanced code analysis",
        "Code review sessions",
        "Custom exercises"
      ],
      isPopular: true,
      colorScheme: "orange"
    },
    {
      title: "Enterprise",
      price: "$49.99",
      features: [
        "Everything in Pro",
        "Team collaboration",
        "Custom AI model training",
        "Dedicated support",
        "API access",
        "Custom integrations",
        "Team analytics",
        "Priority feature requests"
      ],
      colorScheme: "purple"
    }
  ]

  return (
    <Box minH="100vh" bg={bgColor} py={20}>
      <Container maxW="container.xl">
        <VStack spacing={12} align="center">
          <Box textAlign="center" maxW="2xl">
            <Badge colorScheme="orange" px={4} py={1} borderRadius="full" mb={4}>
              Pricing Plans
            </Badge>
            <Heading size="2xl" mb={4}>
              Choose the Perfect Plan for You
            </Heading>
            <Text fontSize="xl" color="gray.600">
              Get access to powerful AI coding assistance and improve your programming skills
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} width="100%">
            {plans.map((plan, index) => (
              <PricingCard
                key={index}
                title={plan.title}
                price={plan.price}
                features={plan.features}
                isPopular={plan.isPopular}
                colorScheme={plan.colorScheme}
              />
            ))}
          </SimpleGrid>

          <Box textAlign="center" maxW="2xl">
            <Text fontSize="lg" color="gray.600" mb={6}>
              Not sure which plan to choose? Contact our sales team for a custom solution.
            </Text>
            <Button
              colorScheme="orange"
              variant="outline"
              size="lg"
              leftIcon={<FaStar />}
            >
              Contact Sales
            </Button>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

export default Pricing 