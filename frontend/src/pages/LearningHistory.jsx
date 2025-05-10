import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  useColorModeValue,
  Progress,
  Badge,
  Icon,
  Flex,
  HStack,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
} from '@chakra-ui/react';
import { FaHistory, FaCheckCircle, FaClock, FaPlay } from 'react-icons/fa';

const LearningHistory = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const [timeFilter, setTimeFilter] = useState('all');

  const learningStats = {
    totalTopics: 20,
    completedTopics: 12,
    totalHours: 45,
    averageScore: 85,
  };

  const learningHistory = [
    {
      id: 1,
      topic: 'Python Basics',
      date: '2024-03-15',
      duration: '45 min',
      progress: 100,
      status: 'completed',
    },
    {
      id: 2,
      topic: 'Data Structures',
      date: '2024-03-14',
      duration: '60 min',
      progress: 75,
      status: 'in-progress',
    },
    {
      id: 3,
      topic: 'Algorithms',
      date: '2024-03-13',
      duration: '30 min',
      progress: 50,
      status: 'in-progress',
    },
    {
      id: 4,
      topic: 'Web Development',
      date: '2024-03-12',
      duration: '90 min',
      progress: 100,
      status: 'completed',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'in-progress':
        return 'orange';
      default:
        return 'gray';
    }
  };

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="xl" mb={2}>
              Learning History
            </Heading>
            <Text color="gray.600">
              Track your learning progress and achievements
            </Text>
          </Box>

          {/* Stats Overview */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
            <Box
              p={6}
              bg={cardBg}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <VStack align="start" spacing={2}>
                <Text color="gray.600">Topics Explored</Text>
                <Heading size="lg">{learningStats.totalTopics}</Heading>
                <Text color="green.500">
                  {learningStats.completedTopics} completed
                </Text>
              </VStack>
            </Box>
            <Box
              p={6}
              bg={cardBg}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <VStack align="start" spacing={2}>
                <Text color="gray.600">Completion Rate</Text>
                <Heading size="lg">
                  {Math.round(
                    (learningStats.completedTopics / learningStats.totalTopics) *
                      100
                  )}
                  %
                </Heading>
                <Progress
                  value={
                    (learningStats.completedTopics / learningStats.totalTopics) *
                    100
                  }
                  colorScheme="green"
                  size="sm"
                  width="100%"
                />
              </VStack>
            </Box>
            <Box
              p={6}
              bg={cardBg}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <VStack align="start" spacing={2}>
                <Text color="gray.600">Total Learning Time</Text>
                <Heading size="lg">{learningStats.totalHours}h</Heading>
                <Text color="orange.500">Last 30 days</Text>
              </VStack>
            </Box>
            <Box
              p={6}
              bg={cardBg}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <VStack align="start" spacing={2}>
                <Text color="gray.600">Average Score</Text>
                <Heading size="lg">{learningStats.averageScore}%</Heading>
                <Text color="blue.500">Across all topics</Text>
              </VStack>
            </Box>
          </SimpleGrid>

          {/* Learning History Table */}
          <Box
            p={6}
            bg={cardBg}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Flex justify="space-between" align="center" mb={6}>
              <Heading size="md">Recent Learning Sessions</Heading>
              <Select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                width="200px"
              >
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </Select>
            </Flex>

            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Topic</Th>
                  <Th>Date</Th>
                  <Th>Duration</Th>
                  <Th>Progress</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {learningHistory.map((session) => (
                  <Tr key={session.id}>
                    <Td>{session.topic}</Td>
                    <Td>{session.date}</Td>
                    <Td>{session.duration}</Td>
                    <Td>
                      <Progress
                        value={session.progress}
                        colorScheme="orange"
                        size="sm"
                      />
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        colorScheme="orange"
                        leftIcon={
                          <Icon
                            as={
                              session.status === 'completed'
                                ? FaCheckCircle
                                : FaPlay
                            }
                          />
                        }
                      >
                        {session.status === 'completed' ? 'Review' : 'Continue'}
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default LearningHistory; 