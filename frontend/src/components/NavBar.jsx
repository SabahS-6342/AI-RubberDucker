import { Flex, Button, Image, HStack, Link as ChakraLink, Box, useColorModeValue, IconButton, useDisclosure, VStack, Collapse, Menu, MenuButton, MenuList, MenuItem, MenuDivider } from '@chakra-ui/react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons'
import { FaUser, FaCog, FaHistory, FaSignOutAlt } from 'react-icons/fa'
import React, { useState, useEffect } from 'react'

const NavLink = ({ to, children, isMobile = false }) => {
  const location = useLocation()
  const isActive = location.pathname === to
  const activeBg = useColorModeValue('orange.50', 'orange.900')
  const bgHover = useColorModeValue('gray.50', 'gray.700')
  
  return (
    <ChakraLink
      as={RouterLink}
      to={to}
      fontWeight="medium"
      color={isActive ? 'orange.500' : 'gray.600'}
      bg={isActive ? activeBg : 'transparent'}
      px={3}
      py={2}
      rounded="md"
      position="relative"
      display="flex"
      width={isMobile ? "full" : "auto"}
      justifyContent={isMobile ? "center" : "flex-start"}
      _hover={{ 
        textDecoration: 'none', 
        bg: isActive ? activeBg : bgHover,
        color: 'orange.500',
        transform: 'translateY(-1px)'
      }}
      _active={{
        transform: 'translateY(0)'
      }}
      transition="all 0.2s"
    >
      {children}
    </ChakraLink>
  )
}

