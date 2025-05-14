import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Input,
  Text,
  useColorModeValue,
  Flex,
  IconButton,
  useToast,
  Button,
  Tooltip,
  Badge,
  InputGroup,
  InputRightElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Avatar,
  Heading,
  useBreakpointValue,
  Link,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { FaPaperPlane, FaTrash, FaCode, FaFileUpload, FaFile, FaImage, FaFileCode, FaRobot, FaUser } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import config from '../config';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

// Animation keyframes
const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Format timestamp function
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.abs(now - date) / 36e5; // Convert to hours

  if (diffInHours < 24) {
    // If less than 24 hours, show time
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 48) {
    // If less than 48 hours, show "Yesterday"
    return 'Yesterday';
  } else if (diffInHours < 168) { // 7 days
    // If less than a week, show day name
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

const Chatbot = () => {
  const { id: sessionId } = useParams();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [currentTopic, setCurrentTopic] = useState('');
  const [currentDifficulty, setCurrentDifficulty] = useState('');
  const [chatTitle] = useState('AI Chatbot');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  // Theme colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const codeBgColor = useColorModeValue('gray.50', 'gray.900');
  const codeTextColor = useColorModeValue('gray.800', 'gray.200');
  const userBubbleBg = useColorModeValue('orange.500', 'orange.400');
  const botBubbleBg = useColorModeValue('gray.100', 'gray.700');
  const userTextColor = useColorModeValue('white', 'white');
  const botTextColor = useColorModeValue('gray.800', 'gray.100');
  const headerBg = useColorModeValue('white', 'gray.800');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.3)');

  // Load session if sessionId is provided
  useEffect(() => {
    const initializeChat = async () => {
      try {
        if (sessionId) {
          await loadSession(sessionId);
        } else {
          // Initialize new session with welcome message
          const welcomeMessage = {
            role: "assistant",
            content: "👋 Hi! I'm your AI learning companion. I can help you understand complex topics, provide personalized explanations, and guide you through your learning journey. What would you like to learn about today?",
            timestamp: new Date().toISOString()
          };
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize chat. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    initializeChat();
  }, [sessionId]);

  const loadSession = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Get the session details using POST method
      const response = await fetch(`${config.API_BASE_URL}/api/chat/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: "",  // Empty message to just load the session
          action: "load"  // Indicate this is a load action
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to load chat session');
      }

      const data = await response.json();
      
      // Validate the response data
      if (!data || !data.history) {
        console.error('Invalid session data:', data);
        throw new Error('Invalid session data received');
      }

      // Get the existing messages from the session
      const sessionMessages = data.history;
      
      // Ensure each message has the required fields
      const validMessages = sessionMessages.map(msg => ({
        role: msg.role || 'assistant',
        content: msg.content || '',
        timestamp: msg.timestamp || new Date().toISOString()
      }));

      // Set the messages in state
      setMessages(validMessages);
      setCurrentTopic(data.topic || '');
      setCurrentSessionId(id);

      // Show success toast
      toast({
        title: 'Chat Loaded',
        description: 'Previous messages have been loaded.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error loading session:', error);
      
      // Show error toast
      toast({
        title: 'Error Loading Chat',
        description: error.message || 'Failed to load chat session. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });

      // Reset to new chat
      const welcomeMessage = {
        role: "assistant",
        content: "👋 Hi! I'm your AI learning companion. I can help you understand complex topics, provide personalized explanations, and guide you through your learning journey. What would you like to learn about today?",
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
      setCurrentSessionId(null);
      navigate('/chat');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      setIsLoading(true);
      const currentMessage = message;
      setMessage("");

      // Add user message to chat immediately
      const userMessage = {
        role: "user",
        content: currentMessage,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      let response;
      if (currentSessionId) {
        // Send message to existing session
        response = await axios.post(
          `${config.API_BASE_URL}/api/chat/${currentSessionId}`,
          { message: currentMessage },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
      } else {
        // Start new session
        response = await axios.post(
          `${config.API_BASE_URL}/api/chat`,
          { message: currentMessage },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        
        // Update session ID and URL if this is a new session
        if (response.data.session_id) {
          setCurrentSessionId(response.data.session_id);
          navigate(`/chat/${response.data.session_id}`);
        }
      }

      // Add AI response to chat
      if (response.data.response) {
        const aiMessage = {
          role: "assistant",
          content: response.data.response,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      }

    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    const welcomeMessage = {
      role: "assistant",
      content: "👋 Hi! I'm your AI learning companion. I can help you understand complex topics, provide personalized explanations, and guide you through your learning journey. What would you like to learn about today?",
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
    setCurrentTopic('');
    setCurrentDifficulty('');
    setCurrentSessionId(null);
    navigate('/chat');
    toast({
      title: 'Learning session cleared',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
      
      onOpen();
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    const newMessage = {
      id: Date.now(),
      text: `Uploaded file: ${selectedFile.name}`,
      sender: 'user',
      timestamp: new Date().toISOString(),
      status: 'sending',
      file: {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        url: previewUrl,
      },
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${config.API_BASE_URL}/api/chat/pdf-summary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to process PDF');
      }

      const data = await response.json();
      
      // Update the user message status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );

      // Add bot's response with summary
      const botMessage = {
        id: Date.now() + 1,
        text: `Here's a summary of ${selectedFile.name}:\n\n${data.summary}\n\nKey Points:\n${data.key_points.map(point => `• ${point}`).join('\n')}`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('File upload error:', error);
      // Update the user message status to error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: 'error' } : msg
        )
      );

      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      onClose();
    }
  };

  const handleNewChat = () => {
    // Create welcome message for new chat
    const welcomeMessage = {
      role: "assistant",
      content: "👋 Hi! I'm your AI learning companion. I can help you understand complex topics, provide personalized explanations, and guide you through your learning journey. What would you like to learn about today?",
      timestamp: new Date().toISOString()
    };
    
    // Reset state for new chat
    setMessages([welcomeMessage]);
    setCurrentTopic('');
    setCurrentDifficulty('');
    setCurrentSessionId(null);
    
    // Navigate to new chat URL
    navigate('/chat');
    
    // Show success toast
    toast({
      title: 'New Chat Started',
      description: 'You can now start a new conversation.',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const renderMessage = (msg) => {
    if (msg.file) {
      return (
        <VStack align="stretch" spacing={2}>
          <Text>{msg.content}</Text>
          <Box
            p={3}
            bg={codeBgColor}
            borderRadius="md"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <HStack spacing={2}>
              {msg.file.type.startsWith('image/') ? (
                <FaImage color="orange" />
              ) : msg.file.type.includes('code') || msg.file.name.endsWith('.js') || msg.file.name.endsWith('.py') ? (
                <FaFileCode color="orange" />
              ) : (
                <FaFile color="orange" />
              )}
              <Text fontSize="sm" fontWeight="medium">
                {msg.file.name}
              </Text>
              <Text fontSize="xs" color="gray.500">
                ({(msg.file.size / 1024).toFixed(1)} KB)
              </Text>
            </HStack>
            {msg.file.url && (
              <Box mt={2} borderRadius="md" overflow="hidden">
                <img 
                  src={msg.file.url} 
                  alt={msg.file.name} 
                  style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} 
                />
              </Box>
            )}
          </Box>
        </VStack>
      );
    }

    return (
      <Box>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]} 
          rehypePlugins={[rehypeHighlight]}
          components={{
            p: ({ children }) => <Text mb={2}>{children}</Text>,
            h1: ({ children }) => <Heading as="h1" size="xl" mb={4}>{children}</Heading>,
            h2: ({ children }) => <Heading as="h2" size="lg" mb={3}>{children}</Heading>,
            h3: ({ children }) => <Heading as="h3" size="md" mb={2}>{children}</Heading>,
            ul: ({ children }) => <Box as="ul" pl={4} mb={2}>{children}</Box>,
            ol: ({ children }) => <Box as="ol" pl={4} mb={2}>{children}</Box>,
            li: ({ children }) => <Box as="li" mb={1}>{children}</Box>,
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              return !inline ? (
                <Box
                  bg={codeBgColor}
                  p={4}
                  borderRadius="md"
                  overflowX="auto"
                  fontFamily="monospace"
                  fontSize="sm"
                  color={codeTextColor}
                  whiteSpace="pre-wrap"
                  {...props}
                >
                  {children}
                </Box>
              ) : (
                <Text as="code" bg={codeBgColor} px={1} py={0.5} borderRadius="sm" fontFamily="monospace">
                  {children}
                </Text>
              );
            },
            a: ({ children, href }) => (
              <Link href={href} color="orange.500" isExternal>
                {children}
              </Link>
            ),
          }}
        >
          {msg.content}
        </ReactMarkdown>
      </Box>
    );
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <Container maxW="container.lg" py={8}>
      <Box
        bg={bgColor}
        borderRadius="xl"
        borderWidth="1px"
        borderColor={borderColor}
        overflow="hidden"
        height="calc(100vh - 200px)"
        display="flex"
        flexDirection="column"
        boxShadow="lg"
      >
        {/* Header */}
        <Flex
          p={4}
          borderBottomWidth="1px"
          borderColor={borderColor}
          justify="space-between"
          align="center"
          bg={headerBg}
          position="sticky"
          top={0}
          zIndex={10}
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <Avatar 
              icon={<FaRobot fontSize="1.5rem" />} 
              bg="orange.500" 
              color="white"
              size="sm"
            />
            <VStack align="start" spacing={0}>
              <Heading size="sm">{chatTitle}</Heading>
              <Text fontSize="xs" color="gray.500">
                {currentTopic 
                  ? `Exploring ${currentTopic}${currentDifficulty ? ` (${currentDifficulty})` : ''}`
                  : 'Your personalized learning companion'}
              </Text>
            </VStack>
          </HStack>
          <HStack spacing={2}>
            <Tooltip label="Start new conversation">
              <IconButton
                icon={<FaCode />}
                aria-label="New chat"
                variant="ghost"
                colorScheme="green"
                onClick={handleNewChat}
                size="sm"
              />
            </Tooltip>
            <Tooltip label="Clear learning session">
              <IconButton
                icon={<FaTrash />}
                aria-label="Clear chat"
                variant="ghost"
                colorScheme="red"
                onClick={handleClearChat}
                size="sm"
              />
            </Tooltip>
          </HStack>
        </Flex>

        {/* Messages Container */}
        <Flex
          flex="1"
          overflowY="auto"
          p={4}
          direction="column"
          gap={4}
          bgImage="url('data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ED8936\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E')"
        >
          {messages.map((msg, index) => (
            <Box
              key={`${msg.role}-${msg.timestamp}-${index}`}
              alignSelf={msg.role === 'user' ? 'flex-end' : 'flex-start'}
              maxW="70%"
            >
              <HStack spacing={2} align="start" mb={1}>
                {msg.role === 'assistant' && (
                  <Avatar 
                    icon={<FaRobot fontSize="1rem" />} 
                    bg="orange.500" 
                    color="white"
                    size="xs"
                  />
                )}
                <Box
                  bg={msg.role === 'user' ? userBubbleBg : botBubbleBg}
                  color={msg.role === 'user' ? userTextColor : botTextColor}
                  p={3}
                  borderRadius="lg"
                  boxShadow="sm"
                  position="relative"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: '10px',
                    [msg.role === 'user' ? 'right' : 'left']: '-8px',
                    width: '0',
                    height: '0',
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    [msg.role === 'user' 
                      ? 'borderLeft' 
                      : 'borderRight']: `8px solid ${msg.role === 'user' ? userBubbleBg : botBubbleBg}`,
                  }}
                >
                  {renderMessage(msg)}
                </Box>
                {msg.role === 'user' && (
                  <Avatar 
                    icon={<FaUser fontSize="1rem" />} 
                    bg="blue.500" 
                    color="white"
                    size="xs"
                  />
                )}
              </HStack>
              <Text fontSize="xs" color="gray.500" alignSelf={msg.role === 'user' ? 'flex-end' : 'flex-start'} mt={1}>
                {formatTimestamp(msg.timestamp)}
              </Text>
            </Box>
          ))}
          {isLoading && (
            <Box alignSelf="flex-start" maxW="70%">
              <HStack spacing={2} align="start">
                <Avatar 
                  icon={<FaRobot fontSize="1rem" />} 
                  bg="orange.500" 
                  color="white"
                  size="xs"
                />
                <Box
                  bg={botBubbleBg}
                  color={botTextColor}
                  p={3}
                  borderRadius="lg"
                  boxShadow="sm"
                  position="relative"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: '10px',
                    left: '-8px',
                    width: '0',
                    height: '0',
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    borderRight: `8px solid ${botBubbleBg}`,
                  }}
                >
                  <HStack spacing={2}>
                    <Box
                      w="8px"
                      h="8px"
                      borderRadius="full"
                      bg="orange.500"
                      animation={`${pulseAnimation} 1s infinite`}
                    />
                    <Box
                      w="8px"
                      h="8px"
                      borderRadius="full"
                      bg="orange.500"
                      animation={`${pulseAnimation} 1s infinite 0.2s`}
                    />
                    <Box
                      w="8px"
                      h="8px"
                      borderRadius="full"
                      bg="orange.500"
                      animation={`${pulseAnimation} 1s infinite 0.4s`}
                    />
                  </HStack>
                </Box>
              </HStack>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Flex>

        {/* Input Area */}
        <Box 
          p={4} 
          borderTopWidth="1px" 
          borderColor={borderColor}
          bg={headerBg}
          position="sticky"
          bottom={0}
          zIndex={10}
          boxShadow="0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)"
        >
          <HStack>
            <InputGroup>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                size="lg"
                bg={inputBg}
                border="none"
                borderRadius="full"
                _focus={{
                  boxShadow: '0 0 0 1px var(--chakra-colors-orange-500)',
                  border: 'none',
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <InputRightElement h="full">
                <HStack spacing={2} pr={2}>
                  <Tooltip label="Attach files">
                    <IconButton
                      icon={<FaFileUpload />}
                      aria-label="Attach files"
                      variant="ghost"
                      colorScheme="orange"
                      size="md"
                      onClick={() => fileInputRef.current.click()}
                      _hover={{ transform: 'scale(1.1)' }}
                      transition="all 0.2s"
                    />
                  </Tooltip>
                  <Tooltip label="Send message">
                    <IconButton
                      colorScheme="orange"
                      aria-label="Send message"
                      icon={<FaPaperPlane />}
                      size="md"
                      onClick={handleSendMessage}
                      isLoading={isLoading}
                      _hover={{ transform: 'scale(1.1) rotate(15deg)' }}
                      transition="all 0.2s"
                    />
                  </Tooltip>
                </HStack>
              </InputRightElement>
            </InputGroup>
          </HStack>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </Box>
      </Box>

      {/* File Upload Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="xl">
          <ModalHeader borderBottomWidth="1px">Upload File</ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <VStack spacing={4} align="stretch">
              <Box 
                p={4} 
                borderWidth="1px" 
                borderRadius="lg"
                bg={codeBgColor}
                transition="all 0.2s"
                _hover={{ boxShadow: 'md' }}
              >
                <HStack spacing={3}>
                  {selectedFile?.type.startsWith('image/') ? (
                    <FaImage size={24} color="orange" />
                  ) : selectedFile?.type.includes('code') || selectedFile?.name.endsWith('.js') || selectedFile?.name.endsWith('.py') ? (
                    <FaFileCode size={24} color="orange" />
                  ) : (
                    <FaFile size={24} color="orange" />
                  )}
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="medium">{selectedFile?.name}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {(selectedFile?.size / 1024).toFixed(1)} KB
                    </Text>
                  </VStack>
                </HStack>
                {previewUrl && (
                  <Box mt={4} borderRadius="lg" overflow="hidden" boxShadow="sm">
                    <img 
                      src={previewUrl} 
                      alt={selectedFile?.name} 
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} 
                    />
                  </Box>
                )}
              </Box>
              <Button 
                colorScheme="orange" 
                onClick={handleFileUpload} 
                isLoading={isLoading}
                size="lg"
                borderRadius="full"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                transition="all 0.2s"
              >
                Upload and Send
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Chatbot;
