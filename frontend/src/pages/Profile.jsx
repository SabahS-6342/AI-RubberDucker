import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  useColorModeValue,
  Avatar,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  Divider,
  HStack,
  Icon,
  Badge,
  Progress,
  useToast,
} from '@chakra-ui/react';
import { FaUser, FaGraduationCap, FaCog, FaBell } from 'react-icons/fa';

const Profile = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const toast = useToast();

  const [preferences, setPreferences] = useState({
    learningStyle: 'visual',
    difficulty: 'intermediate',
    notifications: true,
    dailyGoal: 60, // minutes
  });

  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Passionate learner exploring new technologies',
    interests: ['Programming', 'Data Science', 'Machine Learning'],
  });

  const handleSavePreferences = () => {
    toast({
      title: 'Preferences Updated',
      description: 'Your learning preferences have been saved',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* Profile Header */}
          <Box
            p={6}
            bg={cardBg}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <Box textAlign="center">
                <Avatar
                  size="2xl"
                  name={profile.name}
                  src="https://bit.ly/dan-abramov"
                  mb={4}
                />
                <Heading size="md">{profile.name}</Heading>
                <Text color="gray.600">{profile.email}</Text>
              </Box>
              <Box gridColumn={{ md: 'span 2' }}>
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <Text fontWeight="medium" mb={2}>
                      About Me
                    </Text>
                    <Text color="gray.600">{profile.bio}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="medium" mb={2}>
                      Interests
                    </Text>
                    <HStack spacing={2}>
                      {profile.interests.map((interest, index) => (
                        <Badge key={index} colorScheme="orange">
                          {interest}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
                </VStack>
              </Box>
            </SimpleGrid>
          </Box>

          {/* Learning Preferences */}
          <Box
            p={6}
            bg={cardBg}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Heading size="md" mb={6}>
              Learning Preferences
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <FormControl>
                <FormLabel>Learning Style</FormLabel>
                <Select
                  value={preferences.learningStyle}
                  onChange={(e) =>
                    setPreferences({ ...preferences, learningStyle: e.target.value })
                  }
                >
                  <option value="visual">Visual</option>
                  <option value="auditory">Auditory</option>
                  <option value="reading">Reading/Writing</option>
                  <option value="kinesthetic">Kinesthetic</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Preferred Difficulty</FormLabel>
                <Select
                  value={preferences.difficulty}
                  onChange={(e) =>
                    setPreferences({ ...preferences, difficulty: e.target.value })
                  }
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Daily Learning Goal (minutes)</FormLabel>
                <Input
                  type="number"
                  value={preferences.dailyGoal}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      dailyGoal: parseInt(e.target.value),
                    })
                  }
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Enable Notifications</FormLabel>
                <Switch
                  isChecked={preferences.notifications}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      notifications: e.target.checked,
                    })
                  }
                />
              </FormControl>
            </SimpleGrid>

            <Button
              colorScheme="orange"
              mt={6}
              onClick={handleSavePreferences}
            >
              Save Preferences
            </Button>
          </Box>

          {/* Learning Progress */}
          <Box
            p={6}
            bg={cardBg}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Heading size="md" mb={6}>
              Learning Progress
            </Heading>
            <VStack spacing={4} align="stretch">
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="medium">Overall Progress</Text>
                  <Text color="orange.500">75%</Text>
                </HStack>
                <Progress value={75} colorScheme="orange" size="sm" />
              </Box>
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="medium">Current Streak</Text>
                  <Text color="orange.500">7 days</Text>
                </HStack>
                <Progress value={70} colorScheme="green" size="sm" />
              </Box>
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="medium">Topics Mastered</Text>
                  <Text color="orange.500">12/20</Text>
                </HStack>
                <Progress value={60} colorScheme="blue" size="sm" />
              </Box>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default Profile; 