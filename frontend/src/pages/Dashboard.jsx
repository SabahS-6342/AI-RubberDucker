import { 
    Box, 
    VStack, 
    Heading, 
    Text, 
    useColorModeValue,
    HStack,
    SimpleGrid,
    Icon,
    Badge,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    useToast,
    Skeleton
  } from '@chakra-ui/react'
  import { useNavigate } from 'react-router-dom'
  import { 
    FaBook, 
    FaComments, 
    FaUser, 
    FaCog, 
    FaHistory,
    FaGraduationCap,
    FaLightbulb
  } from 'react-icons/fa'
  import { useEffect, useState } from 'react'
  import { getDashboardStats, getRecentActivity } from '../services/dashboard'
  import config from '../config'
  
  const FeatureCard = ({ icon, title, description, onClick, colorScheme = 'orange' }) => {
    const bgColor = useColorModeValue('white', 'gray.700')
    const borderColor = useColorModeValue('gray.200', 'gray.600')
    
    return (
      <Box
        p={6}
        borderWidth="1px"
        borderRadius="lg"
        borderColor={borderColor}
        bg={bgColor}
        boxShadow="sm"
        _hover={{
          transform: 'translateY(-2px)',
          boxShadow: 'md',
          borderColor: `${colorScheme}.300`
        }}
        transition="all 0.2s"
        cursor="pointer"
        onClick={onClick}
      >
        <VStack align="start" spacing={4}>
          <Icon as={icon} w={8} h={8} color={`${colorScheme}.500`} />
          <Heading size="md">{title}</Heading>
          <Text color="gray.600">{description}</Text>
        </VStack>
      </Box>
    )
  }
  
  const Dashboard = () => {
    const navigate = useNavigate()
    const toast = useToast()
    const bgColor = useColorModeValue('gray.50', 'gray.900')
    const cardBg = useColorModeValue('white', 'gray.800')
    const borderColor = useColorModeValue('gray.200', 'gray.700')
    
    const [stats, setStats] = useState(null)
    const [recentActivity, setRecentActivity] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true)
                const token = localStorage.getItem('token')
                if (!token) {
                    toast({
                        title: 'Error',
                        description: 'Please log in to view the dashboard',
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                    })
                    navigate('/login')
                    return
                }

                console.log('Fetching dashboard data...')
                const [statsData, activityData] = await Promise.all([
                    getDashboardStats(),
                    getRecentActivity()
                ])
                console.log('Dashboard stats:', statsData)
                console.log('Recent activity:', activityData)
                
                setStats(statsData)
                setRecentActivity(activityData)
            } catch (error) {
                console.error('Dashboard data fetch error:', error)
                console.error('Error details:', error.response?.data)
                toast({
                    title: 'Error',
                    description: error.response?.data?.detail || 'Failed to load dashboard data',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchDashboardData()
    }, [toast, navigate])

    useEffect(() => {
      const checkAdminStatus = async () => {
        const token = localStorage.getItem('token')
        if (!token) {
          toast({
            title: 'Error',
            description: 'You must be logged in to view the dashboard.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
          navigate('/login')
          return
        }

        try {
          const response = await fetch(`${config.API_BASE_URL}/api/dashboard/stats`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (!response.ok) {
            throw new Error('Failed to fetch user data')
          }
          
          const data = await response.json()
          if (data.user && data.user.role === 'admin') {
            setIsAdmin(true)
          }
        } catch (error) {
          console.error('Admin status check error:', error)
          toast({
            title: 'Error',
            description: 'Failed to fetch user data.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
        }
      }

      checkAdminStatus()
    }, [toast, navigate])

    const getStatusColor = (status) => {
      switch (status) {
        case 'completed':
          return 'green'
        case 'active':
          return 'blue'
        case 'pending':
          return 'yellow'
        case 'failed':
          return 'red'
        default:
          return 'gray'
      }
    }
  
    return (
      <Box minH="100vh" bg={bgColor} p={8}>
        <VStack spacing={8} align="stretch" maxW="1200px" mx="auto">
          {/* Header Section */}
          <VStack align="start" spacing={1}>
            <Heading size="xl" bgGradient="linear(to-r, orange.400, orange.600)" bgClip="text">
              Welcome to Your Learning Journey!
            </Heading>
            <Text color="gray.600">Your personalized AI learning companion is ready to guide you</Text>
          </VStack>
  
          {/* Stats Section */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Box p={6} bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
              <Stat>
                <StatLabel>Learning Sessions</StatLabel>
                {isLoading ? (
                  <Skeleton height="40px" />
                ) : (
                  <>
                    <StatNumber>{stats?.sessions?.count || 0}</StatNumber>
                    <StatHelpText>↗︎ {stats?.sessions?.increase || '0%'} this month</StatHelpText>
                  </>
                )}
              </Stat>
            </Box>
            <Box p={6} bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
              <Stat>
                <StatLabel>Topics Explored</StatLabel>
                {isLoading ? (
                  <Skeleton height="40px" />
                ) : (
                  <>
                    <StatNumber>{stats?.topics?.count || 0}</StatNumber>
                    <StatHelpText>↗︎ {stats?.topics?.new_this_week || 0} new this week</StatHelpText>
                  </>
                )}
              </Stat>
            </Box>
            <Box p={6} bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
              <Stat>
                <StatLabel>Learning Progress</StatLabel>
                {isLoading ? (
                  <Skeleton height="40px" />
                ) : (
                  <>
                    <StatNumber>{stats?.progress?.percentage || '0%'}</StatNumber>
                    <StatHelpText>↗︎ {stats?.progress?.increase || '0%'} increase today</StatHelpText>
                  </>
                )}
              </Stat>
            </Box>
          </SimpleGrid>
  
          {/* Quick Access Section */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            <FeatureCard
              icon={FaBook}
              title="Learning Path"
              description="Explore personalized learning materials and study resources"
              onClick={() => navigate('/learning-path')}
            />
            <FeatureCard
              icon={FaComments}
              title="AI Tutor"
              description="Chat with your AI tutor for personalized guidance and explanations"
              onClick={() => navigate('/chatbot')}
            />
            <FeatureCard
              icon={FaHistory}
              title="Learning History"
              description="Review your past learning sessions and track your progress"
              onClick={() => navigate('/learning-history')}
            />
            <FeatureCard
              icon={FaGraduationCap}
              title="Study Materials"
              description="Access curated high-quality learning resources"
              onClick={() => navigate('/study-materials')}
            />
            <FeatureCard
              icon={FaLightbulb}
              title="Practice Problems"
              description="Solve problems with AI-guided explanations"
              onClick={() => navigate('/practice')}
            />
            <FeatureCard
              icon={FaUser}
              title="Profile"
              description="Manage your learning preferences and progress"
              onClick={() => navigate('/profile')}
            />
          </SimpleGrid>
  
          {/* Recent Activity Section */}
          <Box p={6} bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <Heading size="md" mb={4}>Recent Learning Activity</Heading>
            {isLoading ? (
              <VStack align="stretch" spacing={4}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height="40px" />
                ))}
              </VStack>
            ) : (
              <VStack align="stretch" spacing={4}>
                {recentActivity?.map((activity, index) => (
                  <HStack key={index} justify="space-between">
                    <Text>{activity.title}</Text>
                    <Badge colorScheme={getStatusColor(activity.status)}>
                      {activity.status}
                    </Badge>
                  </HStack>
                ))}
                {(!recentActivity || recentActivity.length === 0) && (
                  <Text color="gray.500" textAlign="center">No recent activity</Text>
                )}
              </VStack>
            )}
          </Box>

          {isAdmin && (
            <VStack mt={4} align="start" spacing={2}>
              <Heading size="md">Admin Statistics</Heading>
              <Text>Here you can view and manage admin statistics.</Text>
            </VStack>
          )}
        </VStack>
      </Box>
    )
  }
  
  export default Dashboard 