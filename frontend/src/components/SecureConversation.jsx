import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, ShieldCheck, Lock, MapPin, CheckCircle2, AlertTriangle, UserCheck, Share2, FileCheck, Ban, ArrowLeft, Clock } from 'lucide-react';

export default function SecureConversation() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // Handover state
  const [handoverLoc, setHandoverLoc] = useState('Campus Security Office');
  const [handoverTime, setHandoverTime] = useState('');

  // Modals
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareType, setShareType] = useState('PHONE');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Wrong Item');
  const [reportDesc, setReportDesc] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversation();
    const interval = setInterval(fetchMessages, 2500); // 2.5s real-time polling
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversation = async () => {
    try {
      const data = await apiFetch(`/conversations/${conversationId}`);
      setDetails(data);
      if (data.conversation?.handover_info) {
        setHandoverLoc(data.conversation.handover_info.handover_location || 'Campus Security Office');
        setHandoverTime(data.conversation.handover_info.handover_time || '');
      }
      fetchMessages();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await apiFetch(`/conversations/${conversationId}/messages`);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setActionMsg(''); setError('');
    const textToSend = inputText.trim();
    setInputText('');

    try {
      await apiFetch(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: textToSend })
      });
      fetchMessages();
    } catch (err) {
      setError(err.message);
      setInputText(textToSend);
    }
  };

  const handleShareContact = async () => {
    try {
      await apiFetch(`/conversations/${conversationId}/contact-share`, {
        method: 'POST',
        body: JSON.stringify({ field_type: shareType, consent: true })
      });
      setActionMsg(`Consent granted! Shared verified ${shareType} with recipient.`);
      setShowShareModal(false);
      fetchConversation();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleScheduleHandover = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/conversations/${conversationId}/handover`, {
        method: 'POST',
        body: JSON.stringify({ location: handoverLoc, date_time: handoverTime })
      });
      setActionMsg('Safe handover meeting details updated in chat!');
      fetchConversation();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConfirmHandover = async () => {
    setActionMsg(''); setError('');
    try {
      const res = await apiFetch(`/conversations/${conversationId}/confirm-handover`, { method: 'POST' });
      setActionMsg(res.message);
      fetchConversation();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReportAbuse = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/conversations/${conversationId}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason: reportReason, description: reportDesc })
      });
      setActionMsg('Report submitted to Campus Security for review.');
      setShowReportModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const renderStatusCheck = (m, isMe) => {
    if (!isMe || m.sender_user_id === 'SYSTEM') return null;

    if (m.status === 'SEEN' || m.read_at) {
      return (
        <span
          title={m.read_at ? `Seen at ${new Date(m.read_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Seen by recipient'}
          style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
        >
          Seen ✓✓
        </span>
      );
    }

    if (m.status === 'DELIVERED' || m.delivered_at) {
      return (
        <span
          title="Delivered to recipient"
          style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
        >
          Delivered ✓✓
        </span>
      );
    }

    return (
      <span
        title="Sent"
        style={{ color: '#64748b', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
      >
        Sent ✓
      </span>
    );
  };

  if (loading) return (
    <div style={{ maxWidth: 850, margin: '3rem auto', textAlign: 'center', color: 'var(--text-muted)' }}>
      <p>Opening Secure Private Conversation...</p>
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: 600, margin: '3rem auto', padding: '2rem' }} className="glass-card">
      <h3 style={{ color: '#f87171', fontWeight: 700, marginBottom: '0.5rem' }}>Conversation Access Error</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</p>
      <button onClick={() => navigate(-1)} className="btn btn-outline">
        <ArrowLeft style={{ width: 16, height: 16 }} /> Go Back
      </button>
    </div>
  );

  const conv = details?.conversation;
  const otherParty = user?.role === 'LOST_USER' ? details?.found_user : details?.lost_user;
  const isClosed = conv?.status === 'CLOSED';
  const isBlocked = conv?.status === 'BLOCKED';

  return (
    <div style={{ maxWidth: 850, margin: '1.5rem auto', padding: '0 1rem' }}>
      {/* Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button
          onClick={() => navigate(user?.role === 'FOUND_USER' ? '/found/conversations' : '/lost/conversations')}
          className="btn btn-outline"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <ArrowLeft style={{ width: 14, height: 14 }} /> All Conversations
        </button>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          Reference: <strong>{conv?.verification_request_id || conv?.uuid}</strong>
        </span>
      </div>

      {/* Header Card */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`badge ${isClosed ? 'badge-returned' : 'badge-matched'}`}>
                {conv?.status}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{conv?.uuid}</span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.35rem' }}>
              Secure Verification & Conversation: <span style={{ color: '#38bdf8' }}>{details?.item_name}</span>
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setShowShareModal(true)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              <Share2 style={{ width: 14, height: 14 }} /> Share Contact
            </button>
            <button onClick={() => setShowReportModal(true)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: '#f87171' }}>
              <AlertTriangle style={{ width: 14, height: 14 }} /> Report Problem
            </button>
          </div>
        </div>

        {/* Masked Privacy Badges Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 8, fontSize: '0.85rem' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#34d399', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserCheck style={{ width: 16, height: 16 }} /> Verified Participant: <strong>{otherParty?.name}</strong>
            </div>
            <div style={{ color: 'var(--text-muted)' }}>Email: <strong>{otherParty?.email}</strong></div>
            <div style={{ color: 'var(--text-muted)' }}>Mobile: <strong>{otherParty?.phone}</strong></div>
          </div>

          <div>
            <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock style={{ width: 16, height: 16 }} /> Secure Email-Based Communication
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', lineHeight: 1.4 }}>
              Participants receive email notifications for each reply. Message read status (Seen ✓✓) updates automatically when opened.
            </div>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', padding: '0.75rem 1rem', borderRadius: 6, marginBottom: '1rem', fontSize: '0.85rem' }}>
          {actionMsg}
        </div>
      )}

      {/* Handover & Confirmation Box */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.25rem', background: 'rgba(255,255,255,0.02)' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin style={{ color: '#10b981', width: 18, height: 18 }} /> Safe Campus Handover Planner & Confirmation
        </h4>

        {isClosed ? (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', padding: '1rem', borderRadius: 6, textAlign: 'center', color: '#34d399' }}>
            <FileCheck style={{ width: 32, height: 32, margin: '0 auto 0.5rem auto' }} />
            <strong style={{ fontSize: '1.05rem' }}>Handover Completed & Case Closed!</strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Both parties have confirmed physical recovery of the item.</p>
          </div>
        ) : (
          <div>
            <form onSubmit={handleScheduleHandover} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'end', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Safe Campus Location</label>
                <select className="form-control" value={handoverLoc} onChange={(e) => setHandoverLoc(e.target.value)}>
                  <option value="Campus Security Office">Campus Security Office</option>
                  <option value="College Administration Building">College Administration Building</option>
                  <option value="Main Library Information Desk">Main Library Information Desk</option>
                  <option value="Student Center Help Desk">Student Center Help Desk</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Meeting Date & Time</label>
                <input type="text" className="form-control" placeholder="e.g. Today at 4:00 PM" value={handoverTime} onChange={(e) => setHandoverTime(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                Set Meeting
              </button>
            </form>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <button onClick={handleConfirmHandover} className="btn btn-found" style={{ flex: 1, padding: '0.65rem' }}>
                <CheckCircle2 style={{ width: 16, height: 16 }} />
                {user?.role === 'FOUND_USER' ? 'Confirm Item Handed Over' : 'Confirm Item Received'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages Thread Container */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.25rem', height: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No messages yet. Send a secure message to start the verification conversation!
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_user_id === user?.uuid;
            const isSystem = m.sender_user_id === 'SYSTEM';

            if (isSystem) {
              return (
                <div
                  key={m.id || m.uuid}
                  style={{
                    alignSelf: 'center',
                    maxWidth: '85%',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    color: '#bae6fd',
                    padding: '0.5rem 1rem',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    textAlign: 'center'
                  }}
                >
                  <strong style={{ display: 'block', marginBottom: '0.2rem' }}>{m.sender_name}</strong>
                  <div style={{ whiteSpace: 'pre-line' }}>{m.message_text}</div>
                </div>
              );
            }

            return (
              <div
                key={m.id || m.uuid}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  background: isMe ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.35), rgba(99, 102, 241, 0.35))' : 'rgba(255,255,255,0.05)',
                  border: isMe ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid var(--border-color)',
                  padding: '0.75rem 1rem',
                  borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  color: '#fff'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: isMe ? '#bae6fd' : '#94a3b8', fontWeight: 700, marginBottom: '0.25rem' }}>
                  {m.sender_name} {m.sender_role ? `(${m.sender_role})` : ''}
                </div>
                <div style={{ fontSize: '0.9rem', wordBreak: 'break-word', whiteSpace: 'pre-line', lineHeight: 1.45 }}>
                  {m.message_text}
                </div>
                
                {/* Footer: Time & Status Indicators */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  <span>
                    {new Date(m.sent_at || m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {renderStatusCheck(m, isMe)}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      {!isClosed && !isBlocked ? (
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Type secure reply (recipient will be notified by email)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
            <Send style={{ width: 16, height: 16 }} /> Send Reply
          </button>
        </form>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
          This conversation is closed or locked. No new messages permitted.
        </div>
      )}

      {/* Share Contact Consent Modal */}
      {showShareModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: 460, padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Share Verified Contact Information</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Do you explicitly consent to reveal your verified contact details to this participant?
            </p>
            <div className="form-group">
              <label>Select Field to Share</label>
              <select className="form-control" value={shareType} onChange={(e) => setShareType(e.target.value)}>
                <option value="PHONE">Verified Mobile Number</option>
                <option value="EMAIL">Verified Email Address</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setShowShareModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleShareContact} className="btn btn-primary" style={{ flex: 1 }}>Confirm Share</button>
            </div>
          </div>
        </div>
      )}

      {/* Report Problem Modal */}
      {showReportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: 480, padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f87171', marginBottom: '0.5rem' }}>Report Problem / Abuse</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Submit a report directly to Campus Security & IT Administrators.
            </p>
            <form onSubmit={handleReportAbuse}>
              <div className="form-group">
                <label>Reason</label>
                <select className="form-control" value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                  <option value="Wrong Item">Wrong Item / Unmatched</option>
                  <option value="Suspicious User">Suspicious Behavior</option>
                  <option value="Harassment">Harassment / Inappropriate Content</option>
                  <option value="Item Not Received">Item Not Received</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" rows={3} placeholder="Describe the issue..." value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowReportModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#f43f5e' }}>Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
