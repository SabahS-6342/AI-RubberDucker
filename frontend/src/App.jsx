import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Chatbot from './pages/Chatbot';
import ChatSessions from './components/ChatSessions';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/Dashboard';
import ChatHistory from './pages/ChatHistory';
import LearningPath from './pages/LearningPath';
import StudyMaterials from './pages/StudyMaterials';
import Practice from './pages/Practice';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
          path="/chat"
          element={
            <PrivateRoute>
              <Chatbot />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat/:id"
          element={
            <PrivateRoute>
              <Chatbot />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat-history"
          element={
            <PrivateRoute>
              <ChatHistory />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/sessions"
          element={
            <PrivateRoute>
              <ChatSessions />
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
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
    </>
  );
}

export default App; 