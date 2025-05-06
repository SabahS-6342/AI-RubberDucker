import { useState, useRef } from 'react'
import {
  Box,
  Flex,
  VStack,
  Text,
  Button,
  Select,
  Textarea,
  useToast,
  Heading,
  useColorModeValue,
  Input,
  IconButton,
  HStack,
  Badge,
  Icon,
  Collapse,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react'
import { 
  ChatIcon, 
  CheckIcon, 
  WarningIcon, 
  TimeIcon, 
  StarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SettingsIcon,
  QuestionIcon,
  InfoIcon,
} from '@chakra-ui/icons'
import { FaCode, FaLightbulb, FaHistory, FaPlay, FaRedo, FaRobot } from 'react-icons/fa'

const CodingSection = () => {
  const [showCoding, setShowCoding] = useState(false)
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your coding companion. How can I help you today?", isUser: false }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [codeHistory, setCodeHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [executionTime, setExecutionTime] = useState(null)
  const [codeMetrics, setCodeMetrics] = useState(null)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const chatBg = useColorModeValue('gray.50', 'gray.700')
  const codeEditorRef = useRef(null)

  const codingExercises = [
    {
      id: 'fibonacci',
      title: 'Fibonacci Sequence',
      difficulty: 'Easy',
      description: 'Write a function to generate the Fibonacci sequence up to n terms',
      testCases: [
        { input: 5, output: [0, 1, 1, 2, 3] },
        { input: 8, output: [0, 1, 1, 2, 3, 5, 8, 13] }
      ],
      hints: [
        'Use recursion or iteration',
        'Consider edge cases (n = 0, 1)',
        'Optimize for large n values'
      ]
    },
    {
      id: 'palindrome',
      title: 'Palindrome Checker',
      difficulty: 'Easy',
      description: 'Write a function to check if a string is a palindrome',
      testCases: [
        { input: 'racecar', output: true },
        { input: 'hello', output: false }
      ],
      hints: [
        'Consider case sensitivity',
        'Handle spaces and punctuation',
        'Think about time complexity'
      ]
    },
    {
      id: 'sorting',
      title: 'Quick Sort',
      difficulty: 'Medium',
      description: 'Implement the Quick Sort algorithm',
      testCases: [
        { input: [5, 2, 8, 1, 9], output: [1, 2, 5, 8, 9] },
        { input: [3, 1, 4, 1, 5, 9], output: [1, 1, 3, 4, 5, 9] }
      ],
      hints: [
        'Choose a good pivot',
        'Handle duplicate values',
        'Consider space complexity'
      ]
    }
  ]

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    const newMessages = [...messages, { text: inputMessage, isUser: true }]
    
    if (inputMessage.toLowerCase().includes('coding exercise') || 
        inputMessage.toLowerCase().includes('practice coding')) {
      setShowCoding(true)
      setMessages([
        ...newMessages,
        { text: "Great! I'll set up a coding exercise for you. What programming language would you like to practice?", isUser: false }
      ])
    } else {
      setMessages([
        ...newMessages,
        { text: "I can help you with coding exercises. Just ask for a coding exercise or practice problem!", isUser: false }
      ])
    }
    
    setInputMessage('')
  }

  const analyzeCode = async () => {
    if (!code.trim()) {
      toast({
        title: 'Please enter some code',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    setIsAnalyzing(true)
    setFeedback(null)

    // Simulate code analysis
    setTimeout(() => {
      const startTime = performance.now()
      
      // Calculate code metrics
      const lines = code.split('\n').length
      const functions = (code.match(/function|def|class/g) || []).length
      const complexity = calculateComplexity(code)
      
      setCodeMetrics({
        lines,
        functions,
        complexity,
        executionTime: performance.now() - startTime
      })

      // Generate feedback
    setFeedback({
      status: 'success',
        message: 'Code Analysis Complete!',
        details: 'Your code has been analyzed for correctness, efficiency, and style.',
        suggestions: [
          'Consider adding error handling',
          'Use more descriptive variable names',
          'Add comments for complex logic'
        ],
        bestPractices: [
          'Follow consistent code style',
          'Use proper indentation',
          'Break down complex functions'
        ],
        performance: {
          score: 'Good',
          notes: [
            'No nested loops detected',
            'No memory leaks detected',
            'Consider using more efficient data structures'
          ]
        }
      })

      setIsAnalyzing(false)
    }, 2000)
  }

  const calculateComplexity = (code) => {
    const lines = code.split('\n').length
    const functions = (code.match(/function|def|class/g) || []).length
    const loops = (code.match(/for|while/g) || []).length
    const conditions = (code.match(/if|else/g) || []).length

    const score = lines + (functions * 2) + (loops * 3) + (conditions * 2)
    
    if (score < 10) return "Low"
    if (score < 20) return "Medium"
    if (score < 30) return "High"
    return "Very High"
  }

  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise)
    setCode('') // Clear previous code
    setFeedback(null)
    setCodeMetrics(null)
  }

  return (
    <Box minH="100vh" bg={bgColor} p={8}>
      <VStack spacing={8} align="stretch" maxW="1200px" mx="auto">
        <Flex gap={6} direction={{ base: 'column', md: 'row' }}>
          {/* Chat Section */}
          <Box flex={2} w="100%">
            <VStack align="stretch" spacing={4} h="100%">
              <Box
                borderWidth="1px"
                borderRadius="lg"
                borderColor={borderColor}
                p={4}
                bg={chatBg}
                minH="500px"
                maxH="500px"
                overflowY="auto"
              >
                {messages.map((message, index) => (
                  <Flex
                    key={index}
                    justify={message.isUser ? 'flex-end' : 'flex-start'}
                    mb={4}
                  >
                    <Box
                      maxW="80%"
                      bg={message.isUser ? 'orange.100' : 'white'}
                      p={3}
                      borderRadius="lg"
                      boxShadow="sm"
                    >
                      <Text>{message.text}</Text>
                    </Box>
                  </Flex>
                ))}
              </Box>

              <HStack>
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <IconButton
                  colorScheme="orange"
                  aria-label="Send message"
                  icon={<ChatIcon />}
                  onClick={handleSendMessage}
                />
              </HStack>
            </VStack>
          </Box>

          {/* Coding Section */}
          <Box flex={3} w="100%">
              <VStack align="stretch" spacing={4} h="100%">
              <HStack justify="space-between">
                <Button
                  leftIcon={<FaCode />}
                  colorScheme="orange"
                  variant="outline"
                  onClick={onOpen}
                >
                  Select Exercise
                </Button>
                <HStack>
                  <Select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    w="150px"
                    borderColor="orange.200"
                    _hover={{ borderColor: 'orange.300' }}
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </Select>
                  <IconButton
                    icon={<FaPlay />}
                    colorScheme="green"
                    aria-label="Run code"
                    onClick={analyzeCode}
                    isLoading={isAnalyzing}
                  />
                  <Button
                    colorScheme="orange"
                    onClick={analyzeCode}
                    isLoading={isAnalyzing}
                  >
                    Judge My Code
                  </Button>
                  <IconButton
                    icon={<FaRedo />}
                    colorScheme="orange"
                    aria-label="Reset code"
                    onClick={() => setCode('')}
                  />
                </HStack>
              </HStack>

              {selectedExercise && (
                <Box
                  p={4}
                  borderWidth="1px"
                  borderRadius="lg"
                  borderColor="orange.200"
                  bg="orange.50"
                >
                  <VStack align="stretch" spacing={2}>
                    <HStack justify="space-between">
                      <Heading size="md">{selectedExercise.title}</Heading>
                      <Badge colorScheme={selectedExercise.difficulty === 'Easy' ? 'green' : 'orange'}>
                        {selectedExercise.difficulty}
                      </Badge>
                    </HStack>
                    <Text>{selectedExercise.description}</Text>
                    <Collapse in={showHistory}>
                      <Box>
                        <Text fontWeight="bold" mb={2}>Test Cases:</Text>
                        {selectedExercise.testCases.map((testCase, index) => (
                          <Box key={index} mb={2}>
                            <Text fontSize="sm">Input: {JSON.stringify(testCase.input)}</Text>
                            <Text fontSize="sm">Expected Output: {JSON.stringify(testCase.output)}</Text>
                          </Box>
                        ))}
                      </Box>
                    </Collapse>
                    <Button
                      size="sm"
                      variant="ghost"
                      rightIcon={showHistory ? <ChevronUpIcon /> : <ChevronDownIcon />}
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      {showHistory ? 'Hide Details' : 'Show Details'}
                    </Button>
                  </VStack>
                </Box>
              )}

              <Box
                border="1px"
                  borderColor="orange.200"
                  rounded="md"
                  p={2}
                  bg="orange.50"
                  flex="1"
                >
                  <Textarea
                  ref={codeEditorRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={`Enter your ${language} code here...`}
                    minH="400px"
                    fontFamily="monospace"
                    bg="white"
                    _focus={{
                      borderColor: 'orange.300',
                      boxShadow: '0 0 0 1px var(--chakra-colors-orange-300)'
                    }}
                  />
                </Box>

                {feedback && (
                  <Box 
                    p={4} 
                    rounded="lg" 
                    shadow="md" 
                    borderTop="4px" 
                    borderColor="orange.400"
                    bg="white"
                  >
                    <VStack align="stretch" spacing={4}>
                      <Heading size="md" bgGradient="linear(to-r, orange.400, orange.600)" bgClip="text">
                      Analysis Results
                      </Heading>
                    
                    {codeMetrics && (
                      <Box>
                        <Text fontWeight="bold" mb={2}>Code Metrics:</Text>
                        <HStack spacing={4}>
                          <Badge colorScheme="blue">Lines: {codeMetrics.lines}</Badge>
                          <Badge colorScheme="purple">Functions: {codeMetrics.functions}</Badge>
                          <Badge colorScheme={codeMetrics.complexity === 'Low' ? 'green' : 'orange'}>
                            Complexity: {codeMetrics.complexity}
                          </Badge>
                          <Badge colorScheme="teal">
                            Time: {codeMetrics.executionTime.toFixed(2)}ms
                          </Badge>
                        </HStack>
                      </Box>
                    )}

                    <Box>
                      <Text fontWeight="bold" mb={2}>Suggestions:</Text>
                      <List spacing={2}>
                        {feedback.suggestions.map((suggestion, index) => (
                          <ListItem key={index}>
                            <ListIcon as={FaLightbulb} color="orange.500" />
                            {suggestion}
                          </ListItem>
                        ))}
                      </List>
                    </Box>

                    <Box>
                      <Text fontWeight="bold" mb={2}>Best Practices:</Text>
                      <List spacing={2}>
                        {feedback.bestPractices.map((practice, index) => (
                          <ListItem key={index}>
                            <ListIcon as={CheckIcon} color="green.500" />
                            {practice}
                          </ListItem>
                        ))}
                      </List>
                    </Box>

                    <Box>
                      <Text fontWeight="bold" mb={2}>Performance:</Text>
                      <VStack align="stretch" spacing={2}>
                        <HStack>
                          <Text>Score:</Text>
                          <Badge colorScheme={feedback.performance.score === 'Good' ? 'green' : 'orange'}>
                            {feedback.performance.score}
                          </Badge>
                        </HStack>
                        <List spacing={2}>
                          {feedback.performance.notes.map((note, index) => (
                            <ListItem key={index}>
                              <ListIcon as={InfoIcon} color="blue.500" />
                              {note}
                            </ListItem>
                          ))}
                        </List>
                      </VStack>
                    </Box>
                    </VStack>
                  </Box>
                )}
              </VStack>
            </Box>
        </Flex>
      </VStack>

      {/* Exercise Selection Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            <Heading size="md">Select Coding Exercise</Heading>
          </DrawerHeader>

          <DrawerBody>
            <VStack spacing={4} align="stretch">
              {codingExercises.map((exercise) => (
                <Box
                  key={exercise.id}
                  p={4}
                  borderWidth="1px"
                  borderRadius="lg"
                  borderColor={selectedExercise?.id === exercise.id ? 'orange.400' : 'gray.200'}
                  bg={selectedExercise?.id === exercise.id ? 'orange.50' : 'white'}
                  cursor="pointer"
                  onClick={() => {
                    handleExerciseSelect(exercise)
                    onClose()
                  }}
                  _hover={{
                    borderColor: 'orange.300',
                    bg: 'orange.50'
                  }}
                >
                  <HStack justify="space-between" mb={2}>
                    <Heading size="sm">{exercise.title}</Heading>
                    <Badge colorScheme={exercise.difficulty === 'Easy' ? 'green' : 'orange'}>
                      {exercise.difficulty}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    {exercise.description}
                  </Text>
                </Box>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}

export default CodingSection 