const NavBar = () => {
  const { isOpen, onToggle } = useDisclosure()
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const bgColor = useColorModeValue('white', 'gray.800')
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Check authentication status on mount and when localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      console.log('NavBar - Checking auth status, token:', token ? 'Present' : 'Not present')
      setIsLoggedIn(!!token)
      console.log('NavBar - Updated isLoggedIn state to:', !!token)
    }

    // Check immediately
    console.log('NavBar - Initial auth check')
    checkAuth()

    // Listen for storage events
    window.addEventListener('storage', checkAuth)
    
    // Listen for custom auth state change event
    window.addEventListener('authStateChanged', () => {
      console.log('NavBar - Received authStateChanged event')
      checkAuth()
    })

    return () => {
      window.removeEventListener('storage', checkAuth)
      window.removeEventListener('authStateChanged', checkAuth)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    navigate('/')
  }

  const handleLogoClick = () => {
    navigate(isLoggedIn ? '/dashboard' : '/')
  }

  console.log('NavBar - Rendering with isLoggedIn:', isLoggedIn)

  return (
    <Box 
      borderBottom="1px" 
      borderColor={borderColor} 
      bg={bgColor} 
      position="sticky" 
      top={0} 
      zIndex={1000}
      backdropFilter="blur(10px)"
      backgroundColor={useColorModeValue(
        'rgba(255, 255, 255, 0.8)',
        'rgba(26, 32, 44, 0.8)'
      )}
      boxShadow="sm"
      width="100%"
    >
      <Flex
        h={16}
        alignItems={"center"}
        justifyContent={"space-between"}
        gap={4}
        px={4}
        maxW="100%"
      >
        <Flex alignItems={"center"}>
          <ChakraLink 
            onClick={handleLogoClick}
            display="flex" 
            alignItems="center" 
            _hover={{ textDecoration: 'none' }}
            cursor="pointer"
          >
            <Image 
              src="/ducks/logo.png" 
              h="38px"
              mr={2}
              alt="AI RubberDucker Logo"
              transition="transform 0.2s"
              _hover={{ transform: 'scale(1.05) rotate(-5deg)' }}
            />
            <Box 
              fontSize="xl" 
              fontWeight="bold" 
              bgGradient="linear(to-r, orange.400, orange.500)"
              bgClip="text"
              letterSpacing="tight"
              _hover={{ 
                bgGradient: "linear(to-r, orange.500, orange.600)",
                transform: 'translateY(-1px)'
              }}
              transition="all 0.2s"
            >
              AI RubberDucker
            </Box>
          </ChakraLink>
        </Flex>

        <HStack spacing={4} display={{ base: "none", md: "flex" }}>
          {isLoggedIn && (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/chat">AI Tutor</NavLink>
              <NavLink to="/learning-path">Learning Path</NavLink>
              <NavLink to="/study-materials">Study Materials</NavLink>
              <NavLink to="/practice">Practice</NavLink>
            </>
          )}
        </HStack>

        <HStack spacing={2} display={{ base: "none", md: "flex" }}>
          {isLoggedIn ? (
            <>
              <Menu>
                <MenuButton
                  as={Button}
                  variant="ghost"
                colorScheme="orange"
                size="md"
                fontWeight="medium"
                px={4}
                  leftIcon={<FaUser />}
                >
                  Profile
                </MenuButton>
                <MenuList>
                  <MenuItem icon={<FaUser />} onClick={() => navigate('/profile')}>
                    View Profile
                  </MenuItem>
                  <MenuItem icon={<FaHistory />} onClick={() => navigate('/chat-history')}>
                    Chat History
                  </MenuItem>
                  <MenuItem icon={<FaCog />} onClick={() => navigate('/settings')}>
                    Settings
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem icon={<FaSignOutAlt />} onClick={handleLogout} color="red.500">
                Logout
                  </MenuItem>
                </MenuList>
              </Menu>
            </>
          ) : (
            <>
              <Button 
                as={RouterLink}
                to="/login"
                variant="ghost" 
                colorScheme="orange"
                size="md"
                fontWeight="medium"
                px={4}
                _hover={{
                  bg: 'orange.50',
                  transform: 'translateY(-1px)'
                }}
                _active={{
                  transform: 'translateY(0)',
                  bg: 'orange.100'
                }}
                transition="all 0.2s"
              >
                Log in
              </Button>
              <Button 
                as={RouterLink}
                to="/register"
                colorScheme="orange"
                size="md"
                fontWeight="medium"
                px={4}
                bgGradient="linear(to-r, orange.400, orange.500)"
                _hover={{
                  bgGradient: "linear(to-r, orange.500, orange.600)",
                  transform: 'translateY(-1px)',
                  boxShadow: 'md'
                }}
                _active={{
                  transform: 'translateY(0)',
                  boxShadow: 'sm'
                }}
                transition="all 0.2s"
              >
                Sign up
              </Button>
            </>
          )}
        </HStack>

        <IconButton
          display={{ base: "flex", md: "none" }}
          onClick={onToggle}
          icon={isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />}
          variant="ghost"
          aria-label="Toggle Navigation"
        />
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <VStack
          p={4}
          display={{ md: "none" }}
          spacing={4}
          divider={<Box borderBottom="1px" borderColor={borderColor} w="100%" />}
        >
          {isLoggedIn ? (
            <>
              <NavLink to="/dashboard" isMobile>Dashboard</NavLink>
              <NavLink to="/chat" isMobile>AI Tutor</NavLink>
              <NavLink to="/learning-path" isMobile>Learning Path</NavLink>
              <NavLink to="/study-materials" isMobile>Study Materials</NavLink>
              <NavLink to="/practice" isMobile>Practice</NavLink>
              <NavLink to="/learning-history" isMobile>Learning History</NavLink>
              <NavLink to="/profile" isMobile>Profile</NavLink>
              <NavLink to="/chat-history" isMobile>Chat History</NavLink>
              <NavLink to="/settings" isMobile>Settings</NavLink>
              <Button 
                w="full"
                colorScheme="red"
                variant="ghost"
                onClick={handleLogout}
                leftIcon={<FaSignOutAlt />}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button 
                as={RouterLink}
                to="/login"
                w="full"
                variant="ghost" 
                colorScheme="orange"
              >
                Log in
              </Button>
              <Button 
                as={RouterLink}
                to="/register"
                w="full"
                colorScheme="orange"
              >
                Sign up
              </Button>
            </>
          )}
        </VStack>
      </Collapse>
    </Box>
  )
}

export default NavBar