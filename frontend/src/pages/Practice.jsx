import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  useColorModeValue,
  Button,
  Textarea,
  Code,
  Badge,
  HStack,
  Icon,
  Flex,
  Select,
  useToast,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { FaLightbulb, FaCheck, FaTimes, FaCode, FaRobot, FaPaperPlane } from 'react-icons/fa';
import { keyframes } from '@emotion/react';
import config from '@/config';
import { sendChatMessage } from '../services/api';

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

const ProblemCard = ({ title, description, difficulty, category, onSelect }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'Easy':
        return 'green';
      case 'Medium':
        return 'orange';
      case 'Hard':
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
      cursor="pointer"
      onClick={onSelect}
    >
      <VStack align="stretch" spacing={4}>
        <Heading size="md">{title}</Heading>
        <Text color="gray.600">{description}</Text>
        <HStack spacing={2}>
          <Badge colorScheme={getDifficultyColor()}>{difficulty}</Badge>
          <Badge colorScheme="blue">{category}</Badge>
        </HStack>
      </VStack>
    </Box>
  );
};

const Practice = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [solution, setSolution] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const problems = [
    {
      id: 1,
      title: 'Sum of Two Numbers',
      description: 'Write a function that takes two numbers as input and returns their sum.',
      difficulty: 'Easy',
      category: 'Functions',
      hint: 'Think about using the + operator',
      solution: 'def add_numbers(a, b):\n    return a + b',
    },
    {
      id: 2,
      title: 'Find Maximum',
      description: 'Write a function that finds the maximum number in a list.',
      difficulty: 'Medium',
      category: 'Algorithms',
      hint: 'You can use a loop or the max() function',
      solution: 'def find_max(numbers):\n    return max(numbers)',
    },
    // Add more problems here
  ];

  const handleSubmit = () => {
    // Here you would typically send the solution to your backend for evaluation
    toast({
      title: 'Solution Submitted',
      description: 'Your solution has been submitted for evaluation',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: chatInput,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, newMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const data = await sendChatMessage(newMessage.text);

      const botMessage = {
        id: Date.now() + 1,
        text: data.response,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="xl" mb={2}>
              Practice Problems
            </Heading>
            <Text color="gray.600">
              Solve problems and get AI-guided explanations
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            <Box>
              <Heading size="md" mb={4}>
                Available Problems
              </Heading>
              <VStack spacing={4} align="stretch">
                {problems.map((problem) => (
                  <ProblemCard
                    key={problem.id}
                    title={problem.title}
                    description={problem.description}
                    difficulty={problem.difficulty}
                    category={problem.category}
                    onSelect={() => setSelectedProblem(problem)}
                  />
                ))}
              </VStack>
            </Box>

            <Box>
              {selectedProblem ? (
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" mb={2}>
                      {selectedProblem.title}
                    </Heading>
                    <Text color="gray.600" mb={4}>
                      {selectedProblem.description}
                    </Text>
                    <HStack spacing={2} mb={4}>
                      <Badge colorScheme="blue">{selectedProblem.category}</Badge>
                      <Badge colorScheme="orange">{selectedProblem.difficulty}</Badge>
                    </HStack>
                  </Box>

                  <Box>
                    <Text mb={2} fontWeight="medium">
                      Your Solution:
                    </Text>
                    <Textarea
                      value={solution}
                      onChange={(e) => setSolution(e.target.value)}
                      placeholder="Write your solution here..."
                      minH="200px"
                      fontFamily="monospace"
                    />
                  </Box>

                  <HStack spacing={4}>
                    <Button
                      leftIcon={<FaLightbulb />}
                      onClick={() => setShowHint(!showHint)}
                      variant="outline"
                    >
                      {showHint ? 'Hide Hint' : 'Show Hint'}
                    </Button>
                    <Button
                      colorScheme="orange"
                      onClick={handleSubmit}
                    >
                      Submit Solution
                    </Button>
                    <Button
                      leftIcon={<FaRobot />}
                      onClick={onOpen}
                      variant="outline"
                    >
                      Ask AI Tutor
                    </Button>
                  </HStack>

                  {showHint && (
                    <Box
                      p={4}
                      bg={useColorModeValue('orange.50', 'orange.900')}
                      borderRadius="md"
                    >
                      <Text fontWeight="medium" mb={2}>
                        Hint:
                      </Text>
                      <Text>{selectedProblem.hint}</Text>
                    </Box>
                  )}
                </VStack>
              ) : (
                <Box
                  p={8}
                  bg={useColorModeValue('white', 'gray.700')}
                  borderRadius="lg"
                  textAlign="center"
                >
                  <Icon as={FaCode} w={8} h={8} color="orange.500" mb={4} />
                  <Text>Select a problem to start practicing</Text>
                </Box>
              )}
            </Box>
          </SimpleGrid>
        </VStack>
      </Container>

      {/* AI Tutor Chat Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <HStack>
              <Icon as={FaRobot} color="orange.500" />
              <Text>AI Tutor</Text>
            </HStack>
          </DrawerHeader>

          <DrawerBody>
            <VStack h="100%" spacing={4}>
              <Box flex="1" w="100%" overflowY="auto" p={4}>
                {chatMessages.map((msg) => (
                  <Box
                    key={msg.id}
                    mb={4}
                    alignSelf={msg.sender === 'user' ? 'flex-end' : 'flex-start'}
                    maxW="80%"
                    animation={`${fadeIn} 0.3s ease-out`}
                  >
                    <Box
                      p={3}
                      borderRadius="lg"
                      bg={msg.sender === 'user' ? 'orange.500' : 'gray.100'}
                      color={msg.sender === 'user' ? 'white' : 'gray.800'}
                    >
                      <Text>{msg.text}</Text>
                    </Box>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </Text>
                  </Box>
                ))}
              </Box>

              <Box w="100%" p={4} borderTopWidth="1px">
                <InputGroup>
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask the AI tutor for help..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  />
                  <InputRightElement>
                    <IconButton
                      icon={<FaPaperPlane />}
                      colorScheme="orange"
                      isLoading={isChatLoading}
                      onClick={handleSendChatMessage}
                      aria-label="Send message"
                    />
                  </InputRightElement>
                </InputGroup>
              </Box>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Practice; 