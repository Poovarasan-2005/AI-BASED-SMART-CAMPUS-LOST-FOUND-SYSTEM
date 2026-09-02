import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { QrCode, FileCheck, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function HandoverQRScanner() {
  const { recoveryId } = useParams();
  const [recoveryDoc, setRecoveryDoc] = useState(null);
  const [qrInput, setQrInput] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecovery();
  }, [recoveryId]);

  const fetchRecovery = async () => {
    try {
      const data = await apiFetch(`/recovery/${recoveryId}`);
      setRecoveryDoc(data.recovery_record);
      if (data.recovery_record?.qr_token) {
        setQrInput(data.recovery_record.qr_token);
      }
      if (data.receipt) {
        setReceipt(data.receipt);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyQR = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      const res = await apiFetch(`/recovery/${recoveryId}/verify-qr`, {
        method: 'POST',
        body: JSON.stringify({ qr_token: qrInput })
      });
      setMsg(res.message);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCompleteHandover = async () => {
    setError('');
    try {
      const res = await apiFetch(`/recovery/${recoveryId}/complete`, { method: 'POST' });
      setReceipt(res.receipt);
      setMsg(res.message);
      fetchRecovery();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p style={{ padding: '2rem' }}>Loading handover details...</p>;
  
  if (error || !recoveryDoc) return (
    <div style={{ maxWidth: 540, margin: '4rem auto', textAlign: 'center' }}>
      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f87171', marginBottom: '0.75rem' }}>Recovery Record Not Found</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {error || `Recovery record '${recoveryId}' could not be located on the server.`}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Link to="/found/dashboard" className="btn btn-found">
            <ArrowLeft style={{ width: 16, height: 16 }} /> Found Dashboard
          </Link>
          <Link to="/lost/dashboard" className="btn btn-primary">
            Lost Dashboard
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: '2rem auto' }}>
      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <QrCode style={{ width: 48, height: 48, color: '#10b981', margin: '0 auto 0.75rem auto' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Secure QR Handover Portal</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Validate temporary recovery QR token & issue digital receipt</p>
        </div>

        {receipt ? (
          /* Official Digital Recovery Receipt */
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '2px dashed #10b981', padding: '2rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <FileCheck style={{ width: 48, height: 48, color: '#10b981', margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399', marginBottom: '0.25rem' }}>{receipt.title}</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Recovery ID: {receipt.recovery_id}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 8, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <div>Item: <strong>{receipt.item_name}</strong></div>
              <div>Verification: <strong>{receipt.verification_status}</strong></div>
              <div>Handover Status: <strong>{receipt.handover_status}</strong></div>
              <div>Final Case Status: <strong style={{ color: '#34d399' }}>{receipt.final_status}</strong></div>
              <div>Timestamp: <strong>{new Date(receipt.date).toLocaleString()}</strong></div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Issued by: {receipt.issued_by}</div>
          </div>
        ) : (
          <div>
            {msg && <div style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem', fontSize: '0.85rem' }}>{msg}</div>}

            <form onSubmit={handleVerifyQR} style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Recovery QR Token String</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Scan or enter QR token string..."
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-outline" style={{ width: '100%' }}>
                Verify QR Token Server Record
              </button>
            </form>

            <button onClick={handleCompleteHandover} className="btn btn-found" style={{ width: '100%', padding: '0.85rem' }}>
              <ShieldCheck style={{ width: 18, height: 18 }} /> Confirm Physical Handover & Close Case
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
