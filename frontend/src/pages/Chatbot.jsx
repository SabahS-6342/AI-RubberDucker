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
import config from '../config';

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

const Chatbot = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    return savedMessages ? JSON.parse(savedMessages) : [{
      id: Date.now(),
      text: "👋 Hi! I'm your AI learning companion. I can help you understand complex topics, provide personalized explanations, and guide you through your learning journey. What would you like to learn about today?",
      sender: 'bot',
      timestamp: new Date().toISOString(),
    }];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [currentTopic, setCurrentTopic] = useState('');
  const [currentDifficulty, setCurrentDifficulty] = useState('');
  const [chatTitle, setChatTitle] = useState('AI Learning Tutor');
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

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

  // Update chat title based on current topic
  useEffect(() => {
    if (currentTopic) {
      setChatTitle(`Learning: ${currentTopic}`);
    } else {
      setChatTitle('AI Learning Tutor');
    }
  }, [currentTopic]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  const handleClearChat = () => {
    setMessages([]);
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
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      
      // Update the user message status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );

      // Add bot's response
      const botMessage = {
        id: Date.now() + 1,
        text: `I've received your file: ${selectedFile.name}. How can I help you with it?`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
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

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.CHAT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ 
          message: newMessage.text,
          topic: currentTopic,
          difficulty_level: currentDifficulty
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send message');
      }

      const data = await response.json();
      
      // Update the user message status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );

      // Add bot's response
      const botMessage = {
        id: Date.now() + 1,
        text: data.response,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        suggested_topics: data.suggested_topics,
        learning_resources: data.learning_resources
      };

      setMessages((prev) => [...prev, botMessage]);

      // Update current topic if suggested
      if (data.suggested_topics && data.suggested_topics.length > 0) {
        setCurrentTopic(data.suggested_topics[0]);
      }
    } catch (error) {
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
    }
  };

  const renderMessage = (msg) => {
    if (msg.file) {
      return (
        <VStack align="stretch" spacing={2}>
          <Text>{msg.text}</Text>
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

    const isCodeBlock = msg.text.includes('```');
    if (isCodeBlock) {
      const parts = msg.text.split('```');
      return (
        <VStack align="stretch" spacing={2}>
          {parts.map((part, index) => {
            if (index % 2 === 0) {
              return <Text key={index}>{part}</Text>;
            } else {
              return (
                <Box
                  key={index}
                  bg={codeBgColor}
                  p={4}
                  borderRadius="md"
                  overflowX="auto"
                  fontFamily="monospace"
                  fontSize="sm"
                  color={codeTextColor}
                  whiteSpace="pre-wrap"
                >
                  {part}
                </Box>
              );
            }
          })}
        </VStack>
      );
    }

    return (
      <VStack align="stretch" spacing={2}>
        <Text>{msg.text}</Text>
        
        {/* Learning Resources */}
        {msg.learning_resources && msg.learning_resources.length > 0 && (
          <Box
            p={3}
            bg={codeBgColor}
            borderRadius="md"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Text fontWeight="bold" mb={2}>Learning Resources:</Text>
            {msg.learning_resources.map((resource, index) => (
              <Box key={index} mb={2}>
                <Text fontWeight="medium">{resource.title}</Text>
                <Text fontSize="sm" color="gray.600">{resource.description}</Text>
                {resource.url && (
                  <Link href={resource.url} isExternal color="orange.500">
                    View Resource
                  </Link>
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* Suggested Topics */}
        {msg.suggested_topics && msg.suggested_topics.length > 0 && (
          <Box
            p={3}
            bg={codeBgColor}
            borderRadius="md"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Text fontWeight="bold" mb={2}>Suggested Topics:</Text>
            <HStack spacing={2} wrap="wrap">
              {msg.suggested_topics.map((topic, index) => (
                <Badge
                  key={index}
                  colorScheme="orange"
                  cursor="pointer"
                  onClick={() => {
                    setCurrentTopic(topic);
                    setMessage(`Tell me about ${topic}`);
                    handleSendMessage();
                  }}
                >
                  {topic}
                </Badge>
              ))}
            </HStack>
          </Box>
        )}
      </VStack>
    );
  };

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
          <Tooltip label="Clear learning session">
            <IconButton
              icon={<FaTrash />}
              aria-label="Clear chat"
              variant="ghost"
              colorScheme="red"
              onClick={() => {
                handleClearChat();
                setCurrentTopic('');
                setCurrentDifficulty('');
              }}
              size="sm"
            />
          </Tooltip>
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
              key={msg.id}
              alignSelf={msg.sender === 'user' ? 'flex-end' : 'flex-start'}
              maxW="70%"
              animation={`${fadeIn} 0.3s ease-out ${index * 0.1}s both`}
              opacity={0}
            >
              <HStack spacing={2} align="start" mb={1}>
                {msg.sender === 'bot' && (
                  <Avatar 
                    icon={<FaRobot fontSize="1rem" />} 
                    bg="orange.500" 
                    color="white"
                    size="xs"
                  />
                )}
                <Box
                  bg={msg.sender === 'user' ? userBubbleBg : botBubbleBg}
                  color={msg.sender === 'user' ? userTextColor : botTextColor}
                  p={3}
                  borderRadius="lg"
                  boxShadow="sm"
                  position="relative"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: '10px',
                    [msg.sender === 'user' ? 'right' : 'left']: '-8px',
                    width: '0',
                    height: '0',
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    [msg.sender === 'user' 
                      ? 'borderLeft' 
                      : 'borderRight']: `8px solid ${msg.sender === 'user' ? userBubbleBg : botBubbleBg}`,
                  }}
                >
                  {renderMessage(msg)}
                </Box>
                {msg.sender === 'user' && (
                  <Avatar 
                    icon={<FaUser fontSize="1rem" />} 
                    bg="blue.500" 
                    color="white"
                    size="xs"
                  />
                )}
              </HStack>
              <HStack
                mt={1}
                spacing={2}
                justify={msg.sender === 'user' ? 'flex-end' : 'flex-start'}
                pl={msg.sender === 'bot' ? 8 : 0}
                pr={msg.sender === 'user' ? 8 : 0}
              >
                <Text fontSize="xs" color="gray.500">
                  {formatTimestamp(msg.timestamp)}
                </Text>
                {msg.sender === 'user' && (
                  <Badge
                    colorScheme={
                      msg.status === 'sent'
                        ? 'green'
                        : msg.status === 'error'
                        ? 'red'
                        : 'yellow'
                    }
                    fontSize="xs"
                    px={1}
                    py={0}
                  >
                    {msg.status}
                  </Badge>
                )}
              </HStack>
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
