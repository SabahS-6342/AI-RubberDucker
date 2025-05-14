import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  Button,
  useColorModeValue,
  Badge,
  List,
  ListItem,
  ListIcon,
  Icon,
} from '@chakra-ui/react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const PricingCard = ({ title, price, features, isPopular, isFree, onSelect }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const popularBg = useColorModeValue('orange.50', 'orange.900');
  const popularBorder = 'orange.500';

  return (
    <Box
      bg={isPopular ? popularBg : bgColor}
      borderWidth="1px"
      borderColor={isPopular ? popularBorder : borderColor}
      borderRadius="lg"
      p={8}
      shadow="lg"
      position="relative"
      transition="all 0.3s"
      _hover={{
        transform: 'translateY(-5px)',
        shadow: 'xl',
      }}
    >
      {isPopular && (
        <Badge
          position="absolute"
          top={-4}
          right={4}
          colorScheme="orange"
          px={3}
          py={1}
          borderRadius="full"
          fontSize="sm"
        >
          Most Popular
        </Badge>
      )}
      <VStack spacing={4} align="stretch">
        <Heading size="lg" color={isPopular ? 'orange.500' : 'gray.700'}>
          {title}
        </Heading>
        <Text fontSize="3xl" fontWeight="bold">
          {isFree ? 'Free' : `$${price}`}
          {!isFree && <Text as="span" fontSize="lg" fontWeight="normal">/month</Text>}
        </Text>
        <List spacing={3}>
          {features.map((feature, index) => (
            <ListItem key={index} display="flex" alignItems="center">
              <ListIcon
                as={feature.included ? FaCheck : FaTimes}
                color={feature.included ? 'green.500' : 'red.500'}
                mr={2}
              />
              <Text color={feature.included ? 'gray.700' : 'gray.500'}>
                {feature.text}
              </Text>
            </ListItem>
          ))}
        </List>
        <Button
          colorScheme={isPopular ? 'orange' : 'gray'}
          size="lg"
          mt={4}
          onClick={onSelect}
          bgGradient={isPopular ? "linear(to-r, orange.400, orange.500)" : undefined}
          _hover={{
            bgGradient: isPopular ? "linear(to-r, orange.500, orange.600)" : undefined,
            transform: 'translateY(-2px)',
            shadow: 'md',
          }}
        >
          {isFree ? 'Start Free Trial' : 'Get Started'}
        </Button>
      </VStack>
    </Box>
  );
};

const Pricing = () => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  const plans = [
    {
      title: 'Free Tier',
      price: '0',
      isFree: true,
      features: [
        { text: '3 AI chatbot interactions', included: true },
        { text: 'Basic learning resources', included: true },
        { text: 'Community support', included: true },
        { text: 'Advanced features', included: false },
        { text: 'Priority support', included: false },
      ],
    },
    {
      title: 'Basic Bundle',
      price: '9.99',
      features: [
        { text: '10 AI chatbot interactions per day', included: true },
        { text: 'Access to learning challenges', included: true },
        { text: 'Basic learning resources', included: true },
        { text: 'Community support', included: true },
        { text: 'Priority support', included: false },
      ],
    },
    {
      title: 'Pro Bundle',
      price: '39.99',
      isPopular: true,
      features: [
        { text: '50 AI chatbot interactions per day', included: true },
        { text: 'Faster responses', included: true },
        { text: 'Advanced features', included: true },
        { text: 'Priority support', included: true },
        { text: 'Personalized learning path', included: true },
      ],
    },
    {
      title: 'Premium Bundle',
      price: '99.90',
      features: [
        { text: 'Unlimited AI chatbot interactions', included: true },
        { text: 'Personalized support', included: true },
        { text: 'Priority access', included: true },
        { text: 'Advanced features', included: true },
        { text: 'Custom learning path', included: true },
      ],
    },
  ];

  const handleSelectPlan = (plan) => {
    // TODO: Implement plan selection logic
    console.log('Selected plan:', plan);
    navigate('/register');
  };

  return (
    <Box bg={bgColor} py={20}>
      <Container maxW="container.xl">
        <VStack spacing={12}>
          <VStack spacing={4} textAlign="center">
            <Heading
              size="2xl"
              bgGradient="linear(to-r, orange.400, orange.500)"
              bgClip="text"
            >
              Choose Your Plan
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl">
              Select the perfect plan for your learning journey. All plans include our core features
              with different levels of access and support.
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8} width="100%">
            {plans.map((plan) => (
              <PricingCard
                key={plan.title}
                {...plan}
                onSelect={() => handleSelectPlan(plan)}
              />
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default Pricing; 