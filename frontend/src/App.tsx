import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import ScoringConfigsListPage from './pages/ScoringConfigs/ScoringConfigsListPage';
import ScoringConfigFormPage from './pages/ScoringConfigs/ScoringConfigFormPage';
import PlayerResearch from './pages/PlayerResearch';
import { LineupsPage } from './pages/LineupsPage';
import { LineupEditorPage } from './pages/LineupEditorPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/account" element={<AccountSettingsPage />} />
        <Route path="/scoring-configs" element={<ScoringConfigsListPage />} />
        <Route path="/scoring-configs/new" element={<ScoringConfigFormPage />} />
        <Route path="/scoring-configs/:id/edit" element={<ScoringConfigFormPage />} />
        <Route path="/player-research" element={<PlayerResearch />} />
        <Route path="/lineups" element={<LineupsPage />} />
        <Route path="/lineups/new" element={<LineupEditorPage />} />
        <Route path="/lineups/:id" element={<LineupsPage />} />
        <Route path="/lineups/:id/edit" element={<LineupEditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </QueryClientProvider>
  );
}

export default App;
