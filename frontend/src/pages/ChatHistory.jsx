import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Input,
  Select,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  HStack,
  IconButton,
  useToast,
  Spinner,
  Badge,
  Flex,
  Spacer,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  Tooltip,
  Avatar,
} from '@chakra-ui/react';
import { DeleteIcon, TimeIcon, ChatIcon, SearchIcon } from '@chakra-ui/icons';
import { FaRobot, FaUser, FaHistory, FaFilter } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import { keyframes } from '@emotion/react';

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ChatHistory = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const navigate = useNavigate();
  const toast = useToast();

  // Theme colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('white', 'gray.700');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const headerBg = useColorModeValue('white', 'gray.800');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.3)');

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/api/chat/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }
      
      const data = await response.json();
      setChatHistory(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load chat history',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (chatId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/api/chat/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      setChatHistory(chatHistory.filter(chat => chat.id !== chatId));
      toast({
        title: 'Success',
        description: 'Chat deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete chat',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const filteredChats = chatHistory.filter(chat => {
    const matchesSearch = chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (chat.last_message && chat.last_message.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTime = timeFilter === 'all' || 
                       (timeFilter === 'today' && new Date(chat.created_at).toDateString() === new Date().toDateString()) ||
                       (timeFilter === 'week' && (new Date() - new Date(chat.created_at)) <= 7 * 24 * 60 * 60 * 1000);
    const matchesTopic = topicFilter === 'all' || chat.topic === topicFilter;
    return matchesSearch && matchesTime && matchesTopic;
  });

  const topics = ['all', ...new Set(chatHistory.map(chat => chat.topic).filter(Boolean))];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        <Spinner size="xl" color="orange.500" thickness="4px" />
      </Box>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Flex justify="space-between" align="center">
          <HStack spacing={3}>
            <Avatar 
              icon={<FaHistory fontSize="1.5rem" />} 
              bg="orange.500" 
              color="white"
              size="md"
            />
            <VStack align="start" spacing={0}>
              <Heading size="lg">Chat History</Heading>
              <Text fontSize="sm" color="gray.500">
                {filteredChats.length} conversations found
              </Text>
            </VStack>
          </HStack>
        </Flex>
        
        <Box
          p={4}
          bg={headerBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={borderColor}
          boxShadow="sm"
        >
          <HStack spacing={4} wrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg={inputBg}
                borderRadius="full"
                _focus={{
                  boxShadow: '0 0 0 1px var(--chakra-colors-orange-500)',
                  border: 'none',
                }}
              />
            </InputGroup>
            <Select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              maxW="200px"
              bg={inputBg}
              borderRadius="full"
              icon={<FaFilter />}
              _focus={{
                boxShadow: '0 0 0 1px var(--chakra-colors-orange-500)',
                border: 'none',
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
            </Select>
            <Select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              maxW="200px"
              bg={inputBg}
              borderRadius="full"
              icon={<FaFilter />}
              _focus={{
                boxShadow: '0 0 0 1px var(--chakra-colors-orange-500)',
                border: 'none',
              }}
            >
              {topics.map(topic => (
                <option key={topic} value={topic}>
                  {topic === 'all' ? 'All Topics' : topic}
                </option>
              ))}
            </Select>
          </HStack>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredChats.map((chat) => (
            <Card 
              key={chat.id} 
              bg={cardBg} 
              borderWidth="1px" 
              borderColor={borderColor}
              borderRadius="xl"
              overflow="hidden"
              boxShadow="sm"
              transition="all 0.2s"
              _hover={{ 
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
                borderColor: 'orange.500'
              }}
              animation={`${fadeIn} 0.3s ease-out`}
            >
              <CardHeader>
                <Flex align="center">
                  <Avatar 
                    icon={<FaRobot fontSize="1rem" />} 
                    bg="orange.500" 
                    color="white"
                    size="sm"
                    mr={3}
                  />
                  <VStack align="start" spacing={0}>
                    <Heading size="md" noOfLines={1}>
                      {chat.title}
                    </Heading>
                    {chat.topic && (
                      <Badge colorScheme="orange" mt={1}>
                        {chat.topic}
                      </Badge>
                    )}
                  </VStack>
                  <Spacer />
                  <Tooltip label="Delete chat">
                    <IconButton
                      icon={<DeleteIcon />}
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleDelete(chat.id)}
                      aria-label="Delete chat"
                      size="sm"
                    />
                  </Tooltip>
                </Flex>
              </CardHeader>
              
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <HStack>
                    <TimeIcon color="orange.500" />
                    <Text fontSize="sm" color="gray.500">
                      {formatDate(chat.created_at)}
                    </Text>
                  </HStack>
                  <HStack>
                    <ChatIcon color="orange.500" />
                    <Text fontSize="sm" color="gray.500">
                      {chat.message_count} messages
                    </Text>
                  </HStack>
                  {chat.last_message && (
                    <Text fontSize="sm" noOfLines={2} color="gray.500">
                      Last message: {chat.last_message}
                    </Text>
                  )}
                </VStack>
              </CardBody>

              <CardFooter>
                <Button
                  colorScheme="orange"
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  width="full"
                  borderRadius="full"
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                  transition="all 0.2s"
                >
                  Continue Chat
                </Button>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>

        {filteredChats.length === 0 && (
          <Box 
            textAlign="center" 
            py={10}
            bg={cardBg}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={borderColor}
            animation={`${fadeIn} 0.3s ease-out`}
          >
            <VStack spacing={4}>
              <Avatar 
                icon={<FaHistory fontSize="1.5rem" />} 
                bg="gray.200" 
                color="gray.500"
                size="lg"
              />
              <Text fontSize="lg" color="gray.500">
                No chat history found
              </Text>
              <Text fontSize="sm" color="gray.400">
                Start a new conversation to begin learning
              </Text>
            </VStack>
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default ChatHistory; 