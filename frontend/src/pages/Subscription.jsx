import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  useColorModeValue,
  Button,
  Icon,
  Flex,
  HStack,
  List,
  ListItem,
  ListIcon,
  Badge,
  useToast,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Divider,
} from '@chakra-ui/react';
import { FaCheck, FaCrown, FaLock, FaUnlock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import config from '../config';

const PlanCard = ({ plan, isCurrentPlan, onSubscribe, usageStats }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const isPremium = plan.name === 'Premium Bundle';

  return (
    <Box
      p={6}
      bg={bgColor}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={isPremium ? 'orange.300' : borderColor}
      boxShadow={isPremium ? 'lg' : 'sm'}
      position="relative"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: 'md',
        borderColor: isPremium ? 'orange.400' : 'orange.300',
      }}
      transition="all 0.2s"
    >
      {isPremium && (
        <Badge
          position="absolute"
          top={4}
          right={4}
          colorScheme="orange"
          fontSize="sm"
          px={2}
          py={1}
          borderRadius="full"
        >
          <HStack spacing={1}>
            <Icon as={FaCrown} />
            <Text>BEST VALUE</Text>
          </HStack>
        </Badge>
      )}

      <VStack align="stretch" spacing={4}>
        <Box>
          <Heading size="lg" mb={2}>
            {plan.name}
          </Heading>
          <Text fontSize="3xl" fontWeight="bold" color={isPremium ? 'orange.500' : 'gray.700'}>
            ${plan.price}
            <Text as="span" fontSize="md" color="gray.500" fontWeight="normal">
              /month
            </Text>
          </Text>
        </Box>

        <Divider />

        <List spacing={3}>
          {plan.features.map((feature, index) => (
            <ListItem key={index}>
              <HStack>
                <ListIcon as={FaCheck} color="green.500" />
                <Text>{feature}</Text>
              </HStack>
            </ListItem>
          ))}
        </List>

        {isCurrentPlan ? (
          <Button
            colorScheme="orange"
            variant="outline"
            isDisabled
            leftIcon={<Icon as={FaCheck} />}
          >
            Current Plan
          </Button>
        ) : (
          <Button
            colorScheme="orange"
            variant={isPremium ? 'solid' : 'outline'}
            onClick={() => onSubscribe(plan)}
            leftIcon={<Icon as={isPremium ? FaUnlock : FaLock} />}
          >
            {isPremium ? 'Upgrade Now' : 'Subscribe'}
          </Button>
        )}

        {usageStats && (
          <Box mt={4}>
            <Text fontSize="sm" color="gray.500" mb={2}>
              Usage Statistics
            </Text>
            <VStack align="stretch" spacing={2}>
              <Box>
                <Text fontSize="sm">Study Materials</Text>
                <Progress
                  value={(usageStats.study_materials_accessed / plan.max_study_materials) * 100}
                  colorScheme="orange"
                  size="sm"
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {usageStats.study_materials_accessed} / {plan.max_study_materials} accessed
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm">Chat Messages</Text>
                <Progress
                  value={(usageStats.chat_messages / plan.max_chat_messages) * 100}
                  colorScheme="orange"
                  size="sm"
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {usageStats.chat_messages} / {plan.max_chat_messages} used
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm">Practice Sessions</Text>
                <Progress
                  value={(usageStats.practice_sessions / plan.max_practice_sessions) * 100}
                  colorScheme="orange"
                  size="sm"
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {usageStats.practice_sessions} / {plan.max_practice_sessions} completed
                </Text>
              </Box>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

const Subscription = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const [plans, setPlans] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        // Get subscription plans
        const plansResponse = await fetch(`${config.API_BASE_URL}/api/subscription/plans`);
        if (!plansResponse.ok) {
          throw new Error('Failed to fetch subscription plans');
        }
        const plansData = await plansResponse.json();
        setPlans(plansData);

        // Get user's subscription and usage stats
        const token = localStorage.getItem('token');
        if (token) {
          const userResponse = await fetch(`${config.API_BASE_URL}/api/subscription/user/current`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setCurrentPlan(userData.subscription.plan);
            setUsageStats(userData.usage_stats);
          }
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: err.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [toast]);

  const handleSubscribe = async (plan) => {
    // Here you would integrate with a payment processor like Stripe
    // For now, we'll just show a success message
    toast({
      title: 'Subscription Updated',
      description: `You have successfully subscribed to the ${plan.name}`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    
    // Refresh the page to show updated subscription
    window.location.reload();
  };

  if (loading) {
    return (
      <Center minH="100vh">
        <Spinner size="xl" color="orange.500" />
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading size="xl" mb={2}>
              Choose Your Learning Plan
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Select the plan that best fits your learning needs
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            {plans && Object.entries(plans).map(([key, plan]) => (
              <PlanCard
                key={key}
                plan={plan}
                isCurrentPlan={currentPlan === key}
                onSubscribe={handleSubscribe}
                usageStats={usageStats}
              />
            ))}
          </SimpleGrid>

          <Box textAlign="center" mt={8}>
            <Text color="gray.600">
              All plans include access to our community forum and basic features.
              <br />
              Need help choosing? <Button variant="link" colorScheme="orange">Contact our support team</Button>
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default Subscription; 