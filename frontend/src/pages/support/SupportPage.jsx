import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ShieldCheck, Search, KeyRound, AlertTriangle, MessageSquare } from 'lucide-react';

export default function SupportPage() {
  const faqs = [
    {
      q: 'How does the AI matching confidence score work?',
      a: 'The multimodal AI engine compares visual feature vectors (OpenCV color histogram and structural contours), text description semantics, brand/model attributes, campus location proximity, and reporting timestamps. Scores above 70% are presented as Potential Matches with itemized reasons.'
    },
    {
      q: 'Why can’t I see the finder’s phone number or email address?',
      a: 'To prevent harassment, impersonation, and fraudulent claims, campus security requires a Zero-Trust Privacy architecture. When you submit a Verification Request, the finder is notified through official campus channels. Contact details can only be revealed if both parties mutually grant in-app consent.'
    },
    {
      q: 'What is a "Secret Attribute"?',
      a: 'When reporting a lost item, you can specify a secret attribute—a detail only the true owner would know, such as lock screen wallpaper, an engraving, or hidden pocket contents. This gives you a fast way to prove ownership without dispute.'
    },
    {
      q: 'What should I do if an item is high-value or contains sensitive data?',
      a: 'For high-value electronics (laptops, phones) or sensitive documents, finders are encouraged to hand the item over directly to the Campus Security Desk located at the Central Library Ground Floor.'
    }
  ];

  return (
    <div style={{ maxWidth: 840, margin: '2rem auto', padding: '0 1.5rem 4rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <span className="badge badge-active" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          HELP & FAQS
        </span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Campus Support & FAQs</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 600, margin: '0.5rem auto 0 auto' }}>
          Frequently asked questions regarding campus recovery, verification, and safety.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '3rem' }}>
        {faqs.map((faq, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HelpCircle style={{ width: 18, height: 18, color: '#38bdf8', flexShrink: 0 }} />
              {faq.q}
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6, paddingLeft: '1.75rem' }}>
              {faq.a}
            </p>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', background: 'rgba(99, 102, 241, 0.08)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Still Have Questions?</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Our security staff and IT helpdesk are ready to assist you.
        </p>
        <Link to="/contact" className="btn btn-primary btn-sm">
          Contact Campus Helpdesk
        </Link>
      </div>
    </div>
  );
}
