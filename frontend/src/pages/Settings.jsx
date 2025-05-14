import React, { useState } from 'react';
import { Box, VStack, Heading, Text, FormControl, FormLabel, Input, Button, useToast, Switch, useColorModeValue, Select, Checkbox, Textarea } from '@chakra-ui/react';

const Settings = () => {
  const [email, setEmail] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [preferredLanguages, setPreferredLanguages] = useState([]);
  const [difficultyLevel, setDifficultyLevel] = useState('Beginner');
  const [learningGoals, setLearningGoals] = useState('');
  const [dailyTarget, setDailyTarget] = useState('');
  const [responseStyle, setResponseStyle] = useState('Concise');
  const [voiceAssistant, setVoiceAssistant] = useState(false);
  const [autoExplainCode, setAutoExplainCode] = useState(false);
  const [contextRetention, setContextRetention] = useState('Short-term');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [contentTypes, setContentTypes] = useState([]);
  const [exerciseMode, setExerciseMode] = useState('Practice Mode');
  const [codeEditorTheme, setCodeEditorTheme] = useState('Light');
  const [autoSaveCode, setAutoSaveCode] = useState(true);
  const [learningPath, setLearningPath] = useState('');
  const [customTags, setCustomTags] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [aiMessageReminders, setAiMessageReminders] = useState(true);
  const [language, setLanguage] = useState('English');
  const [timeZone, setTimeZone] = useState('UTC');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [defaultPage, setDefaultPage] = useState('Dashboard');
  const [apiKey, setApiKey] = useState('');
  const [betaFeatures, setBetaFeatures] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [bugReport, setBugReport] = useState('');

  const toast = useToast();
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  const handleSave = () => {
    // Placeholder for saving settings
    toast({
      title: 'Settings saved',
      description: 'Your settings have been updated successfully.',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    // Placeholder for changing password
    toast({
      title: 'Password changed',
      description: 'Your password has been updated successfully.',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };

  const handleDeleteAccount = () => {
    // Placeholder for deleting account
    toast({
      title: 'Account deleted',
      description: 'Your account has been deleted successfully.',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Box minH="100vh" bg={bgColor} p={8}>
      <VStack spacing={8} align="stretch" maxW="600px" mx="auto">
        <VStack align="start" spacing={1}>
          <Heading size="xl" color="orange.500">Settings</Heading>
          <Text color="gray.600">Manage your account settings and preferences</Text>
        </VStack>
        <FormControl>
          <FormLabel>Email</FormLabel>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormControl>
        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">Enable Notifications</FormLabel>
          <Switch isChecked={notifications} onChange={(e) => setNotifications(e.target.checked)} colorScheme="orange" />
        </FormControl>
        <Button colorScheme="orange" onClick={handleSave}>Save Changes</Button>
        <FormControl>
          <FormLabel>Current Password</FormLabel>
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>New Password</FormLabel>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Confirm New Password</FormLabel>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </FormControl>
        <Button colorScheme="orange" onClick={handleChangePassword}>Change Password</Button>
        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">Two-Factor Authentication</FormLabel>
          <Switch isChecked={twoFactorAuth} onChange={(e) => setTwoFactorAuth(e.target.checked)} colorScheme="orange" />
        </FormControl>
        <Button colorScheme="red" onClick={handleDeleteAccount}>Delete Account</Button>
        <FormControl>
          <FormLabel>Preferred Programming Languages</FormLabel>
          <Checkbox colorScheme="orange">Python</Checkbox>
          <Checkbox colorScheme="orange">JavaScript</Checkbox>
          <Checkbox colorScheme="orange">Java</Checkbox>
          <Checkbox colorScheme="orange">C++</Checkbox>
        </FormControl>
        <FormControl>
          <FormLabel>Difficulty Level</FormLabel>
          <Select value={difficultyLevel} onChange={(e) => setDifficultyLevel(e.target.value)}>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Learning Goals</FormLabel>
          <Textarea value={learningGoals} onChange={(e) => setLearningGoals(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Daily Learning Target (hours)</FormLabel>
          <Input type="number" value={dailyTarget} onChange={(e) => setDailyTarget(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Response Style</FormLabel>
          <Select value={responseStyle} onChange={(e) => setResponseStyle(e.target.value)}>
            <option value="Concise">Concise</option>
            <option value="Detailed">Detailed</option>
            <option value="Step-by-step">Step-by-step</option>
          </Select>
        </FormControl>
        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">Voice Assistant</FormLabel>
          <Switch isChecked={voiceAssistant} onChange={(e) => setVoiceAssistant(e.target.checked)} colorScheme="orange" />
        </FormControl>
        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">Auto-Explain Code</FormLabel>
          <Switch isChecked={autoExplainCode} onChange={(e) => setAutoExplainCode(e.target.checked)} colorScheme="orange" />
        </FormControl>
        <FormControl>
          <FormLabel>Context Retention Length</FormLabel>
          <Select value={contextRetention} onChange={(e) => setContextRetention(e.target.value)}>
            <option value="Short-term">Short-term</option>
            <option value="Long-term">Long-term</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Preferred Language</FormLabel>
          <Select value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)}>
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Content Types Shown</FormLabel>
          <Checkbox colorScheme="orange">Video</Checkbox>
          <Checkbox colorScheme="orange">Interactive Exercises</Checkbox>
          <Checkbox colorScheme="orange">Theory</Checkbox>
          <Checkbox colorScheme="orange">Projects</Checkbox>
        </FormControl>
        <FormControl>
          <FormLabel>Exercise Mode</FormLabel>
          <Select value={exerciseMode} onChange={(e) => setExerciseMode(e.target.value)}>
            <option value="Practice Mode">Practice Mode</option>
            <option value="Exam Simulation">Exam Simulation</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Code Editor Theme</FormLabel>
          <Select value={codeEditorTheme} onChange={(e) => setCodeEditorTheme(e.target.value)}>
            <option value="Light">Light</option>
            <option value="Dark">Dark</option>
          </Select>
        </FormControl>
        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">Auto-Save Code</FormLabel>
          <Switch isChecked={autoSaveCode} onChange={(e) => setAutoSaveCode(e.target.checked)} colorScheme="orange" />
        </FormControl>
        <FormControl>
          <FormLabel>Learning Path</FormLabel>
          <Input value={learningPath} onChange={(e) => setLearningPath(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Custom Tags/Folders</FormLabel>
          <Textarea value={customTags} onChange={(e) => setCustomTags(e.target.value)} />
        </FormControl>
        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">Email Notifications</FormLabel>
          <Switch isChecked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} colorScheme="orange" />
        </FormControl>
        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">Push Notifications</FormLabel>
          <Switch isChecked={pushNotifications} onChange={(e) => setPushNotifications(e.target.checked)} colorScheme="orange" />
        </FormControl>
        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">AI Message Reminders</FormLabel>
          <Switch isChecked={aiMessageReminders} onChange={(e) => setAiMessageReminders(e.target.checked)} colorScheme="orange" />
        </FormControl>
        <FormControl>
          <FormLabel>Language/Locale</FormLabel>
          <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Time Zone</FormLabel>
          <Select value={timeZone} onChange={(e) => setTimeZone(e.target.value)}>
            <option value="UTC">UTC</option>
            <option value="EST">EST</option>
            <option value="PST">PST</option>
            <option value="GMT">GMT</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Date Format</FormLabel>
          <Select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Default Page on Login</FormLabel>
          <Select value={defaultPage} onChange={(e) => setDefaultPage(e.target.value)}>
            <option value="Dashboard">Dashboard</option>
            <option value="Chatbot">Chatbot</option>
            <option value="Learning Path">Learning Path</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>API Key</FormLabel>
          <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        </FormControl>
        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">Beta Features Access</FormLabel>
          <Switch isChecked={betaFeatures} onChange={(e) => setBetaFeatures(e.target.checked)} colorScheme="orange" />
        </FormControl>
        <FormControl>
          <FormLabel>Feedback</FormLabel>
          <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </FormControl>
        <Button colorScheme="orange" onClick={handleSave}>Send Feedback</Button>
        <FormControl>
          <FormLabel>Bug Report</FormLabel>
          <Textarea value={bugReport} onChange={(e) => setBugReport(e.target.value)} />
        </FormControl>
        <Button colorScheme="red" onClick={handleSave}>Report Bug</Button>
      </VStack>
    </Box>
  );
};

export default Settings; 