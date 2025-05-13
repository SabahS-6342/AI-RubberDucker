import { Box } from '@chakra-ui/react'
import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Chatbot from './pages/Chatbot'
import LearningPath from './pages/LearningPath'
import StudyMaterials from './pages/StudyMaterials'
import Practice from './pages/Practice'
import LearningHistory from './pages/LearningHistory'
import Profile from './pages/Profile'
import AdminStudyMaterials from './pages/AdminStudyMaterials'
import Subscription from './pages/Subscription'

function App() {
    return (
        <Box>
            <NavBar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/chatbot" element={<Chatbot />} />
                <Route path="/learning-paths" element={<LearningPath />} />
                <Route path="/study-materials" element={<StudyMaterials />} />
                <Route path="/practice" element={<Practice />} />
                <Route path="/learning-history" element={<LearningHistory />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin/study-materials" element={<AdminStudyMaterials />} />
                <Route path="/subscription" element={<Subscription />} />
            </Routes>
        </Box>
    )
}

export default App 
