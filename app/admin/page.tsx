"use client";

import { useState, useEffect } from "react";
const ADMIN_PASSWORD = "smartlogics123";

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = () => {
    if (input === ADMIN_PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: "16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@700&display=swap');
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        .shake { animation: shake 0.4s ease; }
        .unlock-btn { width:100%;padding:12px;background:#1b3e5c;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:background 0.15s; }
        .unlock-btn:hover { background:#2b7aab; }
        .pw-input { width:100%;padding:12px 16px;border:1.5px solid #e2eaf2;border-radius:10px;font-size:15px;color:#1b3e5c;outline:none;font-family:inherit;transition:border 0.15s;text-align:center;letter-spacing:3px; }
        .pw-input:focus { border-color:#2b7aab; }
      `}</style>
      <div className={shake ? "shake" : ""} style={{ background: "#fff", borderRadius: 20, padding: "40px 28px", width: "100%", maxWidth: 380, boxShadow: "0 8px 40px rgba(27,62,92,0.12)", border: "1px solid #e2eaf2", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, background: "#1b3e5c", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#1b3e5c", marginBottom: 6 }}>Admin Access</h1>
        <p style={{ color: "#7a8fa0", fontSize: 13, marginBottom: 28 }}>Enter your password to continue</p>

        <input
          className="pw-input"
          type="password"
          placeholder="••••••••••••"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false); }}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{ borderColor: error ? "#dc2626" : undefined }}
        />

        {error && <p style={{ color: "#dc2626", fontSize: 12, marginTop: 8 }}>Incorrect password. Try again.</p>}

        <button className="unlock-btn" onClick={handleSubmit} style={{ marginTop: 20 }}>
          Unlock Dashboard
        </button>
        <p style={{ fontSize: 11, color: "#b0bec8", marginTop: 20 }}>Smart Logics Solution · Admin Panel</p>
      </div>
    </div>
  );
}


const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Meeting = {
  id: string;
  client_name: string;
  client_email: string;
  start_time: string;
  end_time: string;
  google_event_id: string;
  meet_link: string;
  status: "upcoming" | "completed" | "canceled";
  purpose: string;
  extra_context?: string;
  contact_number?: string;
};

const STATUS_CONFIG = {
  upcoming:  { color: "#2b7aab", bg: "#e8f2f9", dot: "#2b7aab", label: "Upcoming" },
  completed: { color: "#16a34a", bg: "#dcfce7", dot: "#16a34a", label: "Completed" },
  canceled:  { color: "#dc2626", bg: "#fee2e2", dot: "#dc2626", label: "Canceled"  },
};

const PURPOSE_ICONS: Record<string, string> = {
  "Client Consultation": "💼",
  "Technical Interview": "⚙️",
  "HR Interview": "🤝",
  "General Discussion": "💬",
  "Support Call": "🛠️",
  "Sales Demo / Partnership Discussion": "🚀",
};

function parseTime(iso: string) {
  const date = new Date(iso);
  date.setHours(date.getHours() - 5);
  return date;
}

function formatDate(iso: string) {
  return parseTime(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string) {
  return parseTime(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function timeUntil(iso: string) {
  const diff = parseTime(iso).getTime() - Date.now();
  if (diff < 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h/24)}d away`;
  if (h > 0) return `${h}h ${m}m away`;
  return `${m}m away`;
}
// Minimal markdown renderer
function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 style="font-size:13px;font-weight:700;color:#1b3e5c;margin:16px 0 6px;text-transform:uppercase;letter-spacing:0.5px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:15px;font-weight:700;color:#1b3e5c;margin:20px 0 8px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:18px;font-weight:700;color:#1b3e5c;margin:0 0 12px;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#1b3e5c;font-weight:600;">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li style="margin:4px 0;padding-left:4px;">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, (m) => `<ul style="margin:8px 0;padding-left:20px;list-style:disc;">${m}</ul>`)
    .replace(/\n\n/g, '</p><p style="margin:8px 0;">')
    .replace(/^(?!<[hul])(.+)$/gm, '<p style="margin:6px 0;line-height:1.6;">$1</p>');
}

export default function AdminPage() {
  
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed" | "canceled">("all");
  const [search, setSearch] = useState("");
  const [contextModal, setContextModal] = useState<Meeting | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reminderSentId, setReminderSentId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
 
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMeetings = async () => {
    try {
      const res = await fetch(`${API_BASE}/meetings/getAll`);
      const data = await res.json();
      setMeetings(data.meetings || []);
    } catch {
      showToast("Failed to load meetings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMeetings(); }, []);

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
      showToast("Reminder sent successfully!");
    } catch {
      showToast("Failed to send reminder", "error");
    } finally {
      setTimeout(() => setReminderSentId(null), 2000);
    }
  };

  const filtered = meetings.filter(m => {
    const matchFilter = filter === "all" || m.status === filter;
    const matchSearch = !search || 
      m.client_name.toLowerCase().includes(search.toLowerCase()) ||
      m.client_email.toLowerCase().includes(search.toLowerCase()) ||
      (m.purpose || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  }).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  const stats = {
    total: meetings.length,
    upcoming: meetings.filter(m => m.status === "upcoming").length,
    completed: meetings.filter(m => m.status === "completed").length,
    canceled: meetings.filter(m => m.status === "canceled").length,
  };

  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .card { background: #fff; border-radius: 16px; border: 1px solid #e2eaf2; box-shadow: 0 2px 12px rgba(27,62,92,0.06); }

        .meeting-row {
          background: #fff; border-radius: 14px; border: 1px solid #e2eaf2;
          padding: 16px; transition: all 0.2s ease;
          box-shadow: 0 1px 4px rgba(27,62,92,0.04);
        }
        .meeting-row:hover { border-color: #b8d4e8; box-shadow: 0 4px 20px rgba(27,62,92,0.1); transform: translateY(-1px); }

        .status-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
          letter-spacing: 0.3px;
        }

        .action-btn {
          padding: 7px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
          cursor: pointer; border: none; transition: all 0.15s; font-family: inherit;
          display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
        }

        .filter-tab {
          padding: 7px 12px; border-radius: 8px; font-size: 12px; font-weight: 500;
          cursor: pointer; border: 1.5px solid transparent; transition: all 0.15s;
          font-family: inherit; background: transparent; color: #7a8fa0; white-space: nowrap;
        }
        .filter-tab.active { background: #1b3e5c; color: #fff; border-color: #1b3e5c; }
        .filter-tab:not(.active):hover { background: #e8f2f9; color: #1b3e5c; border-color: #d0dde8; }

        .search-input {
          padding: 9px 14px 9px 38px; border: 1.5px solid #e2eaf2; border-radius: 10px;
          font-size: 13px; color: #1b3e5c; outline: none; font-family: inherit;
          background: #fff; width: 100%; transition: border 0.15s;
        }
        .search-input:focus { border-color: #2b7aab; }

        .modal-overlay {
          position: fixed; inset: 0; background: rgba(15,30,50,0.5);
          display: flex; align-items: flex-end; justify-content: center;
          z-index: 1000; backdrop-filter: blur(6px);
          animation: fadeIn 0.2s ease;
        }
        @media (min-width: 640px) {
          .modal-overlay { align-items: center; }
          .modal-box { border-radius: 20px !important; max-height: 85vh !important; }
        }
        .modal-box {
          background: #fff; border-radius: 20px 20px 0 0; width: 100%; max-width: 640px;
          max-height: 92vh; display: flex; flex-direction: column;
          box-shadow: 0 24px 80px rgba(15,30,50,0.2);
          animation: slideUp 0.25s ease;
        }

        .stat-card {
          background: #fff; border-radius: 14px; padding: 16px;
          border: 1px solid #e2eaf2; box-shadow: 0 2px 8px rgba(27,62,92,0.05);
          flex: 1; min-width: 0;
        }

        .toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 2000;
          padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 500;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15); animation: slideUp 0.2s ease;
          display: flex; align-items: center; gap: 8px; white-space: nowrap;
        }
        @media (min-width: 640px) {
          .toast { left: auto; right: 24px; transform: none; }
        }

        .select-sm {
          padding: 5px 28px 5px 10px; border: 1.5px solid #e2eaf2; border-radius: 7px;
          font-size: 12px; font-weight: 500; color: #1b3e5c; outline: none;
          font-family: inherit; background: #f8fafc; cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%237a8fa0' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 8px center;
          transition: border 0.15s;
        }
        .select-sm:focus { border-color: #2b7aab; }

        /* Sidebar overlay for mobile */
        .sidebar-overlay {
          display: none;
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          z-index: 99; backdrop-filter: blur(2px);
        }
        .sidebar-overlay.open { display: block; }

        /* Sidebar */
        .sidebar {
          width: 220px; background: #1b3e5c; padding: 28px 20px;
          display: flex; flex-direction: column; gap: 8px;
          position: fixed; top: 0; left: 0; height: 100vh;
          z-index: 100; transform: translateX(-100%);
          transition: transform 0.25s ease;
        }
        .sidebar.open { transform: translateX(0); }
        @media (min-width: 768px) {
          .sidebar { position: sticky; transform: none !important; }
          .sidebar-overlay { display: none !important; }
          .mobile-topbar { display: none !important; }
        }

        /* Mobile top bar */
        .mobile-topbar {
          display: flex; align-items: center; justify-content: space-between;
          background: #1b3e5c; padding: 14px 16px;
          position: sticky; top: 0; z-index: 50;
        }

        /* Stats grid */
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }
        @media (min-width: 640px) {
          .stats-grid { grid-template-columns: repeat(4, 1fr); }
        }

        /* Filter scroll */
        .filter-scroll {
          display: flex; gap: 6px; overflow-x: auto;
          padding-bottom: 4px; -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .filter-scroll::-webkit-scrollbar { display: none; }

        /* Main layout */
        .app-layout {
          display: flex; min-height: 100vh;
        }
        .main-content {
          flex: 1; padding: 20px 16px; overflow-y: auto; min-width: 0;
        }
        @media (min-width: 768px) {
          .main-content { padding: 32px 36px; }
        }

        /* Meeting meta info wraps nicely */
        .meeting-meta {
          display: flex; gap: 12px; flex-wrap: wrap;
          font-size: 12px; color: #7a8fa0; margin-bottom: 10px;
        }

        /* Action buttons wrap */
        .action-row {
          display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
        }

        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }
      `}</style>

      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button
          onClick={() => setSidebarOpen(true)}
          style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#fff" }}>Smart Logics</span>
        <button
          onClick={fetchMeetings}
          style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "8px 10px", cursor: "pointer", color: "#fff", fontSize: 16 }}
        >
          ↻
        </button>
      </div>

      {/* Sidebar overlay (mobile) */}
      <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      <div className="app-layout">
        {/* Sidebar */}
        {/* <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, background: "#2b7aab", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>Smart Logics<br/><span style={{ fontSize: 11, fontWeight: 400, color: "#7aadcf", fontFamily: "'DM Sans', sans-serif" }}>Admin Panel</span></span>
            </div>
          </div>

          {[
            { icon: "▦", label: "Dashboard", active: true },
            { icon: "📅", label: "Meetings", active: false },
            { icon: "👥", label: "Clients", active: false },
            { icon: "⚙️", label: "Settings", active: false },
          ].map(item => (
            <div key={item.label}
              onClick={() => setSidebarOpen(false)}
              style={{
                padding: "10px 14px", borderRadius: 10, display: "flex", alignItems: "center", gap: 10,
                background: item.active ? "rgba(43,122,171,0.25)" : "transparent",
                color: item.active ? "#fff" : "#7aadcf", fontSize: 13, fontWeight: item.active ? 600 : 400,
                cursor: "pointer", transition: "all 0.15s",
                borderLeft: item.active ? "3px solid #2b7aab" : "3px solid transparent"
              }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>{item.label}
            </div>
          ))}

          <div style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 11, color: "#7aadcf", marginBottom: 8 }}>SYSTEM</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, background: "#22c55e", borderRadius: "50%", animation: "pulse 2s infinite" }}/>
              <span style={{ fontSize: 12, color: "#a8c8e0" }}>API Online</span>
            </div>
          </div>
        </aside> */}

        {/* Main */}
        <main className="main-content">

          {/* Header — hidden on mobile (handled by topbar) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#1b3e5c", marginBottom: 4 }}>
                Meetings Dashboard
              </h1>
              <p style={{ color: "#7a8fa0", fontSize: 13 }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            {/* Desktop refresh button */}
            <button
              onClick={fetchMeetings}
              style={{ padding: "10px 18px", background: "#1b3e5c", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "none" }}
              className="desktop-refresh"
            >
              ↻ Refresh
            </button>
          </div>

          {/* Stats grid */}
          <div className="stats-grid">
            {[
              { label: "Total", value: stats.total, color: "#1b3e5c" },
              { label: "Upcoming", value: stats.upcoming, color: "#2b7aab"},
              { label: "Completed", value: stats.completed, color: "#16a34a" },
              { label: "Canceled", value: stats.canceled, color: "#dc2626" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#7a8fa0", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{s.label}</p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
                  </div>
                 
                </div>
              </div>
            ))}
          </div>

          {/* Filters + Search */}
          <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="filter-scroll">
              {(["all","upcoming","completed","canceled"] as const).map(f => (
                <button key={f} className={`filter-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  <span style={{ marginLeft: 5, background: filter === f ? "rgba(255,255,255,0.2)" : "#e8f2f9", color: filter === f ? "#fff" : "#2b7aab", borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>
                    {f === "all" ? stats.total : stats[f]}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7a8fa0" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="search-input" placeholder="Search name, email, purpose..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Meetings list */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#7a8fa0" }}>
              <div style={{ fontSize: 32, marginBottom: 12, animation: "pulse 1.5s infinite" }}>⏳</div>
              <p style={{ fontSize: 14 }}>Loading meetings...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#7a8fa0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <p style={{ fontSize: 15, fontWeight: 500 }}>No meetings found</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your filters</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map(meeting => {
                const sc = STATUS_CONFIG[meeting.status];
                const until = timeUntil(meeting.start_time);
                const purposeIcon = PURPOSE_ICONS[meeting.purpose] || "📋";
                const isUpdating = updatingId === meeting.google_event_id;
                const reminderSent = reminderSentId === meeting.google_event_id;

                return (
                  <div key={meeting.id} className="meeting-row">
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>

                      {/* Purpose icon */}
                      <div style={{ width: 40, height: 40, background: "#f0f7fc", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        {purposeIcon}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Name + status row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: "#1b3e5c" }}>{meeting.client_name}</span>
                          <span className="status-badge" style={{ background: sc.bg, color: sc.color }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc.dot, display: "inline-block" }}/>
                            {sc.label}
                          </span>
                          {until && meeting.status === "upcoming" && (
                            <span style={{ fontSize: 11, color: "#2b7aab", background: "#e8f2f9", padding: "2px 8px", borderRadius: 10, fontWeight: 500 }}>
                              🕐 {until}
                            </span>
                          )}
                        </div>

                        {/* Meta info */}
                        <div className="meeting-meta">
                          <span>✉️ {meeting.client_email}</span>
                          <span>📅 {formatDate(meeting.start_time)}</span>
                          <span>🕐 {formatTime(meeting.start_time)} – {formatTime(meeting.end_time)}</span>
                          {meeting.purpose && <span> {meeting.purpose}</span>}
                        </div>

                        {/* Actions row */}
                        <div className="action-row">

                          {/* Meet link */}
                          <a href={meeting.meet_link} target="_blank" rel="noopener noreferrer"
                            style={{ padding: "6px 12px", background: "#1b3e5c", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
                             Join Meet
                          </a>

                          {/* WhatsApp */}
                          <a href={`https://wa.me/${meeting.contact_number}?text=${encodeURIComponent(`Hi ${meeting.client_name}, your meeting is scheduled on ${formatDate(meeting.start_time)} at ${formatTime(meeting.start_time)}. Join here: ${meeting.meet_link}`)}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ padding: "6px 12px", background: "#25D366", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            WhatsApp
                          </a>

                          {/* Send Reminder */}
                          {meeting.status === "upcoming" && (
                            <button className="action-btn"
                              onClick={() => sendReminder(meeting.google_event_id)}
                              style={{ background: reminderSent ? "#dcfce7" : "#fff3e0", color: reminderSent ? "#16a34a" : "#d97706", border: `1.5px solid ${reminderSent ? "#bbf7d0" : "#fed7aa"}` }}>
                              {reminderSent ? "✓ Sent!" : " Remind"}
                            </button>
                          )}

                          {/* Context button */}
                          {meeting.extra_context && (
                            <button className="action-btn"
                              onClick={() => setContextModal(meeting)}
                              style={{ background: "#f0f7fc", color: "#2b7aab", border: "1.5px solid #c8dff0" }}>
                              ✦ AI Context
                            </button>
                          )}

                          {/* Status select */}
                          <select className="select-sm"
                            value={meeting.status}
                            disabled={isUpdating}
                            onChange={e => updateStatus(meeting.google_event_id, e.target.value)}
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="completed">Completed</option>
                            <option value="canceled">Canceled</option>
                          </select>

                          {isUpdating && <span style={{ fontSize: 11, color: "#7a8fa0", animation: "pulse 1s infinite" }}>Updating...</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Context Modal */}
      {contextModal && (
        <div className="modal-overlay" onClick={() => setContextModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #eef2f6", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>{PURPOSE_ICONS[contextModal.purpose] || "📋"}</span>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#1b3e5c" }}>AI Meeting Context</h2>
                </div>
                <p style={{ fontSize: 12, color: "#7a8fa0" }}>
                  {contextModal.client_name} · {contextModal.purpose} · {formatDate(contextModal.start_time)}
                </p>
              </div>
              <button onClick={() => setContextModal(null)}
                style={{ width: 30, height: 30, borderRadius: "50%", border: "1.5px solid #e2eaf2", background: "#fff", cursor: "pointer", fontSize: 16, color: "#7a8fa0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                ×
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "16px", border: "1px solid #e2eaf2", fontSize: 13, color: "#374151", lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(contextModal.extra_context || "") }}
              />
            </div>

            {/* Modal footer */}
            <div style={{ padding: "14px 20px", borderTop: "1px solid #eef2f6", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <a href={`https://wa.me/?text=${encodeURIComponent(`Meeting context for ${contextModal.client_name}:\n\n${contextModal.extra_context}`)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ padding: "8px 14px", background: "#25D366", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                Share via WhatsApp
              </a>
              <button onClick={() => setContextModal(null)}
                style={{ padding: "8px 18px", background: "#1b3e5c", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast" style={{ background: toast.type === "success" ? "#1b3e5c" : "#dc2626", color: "#fff" }}>
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
}