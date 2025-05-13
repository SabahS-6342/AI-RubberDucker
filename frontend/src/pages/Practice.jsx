import React, { useState, useRef, useEffect } from 'react';
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
  Collapse,
  List,
  ListItem,
  ListIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { 
  FaLightbulb, 
  FaCheck, 
  FaTimes, 
  FaCode, 
  FaRobot, 
  FaPaperPlane,
  FaHistory,
  FaPlay,
  FaRedo,
  FaUpload,
} from 'react-icons/fa';
import { keyframes } from '@emotion/react';
import config from '@/config';
import { sendChatMessage, saveCodingExercise, getCodingExercises, uploadCodingExerciseFile } from '../services/api';
import { submitCode, getSubmissionHistory } from '../services/codeService';

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
  const [language, setLanguage] = useState('python');
  const [feedback, setFeedback] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [codeHistory, setCodeHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [codeMetrics, setCodeMetrics] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedProblem, setUploadedProblem] = useState(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [pastedExercise, setPastedExercise] = useState('');
  const [uploadMethod, setUploadMethod] = useState('paste'); // 'paste' or 'file'
  const [isLoading, setIsLoading] = useState(false);
  const [customExercises, setCustomExercises] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState([]);

  const problems = [
    {
      id: "1",
      title: 'Sum of Two Numbers',
      description: 'Write a function that takes two numbers as input and returns their sum.',
      difficulty: 'Easy',
      category: 'Functions',
      hint: 'Think about using the + operator',
      solution: 'def add_numbers(a, b):\n    return a + b',
      testInput: '5 3',
      expectedOutput: '8'
    },
    {
      id: "2",
      title: 'Find Maximum',
      description: 'Write a function that finds the maximum number in a list.',
      difficulty: 'Medium',
      category: 'Algorithms',
      hint: 'You can use a loop or the max() function',
      solution: 'def find_max(numbers):\n    return max(numbers)',
      testInput: '[1, 5, 3, 9, 2]',
      expectedOutput: '9'
    },
    {
      id: "3",
      title: 'Reverse String',
      description: 'Write a function that reverses a string.',
      difficulty: 'Easy',
      category: 'Strings',
      hint: 'You can use string slicing or a loop',
      solution: 'def reverse_string(s):\n    return s[::-1]',
      testInput: 'hello',
      expectedOutput: 'olleh'
    }
  ];

  useEffect(() => {
    fetchCustomExercises();
  }, []);

  const fetchCustomExercises = async () => {
    try {
      const exercises = await getCodingExercises();
      setCustomExercises(exercises);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch custom exercises',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type === 'text/plain') {
        setUploadedFile(file);
        setIsProcessingFile(true);

        try {
          // Upload file to server
          const uploadedExercise = await uploadCodingExerciseFile(file);
          
          const newProblem = {
            id: uploadedExercise.id,
            title: uploadedExercise.title || file.name.split('.')[0],
            description: uploadedExercise.content,
            difficulty: 'Custom',
            category: 'Uploaded',
            hint: 'This is a custom problem. Use the AI tutor for guidance.',
            solution: '',
          };

          setUploadedProblem(newProblem);
          setSelectedProblem(newProblem);
          setCustomExercises(prev => [...prev, newProblem]);
          
          toast({
            title: 'File uploaded',
            description: 'Your problem has been uploaded successfully',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } catch (error) {
          toast({
            title: 'Error processing file',
            description: error.message,
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        } finally {
          setIsProcessingFile(false);
        }
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF or text file',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handlePasteExercise = async () => {
    if (!pastedExercise.trim()) {
      toast({
        title: 'Empty exercise',
        description: 'Please paste your coding exercise first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Save exercise to database
      const savedExercise = await saveCodingExercise({
        title: 'Custom Exercise',
        content: pastedExercise,
        difficulty: 'Custom',
        category: 'Uploaded',
      });

      const newProblem = {
        id: savedExercise.id,
        title: savedExercise.title,
        description: savedExercise.content,
        difficulty: 'Custom',
        category: 'Uploaded',
        hint: 'This is a custom problem. Use the AI tutor for guidance.',
        solution: '',
      };

      setUploadedProblem(newProblem);
      setSelectedProblem(newProblem);
      setCustomExercises(prev => [...prev, newProblem]);
      
      toast({
        title: 'Exercise added',
        description: 'Your exercise has been added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!solution.trim()) {
        toast({
            title: 'Please enter your solution',
            status: 'warning',
            duration: 3000,
            isClosable: true,
        });
        return;
    }

    try {
        setIsSubmitting(true);
        
        // Get test cases from the selected problem or use defaults
        const testInput = selectedProblem?.testInput || 'hello';
        const expectedOutput = selectedProblem?.expectedOutput || 'olleh';

        // Map language to Judge0 language ID
        const languageIdMap = {
            'python': 71,
            'javascript': 63,
            'java': 62,
            'cpp': 54,
            'c': 50,
            'go': 60,
            'rust': 73,
            'ruby': 72,
            'php': 68,
            'swift': 83,
            'kotlin': 78,
            'typescript': 74
        };

        const languageId = languageIdMap[language];
        if (!languageId) {
            toast({
                title: 'Invalid language',
                description: 'Please select a valid programming language',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        const result = await submitCode({
            code: solution.trim(),
            language_id: languageId,
            stdin: testInput.trim()
        });

        // Update feedback state
        setFeedback({
            passed: result.status?.id === 3, // 3 is "Accepted" in Judge0
            message: result.status?.description || 'Execution completed',
            output: result.stdout || '',
            expected: expectedOutput,
            stderr: result.stderr || '',
            compile_output: result.compile_output || '',
            time: result.time,
            memory: result.memory
        });

        // Show success/error toast
        toast({
            title: result.status?.id === 3 ? "Success!" : "Test Failed",
            description: result.status?.description || 'Execution completed',
            status: result.status?.id === 3 ? "success" : "error",
            duration: 5000,
            isClosable: true,
        });

        // Add to history
        setSubmissionHistory(prev => [{
            id: Date.now().toString(),
            code: solution,
            language: language,
            status: result.status?.id === 3 ? "success" : "failed",
            output: result.stdout || '',
            error: result.stderr || result.compile_output || '',
            time: result.time,
            memory: result.memory,
            timestamp: new Date().toISOString()
        }, ...prev]);

    } catch (error) {
        toast({
            title: "Error",
            description: error.message,
            status: "error",
            duration: 5000,
            isClosable: true,
        });
    } finally {
        setIsSubmitting(false);
    }
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

          <Tabs variant="enclosed" colorScheme="orange">
            <TabList>
              <Tab>Choose Problem</Tab>
              <Tab>Upload Problem</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
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
                </SimpleGrid>
              </TabPanel>

              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <HStack spacing={4} mb={4}>
                    <Button
                      variant={uploadMethod === 'paste' ? 'solid' : 'outline'}
                      colorScheme="orange"
                      onClick={() => setUploadMethod('paste')}
                      leftIcon={<Icon as={FaCode} />}
                    >
                      Paste Exercise
                    </Button>
                    <Button
                      variant={uploadMethod === 'file' ? 'solid' : 'outline'}
                      colorScheme="orange"
                      onClick={() => setUploadMethod('file')}
                      leftIcon={<Icon as={FaUpload} />}
                    >
                      Upload File
                    </Button>
                  </HStack>

                  {uploadMethod === 'paste' ? (
                    <Box>
                      <Text mb={2} fontWeight="medium">
                        Paste your coding exercise here:
                      </Text>
                      <Textarea
                        value={pastedExercise}
                        onChange={(e) => setPastedExercise(e.target.value)}
                        placeholder="Paste your coding exercise here..."
                        minH="200px"
                        mb={4}
                      />
                      <Button
                        colorScheme="orange"
                        onClick={handlePasteExercise}
                        isLoading={isLoading}
                      >
                        Add Exercise
                      </Button>
                    </Box>
                  ) : (
                    <Box
                      p={6}
                      borderWidth="2px"
                      borderStyle="dashed"
                      borderRadius="lg"
                      textAlign="center"
                      cursor="pointer"
                      onClick={() => fileInputRef.current?.click()}
                      _hover={{ borderColor: 'orange.400' }}
                      position="relative"
                    >
                      <Input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".pdf,.txt"
                        display="none"
                      />
                      <Icon as={FaUpload} boxSize={8} color="gray.400" mb={4} />
                      <Text>Click to upload a problem (PDF or text file)</Text>
                      <Text fontSize="sm" color="gray.500" mt={2}>
                        Upload your own coding exercise and get AI-powered feedback
                      </Text>
                    </Box>
                  )}

                  {isProcessingFile && (
                    <Box p={4} bg="white" borderRadius="md" shadow="sm">
                      <Text>Processing your file...</Text>
                    </Box>
                  )}

                  {(uploadedFile || pastedExercise) && !isProcessingFile && (
                    <Box p={4} bg="white" borderRadius="md" shadow="sm">
                      <VStack align="stretch" spacing={2}>
                        {uploadedFile && (
                          <HStack justify="space-between">
                            <Text fontWeight="medium">Uploaded file:</Text>
                            <Text>{uploadedFile.name}</Text>
                          </HStack>
                        )}
                        <Button
                          size="sm"
                          colorScheme="orange"
                          variant="outline"
                          onClick={() => {
                            setUploadedFile(null);
                            setUploadedProblem(null);
                            setSelectedProblem(null);
                            setPastedExercise('');
                          }}
                        >
                          Remove {uploadMethod === 'paste' ? 'Exercise' : 'File'}
                        </Button>
                      </VStack>
                    </Box>
                  )}

                  {/* Display custom exercises */}
                  {customExercises.length > 0 && (
                    <Box mt={6}>
                      <Heading size="md" mb={4}>
                        Your Custom Exercises
                      </Heading>
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                        {customExercises.map((exercise) => (
                          <ProblemCard
                            key={exercise.id}
                            title={exercise.title}
                            description={exercise.description}
                            difficulty={exercise.difficulty}
                            category={exercise.category}
                            onSelect={() => setSelectedProblem(exercise)}
                          />
                        ))}
                      </SimpleGrid>
                    </Box>
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>

          {(selectedProblem || uploadedProblem) && (
            <Box
              p={6}
              bg="white"
              borderRadius="lg"
              boxShadow="md"
              animation={`${fadeIn} 0.3s ease-out`}
            >
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" mb={2}>
                    {selectedProblem?.title || uploadedProblem?.title}
                  </Heading>
                  <Text color="gray.600" whiteSpace="pre-wrap">
                    {selectedProblem?.description || uploadedProblem?.description}
                  </Text>
                  <HStack spacing={2} mt={2}>
                    <Badge colorScheme={selectedProblem?.difficulty === 'Easy' ? 'green' : 'orange'}>
                      {selectedProblem?.difficulty || uploadedProblem?.difficulty}
                    </Badge>
                    <Badge colorScheme="blue">{selectedProblem?.category || uploadedProblem?.category}</Badge>
                  </HStack>
                </Box>

                <Box>
                  <Select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    mb={4}
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </Select>

                  <Textarea
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="Write your solution here..."
                    minH="200px"
                    fontFamily="monospace"
                    mb={4}
                  />

                  <HStack spacing={4}>
                    <Button
                      leftIcon={<Icon as={FaPlay} />}
                      colorScheme="orange"
                      onClick={handleSubmit}
                      isLoading={isSubmitting}
                    >
                      Submit Solution
                    </Button>
                    <Button
                      leftIcon={<Icon as={FaLightbulb} />}
                      variant="outline"
                      onClick={() => setShowHint(!showHint)}
                    >
                      {showHint ? 'Hide Hint' : 'Show Hint'}
                    </Button>
                    <Button
                      leftIcon={<Icon as={FaRobot} />}
                      variant="outline"
                      onClick={onOpen}
                    >
                      Ask AI Tutor
                    </Button>
                  </HStack>
                </Box>

                <Collapse in={showHint}>
                  <Box p={4} bg="orange.50" borderRadius="md">
                    <Text color="orange.800">{selectedProblem?.hint || uploadedProblem?.hint}</Text>
                  </Box>
                </Collapse>

                {feedback && (
                  <Box
                    p={4}
                    bg={feedback.passed ? 'green.50' : 'red.50'}
                    borderRadius="md"
                    animation={`${fadeIn} 0.3s ease-out`}
                  >
                    <HStack spacing={2} mb={2}>
                      <Icon
                        as={feedback.passed ? FaCheck : FaTimes}
                        color={feedback.passed ? 'green.500' : 'red.500'}
                      />
                      <Text
                        color={feedback.passed ? 'green.800' : 'red.800'}
                        fontWeight="medium"
                      >
                        {feedback.message}
                      </Text>
                    </HStack>
                  </Box>
                )}

                {submissionHistory.length > 0 && (
                  <Box>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Icon as={FaHistory} />}
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      {showHistory ? 'Hide History' : 'Show History'}
                    </Button>
                    <Collapse in={showHistory}>
                      <Box mt={4}>
                        {submissionHistory.map((entry, index) => (
                          <Box
                            key={index}
                            p={4}
                            bg="gray.50"
                            borderRadius="md"
                            mb={2}
                          >
                            <Text fontSize="sm" color="gray.500">
                              {new Date(entry.timestamp).toLocaleString()}
                            </Text>
                            <Code p={2} mt={2} display="block">
                              {entry.code}
                            </Code>
                          </Box>
                        ))}
                      </Box>
                    </Collapse>
                  </Box>
                )}
              </VStack>
            </Box>
          )}
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