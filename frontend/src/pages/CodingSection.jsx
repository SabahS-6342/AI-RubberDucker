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
                  aria-label="Send message"
                  icon={<ChatIcon />}
                  colorScheme="orange"
                  onClick={handleSendMessage}
                />
              </HStack>
            </VStack>
          </Box>

          {/* Coding Section */}
          {showCoding && (
            <Box flex={3} w="100%">
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between">
                  <Select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    w="200px"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </Select>
                  <Button
                    leftIcon={<FaPlay />}
                    colorScheme="green"
                    onClick={analyzeCode}
                    isLoading={isAnalyzing}
                  >
                    Run Code
                  </Button>
                </HStack>

                <Textarea
                  ref={codeEditorRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Write your code here..."
                  fontFamily="monospace"
                  minH="300px"
                  p={4}
                  borderRadius="md"
                  borderColor={borderColor}
                />

                {feedback && (
                  <Box
                    borderWidth="1px"
                    borderRadius="lg"
                    p={4}
                    bg={feedback.status === 'success' ? 'green.50' : 'red.50'}
                  >
                    <VStack align="stretch" spacing={3}>
                      <Heading size="md">{feedback.message}</Heading>
                      <Text>{feedback.details}</Text>
                      
                      {feedback.suggestions && (
                        <Box>
                          <Text fontWeight="bold">Suggestions:</Text>
                          <List spacing={2}>
                            {feedback.suggestions.map((suggestion, index) => (
                              <ListItem key={index}>
                                <ListIcon as={FaLightbulb} color="orange.500" />
                                {suggestion}
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}

                      {codeMetrics && (
                        <Box>
                          <Text fontWeight="bold">Code Metrics:</Text>
                          <HStack spacing={4}>
                            <Badge colorScheme="blue">Lines: {codeMetrics.lines}</Badge>
                            <Badge colorScheme="green">Functions: {codeMetrics.functions}</Badge>
                            <Badge colorScheme="purple">Complexity: {codeMetrics.complexity}</Badge>
                            <Badge colorScheme="orange">
                              Time: {codeMetrics.executionTime.toFixed(2)}ms
                            </Badge>
                          </HStack>
                        </Box>
                      )}
                    </VStack>
                  </Box>
                )}
              </VStack>
            </Box>
          )}
        </Flex>

        {/* Exercise Drawer */}
        <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Available Exercises</DrawerHeader>
            <DrawerBody>
              <VStack spacing={4} align="stretch">
                {codingExercises.map((exercise) => (
                  <Box
                    key={exercise.id}
                    p={4}
                    borderWidth="1px"
                    borderRadius="md"
                    cursor="pointer"
                    onClick={() => handleExerciseSelect(exercise)}
                    _hover={{ bg: 'gray.50' }}
                  >
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Heading size="sm">{exercise.title}</Heading>
                        <Badge colorScheme={
                          exercise.difficulty === 'Easy' ? 'green' :
                          exercise.difficulty === 'Medium' ? 'orange' : 'red'
                        }>
                          {exercise.difficulty}
                        </Badge>
                      </VStack>
                      <Icon as={FaCode} />
                    </HStack>
                    <Text mt={2} fontSize="sm" color="gray.600">
                      {exercise.description}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Exercise Selection Button */}
        <Button
          leftIcon={<FaCode />}
          colorScheme="orange"
          onClick={onOpen}
          position="fixed"
          bottom={4}
          right={4}
        >
          Choose Exercise
        </Button>
      </VStack>
    </Box>
  )
}

export default CodingSection 