import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import Navbar from './components/NavBar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Chatbot from './pages/Chatbot';
import ChatSessions from './components/ChatSessions';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/Dashboard';
import AuthCallback from './components/AuthCallback';
import LearningPath from './pages/LearningPath';
import StudyMaterials from './pages/StudyMaterials';
import Practice from './pages/Practice';
import LearningHistory from './pages/LearningHistory';
import Settings from './pages/Settings';
import AuthProvider from './components/AuthProvider';
import AdminStudyMaterials from './pages/AdminStudyMaterials';
import Subscription from './pages/Subscription';
import Pricing from './pages/Pricing';
import CodingSection from './pages/CodingSection';

function App() {
  return (
    <AuthProvider>
      <Box>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/chatbot"
            element={
              <PrivateRoute>
                <Chatbot />
              </PrivateRoute>
            }
          />
          <Route
            path="/learning-path"
            element={
              <PrivateRoute>
                <LearningPath />
              </PrivateRoute>
            }
          />
          <Route
            path="/study-materials"
            element={
              <PrivateRoute>
                <StudyMaterials />
              </PrivateRoute>
            }
          />
          <Route
            path="/practice"
            element={
              <PrivateRoute>
                <Practice />
              </PrivateRoute>
            }
          />
          <Route
            path="/coding"
            element={
              <PrivateRoute>
                <CodingSection />
              </PrivateRoute>
            }
          />
          <Route
            path="/learning-history"
            element={
              <PrivateRoute>
                <LearningHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/study-materials"
            element={
              <PrivateRoute>
                <AdminStudyMaterials />
              </PrivateRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <PrivateRoute>
                <Subscription />
              </PrivateRoute>
            }
          />
        </Routes>
      </Box>
    </AuthProvider>
  );
}

export default App; 
