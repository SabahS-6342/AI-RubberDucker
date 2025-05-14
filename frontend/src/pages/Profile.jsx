import React, { useState, useEffect, useRef } from 'react';
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
  Editable,
  EditablePreview,
  EditableInput,
  Flex,
  Tag,
  TagLabel,
  TagCloseButton,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { FaUser, FaGraduationCap, FaCog, FaBell, FaPlus, FaCamera } from 'react-icons/fa';
import config from '../config';

const Profile = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [preferences, setPreferences] = useState({
    learningStyle: 'visual',
    difficulty: 'intermediate',
    notifications: true,
    dailyGoal: 60, // minutes
  });

  const [profile, setProfile] = useState({
    username: '',
    email: '',
    bio: '',
    interests: [],
    profile_picture: '',
  });

  const [progress, setProgress] = useState({
    overall_progress: 0,
    current_streak: 0,
    topics_mastered: {
      count: 0,
      total: 0,
      topics: []
    }
  });

  const [newInterest, setNewInterest] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Load user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setProfile(prev => ({
      ...prev,
      username: userData.username || '',
      email: userData.email || '',
      bio: userData.bio || '',
      interests: userData.interests || [],
      profile_picture: userData.profile_picture || '',
    }));

    // Fetch progress data
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${config.API_BASE_URL}/api/users/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch progress data');
      }

      const data = await response.json();
      setProgress(data);
    } catch (error) {
      console.error('Error fetching progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to load progress data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handlePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 5MB',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUploading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${config.API_BASE_URL}/api/users/profile/picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to upload profile picture');
      }

      // Update profile with new picture URL
      setProfile(prev => ({
        ...prev,
        profile_picture: data.picture_url,
      }));

      // Update local storage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...currentUser,
        profile_picture: data.picture_url,
      }));

      toast({
        title: 'Success',
        description: 'Profile picture updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Profile picture upload error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload profile picture',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddInterest = () => {
    if (!newInterest.trim()) return;
    
    if (profile.interests.length >= 10) {
      toast({
        title: 'Maximum Interests Reached',
        description: 'You can only have up to 10 interests',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (profile.interests.includes(newInterest.trim())) {
      toast({
        title: 'Duplicate Interest',
        description: 'This interest is already in your list',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setProfile(prev => ({
      ...prev,
      interests: [...prev.interests, newInterest.trim()]
    }));
    setNewInterest('');
  };

  const handleRemoveInterest = (interestToRemove) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.filter(interest => interest !== interestToRemove)
    }));
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Validate username before sending
      if (profile.username.length < 3 || profile.username.length > 50) {
        throw new Error('Username must be between 3 and 50 characters');
      }

      const response = await fetch(`${config.API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bio: profile.bio.trim(),
          image_url: profile.profile_picture
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update profile');
      }
      
      // Update local storage with new user data
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...currentUser,
        ...data.user,
      }));

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${config.API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          preferences: JSON.stringify(preferences),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update preferences');
      }

    toast({
      title: 'Preferences Updated',
      description: 'Your learning preferences have been saved',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update preferences',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
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
                <Box position="relative" display="inline-block">
                <Avatar
                  size="2xl"
                    name={profile.username}
                    src={profile.profile_picture ? `${config.API_BASE_URL}${profile.profile_picture}` : undefined}
                  mb={4}
                />
                  {isEditing && (
                    <IconButton
                      aria-label="Change profile picture"
                      icon={<FaCamera />}
                      size="sm"
                      colorScheme="orange"
                      position="absolute"
                      bottom="4"
                      right="0"
                      onClick={() => fileInputRef.current?.click()}
                      isLoading={isUploading}
                    />
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePictureUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </Box>
                {isEditing ? (
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Username</FormLabel>
                      <Input
                        value={profile.username}
                        onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Enter username"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Bio</FormLabel>
                      <Input
                        value={profile.bio}
                        onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Interests</FormLabel>
                      <InputGroup>
                        <Input
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          placeholder="Add an interest"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddInterest();
                            }
                          }}
                        />
                        <InputRightElement>
                          <Button
                            size="sm"
                            colorScheme="orange"
                            onClick={handleAddInterest}
                            isDisabled={!newInterest.trim()}
                          >
                            <FaPlus />
                          </Button>
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>
                    <HStack wrap="wrap" spacing={2}>
                      {profile.interests.map((interest, index) => (
                        <Tag
                          key={index}
                          size="md"
                          borderRadius="full"
                          variant="solid"
                          colorScheme="orange"
                        >
                          <TagLabel>{interest}</TagLabel>
                          <TagCloseButton onClick={() => handleRemoveInterest(interest)} />
                        </Tag>
                      ))}
                    </HStack>
                    <HStack>
                      <Button
                        colorScheme="orange"
                        onClick={handleSaveProfile}
                        isLoading={isLoading}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </HStack>
                  </VStack>
                ) : (
                  <>
                    <Heading size="md">{profile.username}</Heading>
                <Text color="gray.600">{profile.email}</Text>
                    <Button
                      mt={4}
                      variant="outline"
                      colorScheme="orange"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </Button>
                  </>
                )}
              </Box>
              <Box gridColumn={{ md: 'span 2' }}>
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <Text fontWeight="medium" mb={2}>
                      About Me
                    </Text>
                    <Text color="gray.600">{profile.bio || 'No bio provided'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="medium" mb={2}>
                      Interests
                    </Text>
                    <HStack spacing={2} wrap="wrap">
                      {profile.interests.map((interest, index) => (
                        <Badge key={index} colorScheme="orange">
                          {interest}
                        </Badge>
                      ))}
                      {profile.interests.length === 0 && (
                        <Text color="gray.500">No interests added yet</Text>
                      )}
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
              isLoading={isLoading}
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
                  <Text color="orange.500">{progress.overall_progress}%</Text>
                </HStack>
                <Progress 
                  value={progress.overall_progress} 
                  colorScheme="orange" 
                  size="sm"
                  hasStripe
                  isAnimated
                />
              </Box>
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="medium">Current Streak</Text>
                  <Text color="orange.500">{progress.current_streak} days</Text>
                </HStack>
                <Progress 
                  value={(progress.current_streak / 7) * 100} 
                  colorScheme="green" 
                  size="sm"
                  hasStripe
                  isAnimated
                />
              </Box>
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="medium">Topics Mastered</Text>
                  <Text color="orange.500">
                    {progress.topics_mastered.count}/{progress.topics_mastered.total}
                  </Text>
                </HStack>
                <Progress 
                  value={(progress.topics_mastered.count / progress.topics_mastered.total) * 100} 
                  colorScheme="blue" 
                  size="sm"
                  hasStripe
                  isAnimated
                />
                {progress.topics_mastered.topics.length > 0 && (
                  <Box mt={2}>
                    <Text fontSize="sm" color="gray.600">Mastered Topics:</Text>
                    <HStack spacing={2} mt={1} wrap="wrap">
                      {progress.topics_mastered.topics.map((topic, index) => (
                        <Badge key={index} colorScheme="blue">
                          {topic}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
                )}
              </Box>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default Profile; 