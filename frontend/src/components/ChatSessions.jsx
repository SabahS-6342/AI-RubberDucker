import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Divider,
  useToast,
  Container,
  Heading,
  List,
  ListItem,
} from '@chakra-ui/react';
import { DeleteIcon, ChatIcon, AddIcon } from '@chakra-ui/icons';

const ChatSessions = () => {
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/chat/sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch chat sessions',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        setSessions(sessions.filter(session => session.id !== sessionId));
        toast({
          title: 'Success',
          description: 'Chat session deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete chat session',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleStartNewSession = () => {
    navigate('/chat');
  };

  const handleOpenSession = (sessionId) => {
    navigate(`/chat/${sessionId}`);
  };

  return (
    <Container maxW="container.md" py={8}>
      <Box
        bg="white"
        borderRadius="lg"
        boxShadow="md"
        p={6}
      >
        <HStack justify="space-between" mb={4}>
          <Heading size="lg">Chat Sessions</Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={handleStartNewSession}
          >
            New Session
          </Button>
        </HStack>
        <Divider mb={4} />
        <List spacing={3}>
          {sessions.map((session) => (
            <ListItem
              key={session.id}
              p={3}
              borderRadius="md"
              _hover={{ bg: 'gray.50' }}
              cursor="pointer"
              onClick={() => handleOpenSession(session.id)}
            >
              <HStack justify="space-between">
                <HStack spacing={3}>
                  <ChatIcon color="blue.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="medium">{session.title}</Text>
                    <Text fontSize="sm" color="gray.500">
                      Last updated: {format(new Date(session.last_updated), 'PPp')}
                    </Text>
                  </VStack>
                </HStack>
                <IconButton
                  icon={<DeleteIcon />}
                  variant="ghost"
                  colorScheme="red"
                  aria-label="Delete session"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id);
                  }}
                />
              </HStack>
            </ListItem>
          ))}
          {sessions.length === 0 && (
            <ListItem p={3}>
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">No chat sessions yet</Text>
                <Text fontSize="sm" color="gray.500">
                  Start a new session to begin learning
                </Text>
              </VStack>
            </ListItem>
          )}
        </List>
      </Box>
    </Container>
  );
};

export default ChatSessions; 