import React, { useState, useEffect } from 'react';
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
  Button,
  Icon,
  Flex,
  HStack,
  Tooltip,
  useToast,
  Skeleton,
} from '@chakra-ui/react';
import { FaBook, FaCheck, FaLock, FaArrowRight, FaClock, FaGraduationCap } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getLearningPaths } from '../services/learningPath';



const TopicCard = ({id, title, description, level, tags, items }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const progressColor = useColorModeValue('orange.500', 'orange.300');

  const getLevelColor = () => {
    switch (level) {
      case 'Beginner':
        return 'green';
      case 'Intermediate':
        return 'orange';
      case 'Advanced':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Box
      p={6}
      bg={bgColor}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      boxShadow="sm"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: 'md',
        borderColor: 'orange.300',
      }}
      transition="all 0.2s"
    >
      <VStack align="stretch" spacing={4}>
        <HStack justify="space-between">
          <Heading size="md">{title}</Heading>
          {isLocked ? (
            <Tooltip label="Complete previous topics to unlock">
              <Icon as={FaLock} color="gray.400" />
            </Tooltip>
          ) : (
            <Badge colorScheme={progress === 100 ? 'green' : 'orange'}>
              {progress}% Complete
            </Badge>
          )}
        </HStack>
        <Text color="gray.600">{description}</Text>
        
      </VStack>
    </Box>
  );
};

const LearningPathCard = ({ path, onClick }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const getDifficultyColor = (level) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'green';
      case 'intermediate':
        return 'blue';
      case 'advanced':
        return 'red';
      default:
        return 'gray';
    }
  };
  
  return (
    <Box
      p={6}
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      bg={bgColor}
      boxShadow="sm"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: 'md',
        borderColor: 'orange.300'
      }}
      transition="all 0.2s"
      cursor="pointer"
      onClick={onClick}
    >
      <VStack align="start" spacing={4}>
        <HStack justify="space-between" w="full">
          <Heading size="md">{path.title}</Heading>
          <Badge colorScheme={getDifficultyColor(path.level)}>
            {path.level}
          </Badge>
        </HStack>
        <Text color="gray.600">{path.description}</Text>
        <HStack spacing={4}>
          <HStack>
            <Badge colorScheme={getDifficultyColor()}>{level}</Badge>
          </HStack>
          <HStack>
            <Icon as={FaBook} color="gray.500" />
            <Text fontSize="sm" color="gray.500">{path.items.length} items</Text>
          </HStack>
        </HStack>
      </VStack>
    </Box>
  );
};

const LearningPath = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  
  const [paths, setPaths] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchLearningPaths = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getLearningPaths();
        setPaths(data);
      } catch (error) {
        setError(error.message);
        toast({
          title: 'Error',
          description: 'Failed to load learning paths',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLearningPaths();
  }, [toast]);
  
  const handlePathClick = (pathId) => {
    navigate(`/learning-path/${pathId}`);
  };
  
  if (isLoading) {
    return (
      <Box minH="100vh" bg={bgColor} p={8}>
        <VStack spacing={8} align="stretch" maxW="1200px" mx="auto">
          <VStack align="start" spacing={1}>
            <Skeleton height="40px" width="200px" />
            <Skeleton height="20px" width="300px" />
          </VStack>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height="200px" borderRadius="lg" />
            ))}
          </SimpleGrid>
        </VStack>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box minH="100vh" bg={bgColor} p={8}>
        <VStack spacing={8} align="stretch" maxW="1200px" mx="auto">
          <VStack align="start" spacing={1}>
            <Heading size="xl" color="red.500">Error Loading Learning Paths</Heading>
            <Text color="gray.600">{error}</Text>
          </VStack>
        </VStack>
      </Box>
    );
  }
  
  return (
    <Box minH="100vh" bg={bgColor} p={8}>
      <VStack spacing={8} align="stretch" maxW="1200px" mx="auto">
        <VStack align="start" spacing={1}>
          <Heading size="xl" bgGradient="linear(to-r, orange.400, orange.600)" bgClip="text">
            Learning Paths
          </Heading>
          <Text color="gray.600">Choose a learning path to start your journey</Text>
        </VStack>
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {paths.map((path) => (
            <LearningPathCard
              key={path.id}
              path={path}
              onClick={() => handlePathClick(path.id)}
            />
          ))}
          {paths.length === 0 && (
            <Box
              p={6}
              borderWidth="1px"
              borderRadius="lg"
              borderColor={useColorModeValue('gray.200', 'gray.600')}
              bg={useColorModeValue('white', 'gray.700')}
            >
              <VStack spacing={4}>
                <Icon as={FaGraduationCap} w={12} h={12} color="gray.400" />
                <Text color="gray.500" textAlign="center">
                  No learning paths available yet. Check back soon!
                </Text>
              </VStack>
            </Box>
          )}
        </SimpleGrid>
      </VStack>
    </Box>
  );
};

export default LearningPath; 