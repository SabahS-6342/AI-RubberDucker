import React, { useState, useEffect } from 'react';
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
  Textarea,
} from '@chakra-ui/react';
import { FaUser, FaGraduationCap, FaCog, FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile, updateUserPreferences } from '../services/auth';

const Profile = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const toast = useToast();
  const navigate = useNavigate();

  const [preferences, setPreferences] = useState({
    learningStyle: 'visual',
    difficulty: 'intermediate',
    notifications: true,
    dailyGoal: 60, // minutes
  });

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await getUserProfile();
        setProfile(userData);
        setEditedProfile(userData);
        
        // Load preferences if they exist in the user data
        if (userData.preferences) {
          setPreferences(userData.preferences);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user data. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [navigate, toast]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updatedProfile = await updateUserProfile(editedProfile);
      setProfile(updatedProfile);
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      await updateUserPreferences(preferences);
      toast({
        title: 'Success',
        description: 'Preferences updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update preferences. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Box minH="100vh" bg={bgColor} py={8}>
        <Container maxW="container.xl">
          <VStack spacing={8} align="stretch">
            <Box p={6} bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
              <Text>Loading profile...</Text>
            </Box>
          </VStack>
        </Container>
      </Box>
    );
  }

  if (!profile) {
    return null;
  }

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
                  name={profile.username}
                  src={profile.avatar_url}
                  mb={4}
                />
                {isEditing ? (
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Username</FormLabel>
                      <Input
                        value={editedProfile.username}
                        onChange={(e) => setEditedProfile({ ...editedProfile, username: e.target.value })}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Email</FormLabel>
                      <Input
                        value={editedProfile.email}
                        onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                        type="email"
                      />
                    </FormControl>
                  </VStack>
                ) : (
                  <>
                    <Heading size="md">{profile.username}</Heading>
                    <Text color="gray.600">{profile.email}</Text>
                  </>
                )}
              </Box>
              <Box gridColumn={{ md: 'span 2' }}>
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <HStack justify="space-between" align="center" mb={2}>
                      <Text fontWeight="medium">About Me</Text>
                      <Button
                        size="sm"
                        colorScheme="orange"
                        variant="ghost"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        {isEditing ? 'Cancel' : 'Edit'}
                      </Button>
                    </HStack>
                    {isEditing ? (
                      <Textarea
                        value={editedProfile.bio || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <Text color="gray.600">{profile.bio || 'No bio provided'}</Text>
                    )}
                  </Box>
                  <Box>
                    <Text fontWeight="medium" mb={2}>
                      Interests
                    </Text>
                    {isEditing ? (
                      <Input
                        value={editedProfile.interests?.join(', ') || ''}
                        onChange={(e) => setEditedProfile({
                          ...editedProfile,
                          interests: e.target.value.split(',').map(i => i.trim()).filter(i => i)
                        })}
                        placeholder="Enter interests separated by commas"
                      />
                    ) : (
                      <HStack spacing={2}>
                        {profile.interests?.map((interest, index) => (
                          <Badge key={index} colorScheme="orange">
                            {interest}
                          </Badge>
                        ))}
                      </HStack>
                    )}
                  </Box>
                  {isEditing && (
                    <Button
                      colorScheme="orange"
                      onClick={handleSaveProfile}
                      isLoading={isSaving}
                      loadingText="Saving..."
                    >
                      Save Changes
                    </Button>
                  )}
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
                  <Text color="orange.500">{profile.progress?.overall || 0}%</Text>
                </HStack>
                <Progress value={profile.progress?.overall || 0} colorScheme="orange" size="sm" />
              </Box>
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="medium">Current Streak</Text>
                  <Text color="orange.500">{profile.progress?.streak || 0} days</Text>
                </HStack>
                <Progress value={profile.progress?.streak || 0} colorScheme="green" size="sm" />
              </Box>
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="medium">Topics Mastered</Text>
                  <Text color="orange.500">{profile.progress?.topicsMastered || 0}/{profile.progress?.totalTopics || 0}</Text>
                </HStack>
                <Progress 
                  value={profile.progress?.totalTopics ? (profile.progress.topicsMastered / profile.progress.totalTopics) * 100 : 0} 
                  colorScheme="blue" 
                  size="sm" 
                />
              </Box>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default Profile; 