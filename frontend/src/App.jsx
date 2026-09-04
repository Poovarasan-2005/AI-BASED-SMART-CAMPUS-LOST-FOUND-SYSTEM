import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';

// Public & Landing
import Home from './pages/shared/Home';
import SearchPage from './pages/shared/SearchPage';
import ItemDetailsPage from './pages/shared/ItemDetailsPage';

// Auth Pages
import LostLogin from './pages/auth/LostLogin';
import LostRegister from './pages/auth/LostRegister';
import FoundLogin from './pages/auth/FoundLogin';
import FoundRegister from './pages/auth/FoundRegister';
import AdminLogin from './pages/auth/AdminLogin';
import EmailVerification from './pages/auth/EmailVerification';

// Lost Portal Pages
import LostDashboard from './pages/lost/LostDashboard';
import LostReportForm from './pages/lost/LostReportForm';
import ItemsListPage from './pages/shared/ItemsListPage';
import AIMatchesPage from './pages/shared/AIMatchesPage';
import VerificationRequestsListPage from './pages/shared/VerificationRequestsListPage';
import NotificationsPage from './pages/shared/NotificationsPage';
import UserProfilePage from './pages/shared/UserProfilePage';
import LostVerificationPage from './pages/lost/LostVerificationPage';

// Found Portal Pages
import FoundDashboard from './pages/found/FoundDashboard';
import FoundReportForm from './pages/found/FoundReportForm';
import HandoverQRScanner from './pages/found/HandoverQRScanner';

// Shared Verification & Conversation
import VerificationRequestPage from './pages/shared/VerificationRequestPage';
import ConversationsPage from './pages/shared/ConversationsPage';
import SecureConversation from './components/SecureConversation';

// Admin Portal
import AdminDashboard from './pages/admin/AdminDashboard';

// Support & Legal Pages
import AboutPage from './pages/support/AboutPage';
import HowItWorksPage from './pages/support/HowItWorksPage';
import ContactPage from './pages/support/ContactPage';
import SupportPage from './pages/support/SupportPage';
import PrivacyPolicyPage from './pages/support/PrivacyPolicyPage';
import TermsPage from './pages/support/TermsPage';
import SecurityPolicyPage from './pages/support/SecurityPolicyPage';
import AccessibilityPage from './pages/support/AccessibilityPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <div style={{ flex: 1 }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/items/:type/:id" element={<ItemDetailsPage />} />

              {/* Authentication Routes */}
              <Route path="/lost/login" element={<LostLogin />} />
              <Route path="/lost/register" element={<LostRegister />} />
              <Route path="/found/login" element={<FoundLogin />} />
              <Route path="/found/register" element={<FoundRegister />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/email-verification" element={<EmailVerification />} />

              {/* Lost User Routes (Section 4) */}
              <Route path="/lost/dashboard" element={<LostDashboard />} />
              <Route path="/lost/report" element={<LostReportForm />} />
              <Route path="/lost/reports/create" element={<LostReportForm />} />
              <Route path="/lost/items" element={<ItemsListPage role="LOST" />} />
              <Route path="/lost/matches" element={<AIMatchesPage role="LOST" />} />
              <Route path="/lost/verification-requests" element={<VerificationRequestsListPage role="LOST" />} />
              <Route path="/lost/verification/:requestId" element={<LostVerificationPage />} />
              <Route path="/lost/verification-request/:foundReportId" element={<VerificationRequestPage />} />
              <Route path="/lost/messages" element={<ConversationsPage />} />
              <Route path="/lost/messages/:conversationId" element={<SecureConversation />} />
              <Route path="/lost/conversations" element={<ConversationsPage />} />
              <Route path="/lost/conversations/:conversationId" element={<SecureConversation />} />
              <Route path="/lost/notifications" element={<NotificationsPage role="LOST" />} />
              <Route path="/lost/profile" element={<UserProfilePage role="LOST" />} />

              {/* Found User Routes (Section 4) */}
              <Route path="/found/dashboard" element={<FoundDashboard />} />
              <Route path="/found/report" element={<FoundReportForm />} />
              <Route path="/found/reports/create" element={<FoundReportForm />} />
              <Route path="/found/items" element={<ItemsListPage role="FOUND" />} />
              <Route path="/found/matches" element={<AIMatchesPage role="FOUND" />} />
              <Route path="/found/verification-requests" element={<VerificationRequestsListPage role="FOUND" />} />
              <Route path="/found/messages" element={<ConversationsPage />} />
              <Route path="/found/messages/:conversationId" element={<SecureConversation />} />
              <Route path="/found/conversations" element={<ConversationsPage />} />
              <Route path="/found/conversations/:conversationId" element={<SecureConversation />} />
              <Route path="/found/notifications" element={<NotificationsPage role="FOUND" />} />
              <Route path="/found/profile" element={<UserProfilePage role="FOUND" />} />
              <Route path="/found/recovery/:recoveryId" element={<HandoverQRScanner />} />

              {/* Shared Verification Requests */}
              <Route path="/verification/request/:foundReportId" element={<VerificationRequestPage />} />
              <Route path="/verification/request" element={<VerificationRequestPage />} />

              {/* Admin Routes (Section 4 & 21) */}
              <Route path="/admin/dashboard" element={<AdminDashboard view="dashboard" />} />
              <Route path="/admin/users" element={<AdminDashboard view="users" />} />
              <Route path="/admin/items" element={<AdminDashboard view="items" />} />
              <Route path="/admin/matches" element={<AdminDashboard view="matches" />} />
              <Route path="/admin/verification-requests" element={<AdminDashboard view="verifications" />} />
              <Route path="/admin/reports" element={<AdminDashboard view="reports" />} />
              <Route path="/admin/audit-logs" element={<AdminDashboard view="logs" />} />
              <Route path="/admin/settings" element={<AdminDashboard view="settings" />} />

              {/* Support & Legal Routes (Section 31) */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/security" element={<SecurityPolicyPage />} />
              <Route path="/accessibility" element={<AccessibilityPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
