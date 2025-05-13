import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Input,
  IconButton,
  Text,
  VStack,
  HStack,
  useToast,
  Container,
  Heading,
} from '@chakra-ui/react';
import { ChatIcon, ArrowUpIcon, CloseIcon } from '@chakra-ui/icons';
import axios from 'axios';
import config from '../config';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const { id: userId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchSession(userId);
    }
  }, [userId]);

  const fetchSession = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/api/chat/sessions/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const session = await response.json();
        setSessionId(session.id);
        setSessionTitle(session.title);
        setMessages(session.messages);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat session',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let response;
      if (!sessionId) {
        response = await fetch('http://localhost:8000/api/chat/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            message: input,
            topic: 'programming',
            difficulty_level: 'beginner'
          }),
        });

        if (response.ok) {
          const session = await response.json();
          setSessionId(session.id);
          setSessionTitle(session.title);
          navigate(`/chat/${session.id}`);
        }
      } else {
        response = await fetch(`http://localhost:8000/api/chat/${sessionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            message: input,
            topic: 'programming',
            difficulty_level: 'beginner'
          }),
        });
      }

      if (response.ok) {
        const data = await response.json();
        const aiMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
        setSessionTitle(data.title);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) {
      console.error('No file selected');
      return;
    }

    if (!file.type.includes('pdf')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      console.log('Starting file upload...');
      console.log('File:', file);
      
      const uploadUrl = `${config.API_BASE_URL}${config.API_ENDPOINTS.CHAT.PDF_SUMMARY}`;
      console.log('Upload URL:', uploadUrl);

      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to upload files',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload file');
      }

      const data = await response.json();
      console.log('Upload response:', data);

      if (data) {
        const { summary, key_points } = data;
        const message = `Here's a summary of your PDF:\n\n${summary}\n\nKey Points:\n${key_points.map(point => `• ${point}`).join('\n')}`;
        setMessages(prev => [...prev, { role: 'assistant', content: message }]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        request: error.request
      });
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to process PDF. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <Box
        position="fixed"
        bottom="20px"
        right="20px"
        width="400px"
        height="600px"
        bg="white"
        borderRadius="lg"
        boxShadow="xl"
        display="flex"
        flexDirection="column"
    >
        <Box
            p={4}
            bg="blue.500"
            color="white"
            borderTopRadius="lg"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
        >
            <Text fontWeight="bold">AI Programming Tutor</Text>
            <IconButton
                icon={<CloseIcon />}
                variant="ghost"
                color="white"
                onClick={() => setIsOpen(false)}
            />
        </Box>

        <Box
            flex="1"
            overflowY="auto"
            p={4}
            display="flex"
            flexDirection="column"
            gap={4}
        >
            {messages.map((message, index) => (
                <Box
                    key={index}
                    alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'}
                    maxW="80%"
                    bg={message.role === 'user' ? 'blue.500' : 'gray.100'}
                    color={message.role === 'user' ? 'white' : 'black'}
                    p={3}
                    borderRadius="lg"
                >
                    <Text whiteSpace="pre-wrap">{message.content}</Text>
                </Box>
            ))}
        </Box>

        <Box p={4} borderTop="1px" borderColor="gray.200">
            <form onSubmit={handleSubmit}>
                <Flex gap={2}>
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        flex="1"
                    />
                    <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                handleFileUpload(file);
                            }
                        }}
                        display="none"
                        id="pdf-upload"
                    />
                    <label htmlFor="pdf-upload">
                        <IconButton
                            as="span"
                            icon={<ArrowUpIcon />}
                            colorScheme="blue"
                            aria-label="Upload PDF"
                            cursor="pointer"
                            onClick={() => {
                                const input = document.getElementById('pdf-upload');
                                if (input) {
                                    input.click();
                                }
                            }}
                        />
                    </label>
                    <IconButton
                        type="submit"
                        icon={<ChatIcon />}
                        colorScheme="blue"
                        aria-label="Send message"
                        isLoading={isLoading}
                    />
                </Flex>
            </form>
        </Box>
    </Box>
  );
};

export default Chatbot; 