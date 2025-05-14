import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  useColorModeValue,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Badge,
  Icon,
  Flex,
  HStack,
  Button,
  Link,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  useToast,
  Skeleton,
} from '@chakra-ui/react';
import { FaSearch, FaBook, FaVideo, FaFileAlt, FaExternalLinkAlt } from 'react-icons/fa';
import { getStudyMaterials } from '../services/learningPath';

const ResourceCard = ({ title, description, type, difficulty, url }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const getTypeIcon = () => {
    switch (type) {
      case 'video':
        return FaVideo;
      case 'article':
        return FaFileAlt;
      default:
        return FaBook;
    }
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
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
          <Icon as={getTypeIcon()} color="orange.500" boxSize={5} />
        </HStack>
        <Text color="gray.600">{description}</Text>
        <HStack spacing={2}>
          <Badge colorScheme={getDifficultyColor()}>{difficulty}</Badge>
          <Badge colorScheme="blue">{type}</Badge>
        </HStack>
        <Button
          as={Link}
          href={url}
          target="_blank"
          leftIcon={<FaExternalLinkAlt />}
          colorScheme="orange"
          variant="outline"
        >
          Access Resource
        </Button>
      </VStack>
    </Box>
  );
};

const StudyMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const toast = useToast();
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const data = await getStudyMaterials();
        setMaterials(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load study materials',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchMaterials();
  }, [toast]);

  return (
    <Box minH="100vh" bg={bgColor} p={8}>
      <VStack spacing={8} align="stretch" maxW="1200px" mx="auto">
        <VStack align="start" spacing={1}>
          <Heading size="xl">Study Materials</Heading>
          <Text color="gray.600">Explore additional resources to enhance your learning</Text>
        </VStack>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {materials.map((material) => (
            <Box key={material.id} p={6} bg={useColorModeValue('white', 'gray.700')} borderRadius="lg" borderWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.600')}>
              <Heading size="md">{material.title}</Heading>
              <Text color="gray.600">{material.description}</Text>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  );
};

export default StudyMaterials; 