"use client";

import { useState, useEffect, useCallback } from "react";

const ADMIN_PASSWORD = "smartlogics123";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────
type Meeting = {
  id: string;
  client_name: string;
  client_email: string;
  contact_number?: string;
  start_time: string;
  end_time: string;
  google_event_id: string;
  meet_link: string;
  status: "upcoming" | "completed" | "canceled";
  purpose: string;
  extra_context?: string;
  note?: string;
};

type Tab = "today" | "upcoming" | "past";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseTime(iso: string) {
  const d = new Date(iso);
  d.setHours(d.getHours() - 5);
  return d;
}
function formatDate(iso: string) {
  return parseTime(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function formatTime(iso: string) {
  return parseTime(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
function formatDateFull(iso: string) {
  return parseTime(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function timeUntil(iso: string) {
  const diff = parseTime(iso).getTime() - Date.now();
  if (diff < 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `in ${Math.floor(h / 24)}d`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}
function isToday(iso: string) {
  const d = parseTime(iso);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}
function isPast(iso: string) {
  return parseTime(iso) < new Date() && !isToday(iso);
}
function isUpcoming(iso: string) {
  return parseTime(iso) > new Date() && !isToday(iso);
}

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 style="font-size:11px;font-weight:700;color:#0f172a;margin:14px 0 5px;text-transform:uppercase;letter-spacing:0.8px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:13px;font-weight:700;color:#0f172a;margin:16px 0 6px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:15px;font-weight:700;color:#0f172a;margin:0 0 10px;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#0f172a;font-weight:600;">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li style="margin:3px 0;padding-left:4px;">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, m => `<ul style="margin:6px 0;padding-left:18px;list-style:disc;">${m}</ul>`)
    .replace(/\n\n/g, '</p><p style="margin:7px 0;">')
    .replace(/^(?!<[hul])(.+)$/gm, '<p style="margin:5px 0;line-height:1.6;">$1</p>');
}

const PURPOSE_ICONS: Record<string, React.ReactNode> = {
  "Client Consultation": <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
  "Technical Interview": <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  "HR Interview": <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  "General Discussion": <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  "Support Call": <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.12 1.18 2 2 0 012.1 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>,
  "Sales Demo / Partnership Discussion": <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
};

const STATUS_CONFIG = {
  upcoming:  { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", label: "Upcoming" },
  completed: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Completed" },
  canceled:  { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Canceled" },
};

// ─── Password Gate ────────────────────────────────────────────────────────────
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = () => {
    if (input === ADMIN_PASSWORD) { onUnlock(); }
    else { setError(true); setShake(true); setTimeout(() => setShake(false), 400); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: 16 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%,75%{transform:translateX(-6px)} 50%{transform:translateX(6px)} }
        .shake { animation: shake 0.35s ease; }
      `}</style>
      <div className={shake ? "shake" : ""} style={{ background: "#fff", borderRadius: 16, padding: "40px 32px", width: "100%", maxWidth: 360, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", textAlign: "center" }}>
        <div style={{ width: 44, height: 44, background: "#0f172a", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: "#0f172a", marginBottom: 6, fontWeight: 400 }}>Admin Access</h1>
        <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 28 }}>Smart Logics Solution</p>
        <input type="password" placeholder="Enter password" value={input}
          onChange={e => { setInput(e.target.value); setError(false); }}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${error ? "#fca5a5" : "#e2e8f0"}`, borderRadius: 8, fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit", background: error ? "#fef2f2" : "#f8fafc", letterSpacing: 4, textAlign: "center", marginBottom: 8 }}
        />
        {error && <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>Incorrect password</p>}
        <button onClick={handleSubmit} style={{ width: "100%", padding: "11px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: error ? 0 : 8 }}>
          Continue
        </button>
      </div>
    </div>
  );
}

// ─── Note Modal ───────────────────────────────────────────────────────────────
function NoteModal({ meeting, onClose, onSave }: { meeting: Meeting; onClose: () => void; onSave: (id: string, note: string) => Promise<void>; }) {
  const [text, setText] = useState(meeting.note || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(meeting.id, text);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520, boxShadow: "0 24px 60px rgba(0,0,0,0.15)", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>Meeting Note</h3>
            <p style={{ fontSize: 12, color: "#94a3b8" }}>{meeting.client_name} · {formatDate(meeting.start_time)}</p>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ padding: 24 }}>
          <textarea value={text} onChange={e => { setText(e.target.value); setSaved(false); }}
            placeholder="Add notes, talking points, follow-ups..."
            autoFocus
            style={{ width: "100%", minHeight: 180, padding: "12px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#0f172a", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", background: "#f8fafc" }}
            onFocus={e => e.target.style.borderColor = "#6366f1"}
            onBlur={e => e.target.style.borderColor = "#e2e8f0"}
          />
          <p style={{ fontSize: 11, color: "#cbd5e1", marginTop: 6 }}>{text.length} characters</p>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
          {saved && <span style={{ fontSize: 12, color: "#16a34a", display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Saved
          </span>}
          <button onClick={onClose} style={{ padding: "8px 16px", background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: "8px 18px", background: saving ? "#94a3b8" : "#0f172a", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {saving ? "Saving..." : "Save Note"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Context Modal ────────────────────────────────────────────────────────────
function ContextModal({ meeting, onClose }: { meeting: Meeting; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 600, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>AI Meeting Context</h3>
            <p style={{ fontSize: 12, color: "#94a3b8" }}>{meeting.client_name} · {meeting.purpose} · {formatDate(meeting.start_time)}</p>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16, border: "1px solid #e2e8f0", fontSize: 13, color: "#374151", lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(meeting.extra_context || "") }} />
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <a href={`https://wa.me/${meeting.contact_number}?text=${encodeURIComponent(`Meeting context for ${meeting.client_name}:\n\n${meeting.extra_context}`)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ padding: "8px 14px", background: "#22c55e", color: "#fff", borderRadius: 7, fontSize: 13, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Share
          </a>
          <button onClick={onClose} style={{ padding: "8px 18px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Modal ───────────────────────────────────────────────────────────
function SettingsModal({ onClose }: { onClose: () => void }) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/apis/meetings/settings")
      .then(r => r.json())
      .then(d => { setStartTime(d.start_time || "09:00"); setEndTime(d.end_time || "17:00"); })
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!startTime || !endTime) return;
    if (startTime >= endTime) { setError("Start time must be before end time"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/apis/meetings/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_time: startTime, end_time: endTime }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420, boxShadow: "0 24px 60px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>Availability Settings</h3>
            <p style={{ fontSize: 12, color: "#94a3b8" }}>Configure your bookable time range</p>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ padding: 24 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 13 }}>Loading...</div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Start Time</label>
                  <input type="time" value={startTime} onChange={e => { setStartTime(e.target.value); setSaved(false); setError(""); }}
                    style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit", background: "#f8fafc" }}
                    onFocus={e => e.target.style.borderColor = "#6366f1"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 6 }}>End Time</label>
                  <input type="time" value={endTime} onChange={e => { setEndTime(e.target.value); setSaved(false); setError(""); }}
                    style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit", background: "#f8fafc" }}
                    onFocus={e => e.target.style.borderColor = "#6366f1"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  />
                </div>
              </div>
              {startTime && endTime && startTime < endTime && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#166534", marginBottom: 16 }}>
                  Slots from <strong>{startTime}</strong> to <strong>{endTime}</strong> — 30-min intervals
                </div>
              )}
              {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#991b1b", marginBottom: 16 }}>{error}</div>}
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                <strong style={{ color: "#374151" }}>Note:</strong> Changes apply to new bookings only. Existing meetings are not affected.
              </div>
            </>
          )}
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
          {saved && <span style={{ fontSize: 12, color: "#16a34a", display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Saved
          </span>}
          <button onClick={onClose} style={{ padding: "8px 16px", background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || loading}
            style={{ padding: "8px 18px", background: saving ? "#94a3b8" : "#0f172a", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Meeting Card ─────────────────────────────────────────────────────────────
function MeetingCard({ meeting, onUpdateStatus, onSendReminder, onOpenNote, onOpenContext, updatingId, reminderSentId }: {
  meeting: Meeting;
  onUpdateStatus: (eventId: string, status: string) => void;
  onSendReminder: (eventId: string) => void;
  onOpenNote: (m: Meeting) => void;
  onOpenContext: (m: Meeting) => void;
  updatingId: string | null;
  reminderSentId: string | null;
}) {
  const sc = STATUS_CONFIG[meeting.status];
  const until = timeUntil(meeting.start_time);
  const isUpdating = updatingId === meeting.google_event_id;
  const reminderSent = reminderSentId === meeting.google_event_id;
  const purposeIcon = PURPOSE_ICONS[meeting.purpose];

  return (
    <div
      style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "16px 20px", transition: "box-shadow 0.15s, border-color 0.15s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#cbd5e1"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        {/* Time block */}
        <div style={{ minWidth: 60, textAlign: "center", paddingTop: 2, flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{formatTime(meeting.start_time)}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{formatTime(meeting.end_time)}</div>
          {until && meeting.status === "upcoming" && (
            <div style={{ fontSize: 10, color: "#6366f1", fontWeight: 600, marginTop: 5, background: "#eef2ff", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap" }}>{until}</div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: "#f1f5f9", alignSelf: "stretch", flexShrink: 0 }} />

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{meeting.client_name}</span>
            <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
              {sc.label}
            </span>
            {meeting.purpose && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "2px 8px", borderRadius: 4 }}>
                <span style={{ color: "#94a3b8", display: "flex" }}>{purposeIcon}</span>
                {meeting.purpose}
              </span>
            )}
          </div>

          {/* Meta row */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "#64748b", marginBottom: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              {meeting.client_email}
            </span>
            {meeting.contact_number && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.12 1.18 2 2 0 012.1 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                {meeting.contact_number}
              </span>
            )}
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {formatDateFull(meeting.start_time)}
            </span>
          </div>

          {/* Note preview */}
          {meeting.note && (
            <div onClick={() => onOpenNote(meeting)}
              style={{ marginBottom: 12, padding: "7px 11px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, fontSize: 12, color: "#92400e", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{meeting.note}</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <a href={meeting.meet_link} target="_blank" rel="noopener noreferrer"
              style={{ padding: "6px 12px", background: "#0f172a", color: "#fff", borderRadius: 7, fontSize: 12, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
              Join
            </a>
            <a href={`https://wa.me/${meeting.contact_number}?text=${encodeURIComponent(`Hi ${meeting.client_name}, your meeting is scheduled on ${formatDate(meeting.start_time)} at ${formatTime(meeting.start_time)}. Join here: ${meeting.meet_link}`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ padding: "6px 12px", background: "#22c55e", color: "#fff", borderRadius: 7, fontSize: 12, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            {meeting.status === "upcoming" && (
              <button onClick={() => onSendReminder(meeting.google_event_id)}
                style={{ padding: "6px 12px", background: reminderSent ? "#f0fdf4" : "#fefce8", color: reminderSent ? "#16a34a" : "#a16207", border: `1px solid ${reminderSent ? "#bbf7d0" : "#fde68a"}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                {reminderSent ? "Sent" : "Remind"}
              </button>
            )}
            {meeting.extra_context && (
              <button onClick={() => onOpenContext(meeting)}
                style={{ padding: "6px 12px", background: "#f8fafc", color: "#6366f1", border: "1px solid #e0e7ff", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                AI Context
              </button>
            )}
            <button onClick={() => onOpenNote(meeting)}
              style={{ padding: "6px 12px", background: meeting.note ? "#fffbeb" : "#f8fafc", color: meeting.note ? "#a16207" : "#64748b", border: `1px solid ${meeting.note ? "#fde68a" : "#e2e8f0"}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              {meeting.note ? "Note" : "Add Note"}
            </button>
            <select value={meeting.status} disabled={isUpdating} onChange={e => onUpdateStatus(meeting.google_event_id, e.target.value)}
              style={{ padding: "6px 28px 6px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, fontWeight: 500, color: "#374151", outline: "none", fontFamily: "inherit", background: "#f8fafc", cursor: "pointer", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </select>
            {isUpdating && <span style={{ fontSize: 11, color: "#94a3b8" }}>Updating...</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [search, setSearch] = useState("");
  const [contextModal, setContextModal] = useState<Meeting | null>(null);
  const [noteModal, setNoteModal] = useState<Meeting | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reminderSentId, setReminderSentId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/meetings/getAll`);
      const data = await res.json();
      setMeetings(data.meetings || []);
    } catch {
      showToast("Failed to load meetings", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const updateStatus = async (eventId: string, status: string) => {
    setUpdatingId(eventId);
    try {
      await fetch(`${API_BASE}/meetings/updateStatus?event_id=${encodeURIComponent(eventId)}&status=${status}`, { method: "POST" });
      setMeetings(m => m.map(x => x.google_event_id === eventId ? { ...x, status: status as Meeting["status"] } : x));
      showToast(`Status updated to ${status}`);
    } catch {
      showToast("Failed to update status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const sendReminder = async (eventId: string) => {
    setReminderSentId(eventId);
    try {
      await fetch(`${API_BASE}/meetings/sendReminder?event_id=${encodeURIComponent(eventId)}`, { method: "POST" });
      showToast("Reminder sent!");
    } catch {
      showToast("Failed to send reminder", "error");
    } finally {
      setTimeout(() => setReminderSentId(null), 2000);
    }
  };

  const saveNote = async (meetingId: string, note: string) => {
    try {
      const res = await fetch("/api/meetings/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting_id: meetingId, note }),
      });
      if (!res.ok) throw new Error();
      setMeetings(m => m.map(x => x.id === meetingId ? { ...x, note } : x));
      setNoteModal(prev => prev?.id === meetingId ? { ...prev, note } : prev);
      showToast("Note saved");
    } catch {
      showToast("Failed to save note", "error");
    }
  };

  const todayMeetings    = meetings.filter(m => isToday(m.start_time));
  const upcomingMeetings = meetings.filter(m => isUpcoming(m.start_time));
  const pastMeetings     = meetings.filter(m => isPast(m.start_time));
  const buckets: Record<Tab, Meeting[]> = { today: todayMeetings, upcoming: upcomingMeetings, past: pastMeetings };

  const applySearch = (list: Meeting[]) => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(m => m.client_name.toLowerCase().includes(q) || m.client_email.toLowerCase().includes(q) || (m.purpose || "").toLowerCase().includes(q));
  };

  const displayed = applySearch(buckets[activeTab]).sort((a, b) =>
    activeTab === "past"
      ? new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      : new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const tabConfig: { key: Tab; label: string; count: number }[] = [
    { key: "today",    label: "Today",    count: todayMeetings.length },
    { key: "upcoming", label: "Upcoming", count: upcomingMeetings.length },
    { key: "past",     label: "Past",     count: pastMeetings.length },
  ];

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(8px);  } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .tab-btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; background: transparent; color: #64748b; font-family: inherit; transition: all 0.15s; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
        .tab-btn.active { background: #fff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.08); font-weight: 600; }
        .tab-btn:not(.active):hover { background: #f1f5f9; color: #374151; }
        .count-pill { font-size: 11px; padding: 1px 7px; border-radius: 20px; font-weight: 600; background: #f1f5f9; color: #94a3b8; }
        .tab-btn.active .count-pill { color: #374151; }

        .header-btn { padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid #e2e8f0; background: #fff; color: #374151; font-family: inherit; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; }
        .header-btn:hover { background: #f8fafc; border-color: #cbd5e1; }

        .search-wrap { position: relative; }
        .search-wrap input { width: 100%; padding: 9px 12px 9px 34px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #0f172a; outline: none; font-family: inherit; background: #fff; transition: border 0.15s; }
        .search-wrap input:focus { border-color: #6366f1; }
        .search-wrap svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }

        .empty-state { text-align: center; padding: 60px 0; color: #94a3b8; animation: fadeIn 0.3s ease; }
        .meetings-list { display: flex; flex-direction: column; gap: 10px; animation: fadeIn 0.25s ease; }

        @media (max-width: 640px) {
          .top-header { padding: 12px 16px !important; }
          .main-body  { padding: 16px !important; }
          .stats-row  { grid-template-columns: 1fr 1fr !important; }
          .tabs-row   { flex-direction: column; align-items: stretch !important; }
        }
      `}</style>

      {/* Header */}
      <div className="top-header" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#0f172a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 17, color: "#0f172a", fontWeight: 400 }}>Smart Logics</span>
          <span style={{ fontSize: 11, color: "#94a3b8", background: "#f1f5f9", padding: "2px 8px", borderRadius: 4, fontWeight: 500 }}>Admin</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="header-btn" onClick={() => setShowSettings(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            Availability
          </button>
          <button className="header-btn" onClick={fetchMeetings}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="main-body" style={{ maxWidth: 900, margin: "0 auto", padding: "28px 32px" }}>

        {/* Stats */}
        <div className="stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Today",      value: todayMeetings.length,    color: "#6366f1", sub: `${todayMeetings.filter(m => m.status === "upcoming").length} upcoming` },
            { label: "Upcoming",   value: upcomingMeetings.length,  color: "#2563eb", sub: "future meetings" },
            { label: "Past",       value: pastMeetings.length,      color: "#64748b", sub: `${pastMeetings.filter(m => m.status === "completed").length} completed` },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{s.label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: "#94a3b8" }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs + search */}
        <div className="tabs-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4, background: "#f1f5f9", padding: 4, borderRadius: 10, flexShrink: 0 }}>
            {tabConfig.map(t => (
              <button key={t.key} className={`tab-btn ${activeTab === t.key ? "active" : ""}`} onClick={() => setActiveTab(t.key)}>
                {t.label} <span className="count-pill">{t.count}</span>
              </button>
            ))}
          </div>
          <div className="search-wrap" style={{ minWidth: 200, flex: "0 1 260px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search meetings..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Section title */}
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>
            {activeTab === "today"    && "Today's Meetings"}
            {activeTab === "upcoming" && "Upcoming Meetings"}
            {activeTab === "past"     && "Past Meetings"}
          </h2>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>
            {activeTab === "today"    && new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            {activeTab === "upcoming" && `${upcomingMeetings.length} meeting${upcomingMeetings.length !== 1 ? "s" : ""} scheduled`}
            {activeTab === "past"     && `${pastMeetings.length} meeting${pastMeetings.length !== 1 ? "s" : ""} in history`}
          </p>
        </div>

        {/* List */}
        {loading ? (
          <div className="empty-state">
            <div style={{ width: 32, height: 32, border: "2px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
            <p style={{ fontSize: 14 }}>Loading meetings...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <div style={{ width: 40, height: 40, background: "#f1f5f9", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>
              {search ? "No meetings match your search" : `No ${activeTab} meetings`}
            </p>
            <p style={{ fontSize: 12, marginTop: 4 }}>{search ? "Try different keywords" : activeTab === "today" ? "Nothing scheduled for today" : ""}</p>
          </div>
        ) : (
          <div className="meetings-list">
            {displayed.map(m => (
              <MeetingCard key={m.id} meeting={m}
                onUpdateStatus={updateStatus} onSendReminder={sendReminder}
                onOpenNote={setNoteModal} onOpenContext={setContextModal}
                updatingId={updatingId} reminderSentId={reminderSentId}
              />
            ))}
          </div>
        )}
      </div>

      {noteModal    && <NoteModal    meeting={noteModal}    onClose={() => setNoteModal(null)}    onSave={saveNote} />}
      {contextModal && <ContextModal meeting={contextModal} onClose={() => setContextModal(null)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2000, padding: "11px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500, background: toast.type === "success" ? "#0f172a" : "#dc2626", color: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: 8, animation: "slideUp 0.2s ease" }}>
          {toast.type === "success"
            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
          {toast.msg}
        </div>
      )}
    </div>
  );
}