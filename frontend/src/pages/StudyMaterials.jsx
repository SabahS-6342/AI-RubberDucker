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
import { getStudyMaterials } from '../services/studyMaterials';

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
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setIsLoading(true);
        const data = await getStudyMaterials();
        setResources(data);
      } catch (err) {
        setError(err.message);
        toast({
          title: 'Error',
          description: 'Failed to load study materials',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [toast]);

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    const matchesDifficulty = selectedDifficulty === 'all' || resource.difficulty === selectedDifficulty;
    return matchesSearch && matchesType && matchesDifficulty;
  });

  if (isLoading) {
    return (
      <Box minH="100vh" bg={bgColor} py={8}>
        <Container maxW="container.xl">
          <VStack spacing={8} align="stretch">
            <Box>
              <Heading size="xl" mb={2}>
                Study Materials
              </Heading>
              <Text color="gray.600">
                Access curated high-quality learning resources
              </Text>
            </Box>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} height="200px" borderRadius="lg" />
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Center minH="100vh">
        <Alert status="error" maxW="container.md">
          <AlertIcon />
          {error}
        </Alert>
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="xl" mb={2}>
              Study Materials
            </Heading>
            <Text color="gray.600">
              Access curated high-quality learning resources
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={FaSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="article">Articles</option>
              <option value="video">Videos</option>
              <option value="book">Books</option>
            </Select>
            <Select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="all">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </Select>
          </SimpleGrid>

          {filteredResources.length === 0 ? (
            <Center py={8}>
              <Alert status="info" maxW="container.md">
                <AlertIcon />
                No resources found matching your criteria
              </Alert>
            </Center>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {filteredResources.map((resource, index) => (
                <ResourceCard
                  key={index}
                  title={resource.title}
                  description={resource.description}
                  type={resource.type}
                  difficulty={resource.difficulty}
                  url={resource.url}
                />
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default StudyMaterials; 