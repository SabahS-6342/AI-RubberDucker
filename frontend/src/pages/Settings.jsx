import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Switch,
  Button,
  useToast,
  Divider,
  Text,
  Select,
  HStack,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import { updateUserPreferences } from '../services/auth';

const Settings = () => {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    darkMode: false,
    language: 'en',
    timezone: 'UTC',
  });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    // Set initial dark mode preference based on current color mode
    setPreferences(prev => ({
      ...prev,
      darkMode: colorMode === 'dark'
    }));
  }, [colorMode]);

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      await updateUserPreferences(preferences);
      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>Settings</Heading>
          <Text color="gray.500">Manage your account preferences and settings</Text>
        </Box>

        <Box
          bg={bgColor}
          p={6}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <VStack spacing={6} align="stretch">
            <Heading size="md">Preferences</Heading>
            
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel mb="0">Email Notifications</FormLabel>
              <Switch
                isChecked={preferences.emailNotifications}
                onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                colorScheme="orange"
              />
            </FormControl>

            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel mb="0">Dark Mode</FormLabel>
              <Switch
                isChecked={preferences.darkMode}
                onChange={(e) => {
                  handlePreferenceChange('darkMode', e.target.checked);
                  toggleColorMode();
                }}
                colorScheme="orange"
              />
            </FormControl>

            <Divider />

            <FormControl>
              <FormLabel>Language</FormLabel>
              <Select
                value={preferences.language}
                onChange={(e) => handlePreferenceChange('language', e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Timezone</FormLabel>
              <Select
                value={preferences.timezone}
                onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
              >
                <option value="UTC">UTC</option>
                <option value="EST">Eastern Time</option>
                <option value="CST">Central Time</option>
                <option value="PST">Pacific Time</option>
              </Select>
            </FormControl>

            <HStack justify="flex-end" spacing={4}>
              <Button
                onClick={handleSavePreferences}
                colorScheme="orange"
                isLoading={isLoading}
                loadingText="Saving..."
              >
                Save Changes
              </Button>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default Settings; 