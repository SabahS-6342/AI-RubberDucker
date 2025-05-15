import React, { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';

// Dynamically import Monaco to prevent SSR issues

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
  Badge,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  useToast,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Spinner,
} from '@chakra-ui/react';
import { FaLightbulb, FaRobot, FaPaperPlane } from 'react-icons/fa';

const ProblemCard = ({ title, description, difficulty, category, onSelect }) => {
  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'Easy': return 'green';
      case 'Medium': return 'orange';
      case 'Hard': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box
      p={6}
      bg={useColorModeValue('white', 'gray.700')}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={useColorModeValue('gray.200', 'gray.600')}
      boxShadow="sm"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'md', borderColor: 'orange.300' }}
      transition="all 0.2s"
      cursor="pointer"
      onClick={onSelect}
    >
      <VStack align="start" spacing={3}>
        <Heading size="md">{title}</Heading>
        <Text fontSize="sm" color="gray.600">{description}</Text>
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
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
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
    starterCode: `def add_numbers(a, b):
    return a + b

if __name__ == "__main__":
    print(add_numbers(2, 3))  # Expected output: 5
`,
    testInput: '',              // For this problem, no stdin is needed
    expectedOutput: '5\n',      // Judge0 returns output with trailing newline
  },
  {
    id: 2,
    title: 'Find Maximum',
    description: 'Write a function that finds the maximum number in a list.',
    difficulty: 'Medium',
    category: 'Algorithms',
    hint: 'You can use a loop or the max() function',
    starterCode: `def find_max(numbers):
    return max(numbers)

if __name__ == "__main__":
    print(find_max([1, 5, 3, 9, 2]))  # Expected output: 9
`,
    testInput: '',             // No stdin needed, input is hardcoded in code
    expectedOutput: '9\n',     // Expected output from print statement
  },
];



  const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com/submissions';
  const JUDGE0_API_HOST = 'judge0-ce.p.rapidapi.com';
  const JUDGE0_API_KEY = '533563bab6msh2e2cde0557633c2p1eb952jsna3c6628b4534'; // Replace this

  const runCode = async () => {
    if (!solution.trim() || !selectedProblem) {
      toast({
        title: 'Missing Input',
        description: 'Please select a problem and write some code.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsRunning(true);
    setOutput('');

    try {
      const submission = {
        language_id: 71,
        source_code: solution,
        stdin: selectedProblem.testInput,
        expected_output: selectedProblem.expectedOutput,
      };

      const res = await fetch(`${JUDGE0_API_URL}?base64_encoded=false&wait=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': '533563bab6msh2e2cde0557633c2p1eb952jsna3c6628b4534',
          'X-RapidAPI-Host': JUDGE0_API_HOST,
        },
        body: JSON.stringify(submission),
      });

      const result = await res.json();

      if (result.compile_output) {
        setOutput(`Compile Error:\n${result.compile_output}`);
        toast({ title: 'Compile Error', status: 'error', duration: 5000, isClosable: true });
      } else if (result.stderr) {
        setOutput(`Runtime Error:\n${result.stderr}`);
        toast({ title: 'Runtime Error', status: 'error', duration: 5000, isClosable: true });
      } else {
        const actual = result.stdout.trim();
        const expected = selectedProblem.expectedOutput.trim();
        setOutput(actual);

        if (actual === expected) {
          toast({ title: 'Correct!', status: 'success', duration: 3000, isClosable: true });
        } else {
          toast({
            title: 'Incorrect Output',
            description: `Expected: ${expected}, Got: ${actual}`,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, status: 'error', duration: 5000, isClosable: true });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMsg = { id: Date.now(), text: chatInput, sender: 'user' };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Replace this with actual AI backend integration
      const botReply = {
        id: Date.now() + 1,
        text: `AI Tutor: I see you’re asking about "${chatInput}". Let me help you!`,
        sender: 'bot',
      };
      setChatMessages((prev) => [...prev, botReply]);
    } catch (err) {
      toast({ title: 'Chat error', description: err.message, status: 'error', duration: 5000 });
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg={bgColor} py={10}>
      <Container maxW="container.xl">
        <Heading mb={4}>Practice Problems</Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
          <VStack align="stretch" spacing={4}>
            {problems.map((prob) => (
              <ProblemCard key={prob.id} {...prob} onSelect={() => {
                setSelectedProblem(prob);
                setSolution(prob.starterCode || '');
                setOutput('');
                setShowHint(false);
              }} />
            ))}
          </VStack>

          <Box>
            {selectedProblem ? (
              <VStack align="stretch" spacing={5}>
                <Heading size="md">{selectedProblem.title}</Heading>
                <Text color="gray.600">{selectedProblem.description}</Text>

<Box
  border="1px solid"
  borderColor={useColorModeValue('gray.300', 'gray.600')}
  borderRadius="md"
  overflow="hidden"
  minH="300px"
  boxShadow="sm"
>
  <MonacoEditor
    height="300px"
    defaultLanguage="python"
    theme={useColorModeValue('vs-dark')}
    value={solution}
    onChange={(value) => setSolution(value || '')}
    options={{
      minimap: { enabled: false },
      fontSize: 14,
      automaticLayout: true,
      wordWrap: 'on',
      scrollbar: {
        verticalScrollbarSize: 6,
        horizontalScrollbarSize: 6,
      },
    }}
  />
</Box>



                <HStack>
                  <Button leftIcon={<FaLightbulb />} onClick={() => setShowHint(!showHint)} variant="outline">
                    {showHint ? 'Hide Hint' : 'Show Hint'}
                  </Button>
                  <Button colorScheme="orange" onClick={runCode} isLoading={isRunning}>
                    Submit
                  </Button>
                  <Button leftIcon={<FaRobot />} onClick={onOpen} variant="outline">
                    Ask AI Tutor
                  </Button>
                </HStack>

                {showHint && (
                  <Box bg="yellow.50" p={4} borderRadius="md">
                    <Text fontWeight="bold">Hint:</Text>
                    <Text>{selectedProblem.hint}</Text>
                  </Box>
                )}

                <Box>
                  <Text fontWeight="bold">Output:</Text>
                  <Box
                    mt={2}
                    p={4}
                    bg={useColorModeValue('gray.100', 'gray.700')}
                    fontFamily="mono"
                    borderRadius="md"
                  >
                    {output || 'No output yet.'}
                  </Box>
                </Box>
              </VStack>
            ) : (
              <Text>Select a problem to get started.</Text>
            )}
          </Box>
        </SimpleGrid>
      </Container>

      {/* AI Tutor Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>AI Tutor</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              <Box p={3} bg="gray.100" borderRadius="md" maxH="300px" overflowY="auto">
                {chatMessages.map((msg) => (
                  <Box
                    key={msg.id}
                    alignSelf={msg.sender === 'user' ? 'flex-end' : 'flex-start'}
                    bg={msg.sender === 'user' ? 'orange.200' : 'gray.300'}
                    px={4}
                    py={2}
                    mb={2}
                    borderRadius="md"
                  >
                    {msg.text}
                  </Box>
                ))}
              </Box>

              <InputGroup>
                <Input
                  placeholder="Ask something..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                />
                <InputRightElement>
                  <IconButton
                    icon={isChatLoading ? <Spinner size="sm" /> : <FaPaperPlane />}
                    onClick={handleSendChat}
                    isDisabled={isChatLoading}
                    aria-label="Send"
                  />
                </InputRightElement>
              </InputGroup>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Practice;
