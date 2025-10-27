import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ScoringConfigsListPage from './pages/ScoringConfigs/ScoringConfigsListPage';
import ScoringConfigFormPage from './pages/ScoringConfigs/ScoringConfigFormPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/scoring-configs" element={<ScoringConfigsListPage />} />
        <Route path="/scoring-configs/new" element={<ScoringConfigFormPage />} />
        <Route path="/scoring-configs/:id/edit" element={<ScoringConfigFormPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
