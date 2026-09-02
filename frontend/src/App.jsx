import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';

// Auth Pages
import LostLogin from './pages/auth/LostLogin';
import LostRegister from './pages/auth/LostRegister';
import FoundLogin from './pages/auth/FoundLogin';
import FoundRegister from './pages/auth/FoundRegister';
import AdminLogin from './pages/auth/AdminLogin';
import EmailVerification from './pages/auth/EmailVerification';

// Portal Pages
import LostDashboard from './pages/lost/LostDashboard';
import LostReportForm from './pages/lost/LostReportForm';
import LostVerificationPage from './pages/lost/LostVerificationPage';
import VerificationRequestPage from './pages/shared/VerificationRequestPage';
import FoundDashboard from './pages/found/FoundDashboard';
import FoundReportForm from './pages/found/FoundReportForm';
import FoundMatches from './pages/found/FoundMatches';
import HandoverQRScanner from './pages/found/HandoverQRScanner';
import AdminDashboard from './pages/admin/AdminDashboard';

// Shared Conversation Components
import ConversationsPage from './pages/shared/ConversationsPage';
import SecureConversation from './components/SecureConversation';

import { ShieldCheck, Sparkles, KeyRound, QrCode, Lock, MessageSquare } from 'lucide-react';

function Home() {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <span className="badge badge-active" style={{ fontSize: '0.85rem', marginBottom: '1rem', padding: '0.4rem 1rem' }}>
          AI-POWERED SMART CAMPUS SECURITY PLATFORM
        </span>

        <h1 style={{ fontSize: '2.75rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem' }}>
          AI Multimodal Lost & Found System with Email Verification & Private Chat
        </h1>

        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: 640, margin: '0 auto 2.5rem auto' }}>
          Combining OpenCV visual feature extraction, multimodal AI score matching, 6-digit Mobile OTP security, BOLA-protected private in-app conversations, and safe campus QR handovers.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '4rem' }}>
          <Link to="/lost/login" className="btn btn-lost" style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }}>
            Lost User Portal
          </Link>
          <Link to="/found/login" className="btn btn-found" style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }}>
            Found User Portal
          </Link>
          <Link to="/admin/login" className="btn btn-outline" style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }}>
            Admin Portal
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <Sparkles style={{ color: '#06b6d4', width: 28, height: 28, marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Multimodal AI Engine</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Configurable 40% visual + 20% NLP text + campus location & date proximity matching with Explainable AI score breakdowns.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <KeyRound style={{ color: '#f43f5e', width: 28, height: 28, marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>6-Digit Mobile OTP</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Cryptographically secure single-use 5-minute Mobile OTP sent strictly to the backend-verified Lost User mobile number.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <MessageSquare style={{ color: '#6366f1', width: 28, height: 28, marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Private In-App Chat</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              BOLA/IDOR protected private conversation between verified Lost Owner and Finder with contact privacy consents.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <QrCode style={{ color: '#10b981', width: 28, height: 28, marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Secure QR Handover</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Temporary single-use recovery QR code token validation with double-confirmation digital receipt issuance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            
            {/* Auth Routes */}
            <Route path="/lost/login" element={<LostLogin />} />
            <Route path="/lost/register" element={<LostRegister />} />
            <Route path="/found/login" element={<FoundLogin />} />
            <Route path="/found/register" element={<FoundRegister />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/email-verification" element={<EmailVerification />} />

            {/* Portal Routes */}
            <Route path="/lost/dashboard" element={<LostDashboard />} />
            <Route path="/lost/reports/create" element={<LostReportForm />} />
            <Route path="/lost/verification/:requestId" element={<LostVerificationPage />} />
            <Route path="/lost/verification-request/:foundReportId" element={<VerificationRequestPage />} />
            <Route path="/verification/request/:foundReportId" element={<VerificationRequestPage />} />
            <Route path="/verification/request" element={<VerificationRequestPage />} />
            <Route path="/lost/conversations" element={<ConversationsPage />} />
            <Route path="/lost/conversations/:conversationId" element={<SecureConversation />} />

            <Route path="/found/dashboard" element={<FoundDashboard />} />
            <Route path="/found/reports/create" element={<FoundReportForm />} />
            <Route path="/found/matches" element={<FoundMatches />} />
            <Route path="/found/recovery/:recoveryId" element={<HandoverQRScanner />} />
            <Route path="/found/conversations" element={<ConversationsPage />} />
            <Route path="/found/conversations/:conversationId" element={<SecureConversation />} />

            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
