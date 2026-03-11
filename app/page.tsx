"use client";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const PURPOSES = [
  "Client Consultation",
  "Technical Interview",
  "HR Interview",
  "General Discussion",
  "Support Call",
  "Sales Demo / Partnership Discussion",
];

const PURPOSE_PLACEHOLDERS: Record<string, string> = {
  "Client Consultation": "Briefly describe the project — goals, tech stack, timeline, budget...",
  "Technical Interview": "What position are you applying for",
  "HR Interview": "What position are you applying for",
  "General Discussion": "What would you like to discuss?",
  "Support Call": "Describe the problem you're facing — what happened, what you tried...",
  "Sales Demo / Partnership Discussion": "Describe the service or product you're presenting, and the prospect...",
};

const PURPOSE_LABELS: Record<string, string> = {
  "Client Consultation": "Project Info",
  "Technical Interview": "Position Applied For",
  "HR Interview": "Position Applied For",
  "General Discussion": "Context (optional)",
  "Support Call": "Problem Description",
  "Sales Demo / Partnership Discussion": "Service / Context",
};

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatTime(isoStr: string) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function toLocalISO(isoStr: string) {
  const d = new Date(isoStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

export default function BookingPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", contact_number: "", purpose: "", userInput: "" });
  const [booking, setBooking] = useState(false);
  const [modal, setModal] = useState<{ meetLink: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDate(null); setSlots([]); setSelectedSlot(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDate(null); setSlots([]); setSelectedSlot(null);
  };

  const isPast = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    const t = new Date(); t.setHours(0,0,0,0);
    return d < t;
  };

  const isWeekend = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    return d.getDay() === 0 || d.getDay() === 6;
  };

  const handleDateClick = async (day: number) => {
    if (isPast(day) || isWeekend(day)) return;
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setSlots([]);
    setLoadingSlots(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/calendar/available?day=${dateStr}`);
      const data = await res.json();
      setSlots(data.available_slots || []);
    } catch {
      setError("Failed to load available slots. Please try again.");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot || !form.name || !form.email || !form.purpose) return;
    setBooking(true);
    setError(null);
    try {
      const start = toLocalISO(selectedSlot.start);
      const end = toLocalISO(selectedSlot.end);
      const url = `${API_BASE}/calendar/book?client_name=${encodeURIComponent(form.name)}&client_email=${encodeURIComponent(form.email)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&purpose=${encodeURIComponent(form.purpose)}&user_input=${encodeURIComponent(form.userInput)}`;
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Booking failed");
      const data = await res.json();
      setModal({ meetLink: data.meet_link });
      setSelectedSlot(null);
      setForm({ name: "", email: "", contact_number: "", purpose: "", userInput: "" });

      if (selectedDate) {
        const refreshRes = await fetch(`${API_BASE}/calendar/available?day=${selectedDate}`);
        const refreshData = await refreshRes.json();
        setSlots(refreshData.available_slots || []);
      }
    } catch {
      setError("Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  const canBook = !booking && form.name && form.email && form.purpose;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .cal-day {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 500; cursor: pointer;
          transition: all 0.15s ease; border: none; background: transparent;
          color: #1b3e5c;
        }
        .cal-day:hover:not(.disabled):not(.weekend) { background: #e8f2f9; }
        .cal-day.selected { background: #2b7aab !important; color: #fff !important; }
        .cal-day.today { border: 1.5px solid #2b7aab; color: #2b7aab; }
        .cal-day.disabled { color: #c0c8d0; cursor: not-allowed; }
        .cal-day.weekend { color: #c0c8d0; cursor: not-allowed; }

        .slot-btn {
          padding: 10px 8px; border-radius: 8px; border: 1.5px solid #d0dde8;
          background: #fff; color: #1b3e5c; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.15s ease; font-family: inherit;
          text-align: center;
        }
        .slot-btn:hover { border-color: #2b7aab; background: #f0f7fc; }
        .slot-btn.selected { background: #2b7aab; color: #fff; border-color: #2b7aab; }

        .book-btn {
          width: 100%; padding: 13px; background: #2b7aab; color: #fff;
          border: none; border-radius: 8px; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: background 0.15s; font-family: inherit;
        }
        .book-btn:hover:not(:disabled) { background: #1f5f8a; }
        .book-btn:disabled { background: #a0bfd4; cursor: not-allowed; }

        .input-field {
          width: 100%; padding: 11px 14px; border: 1.5px solid #d0dde8;
          border-radius: 8px; font-size: 14px; color: #1b3e5c;
          outline: none; transition: border 0.15s; font-family: inherit;
          background: #fff;
        }
        .input-field:focus { border-color: #2b7aab; }

        .select-field {
          width: 100%; padding: 11px 14px; border: 1.5px solid #d0dde8;
          border-radius: 8px; font-size: 14px; color: #1b3e5c;
          outline: none; transition: border 0.15s; font-family: inherit;
          background: #fff; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237a8fa0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          cursor: pointer;
        }
        .select-field:focus { border-color: #2b7aab; }

        .textarea-field {
          width: 100%; padding: 11px 14px; border: 1.5px solid #d0dde8;
          border-radius: 8px; font-size: 14px; color: #1b3e5c;
          outline: none; transition: border 0.15s; font-family: inherit;
          resize: vertical; min-height: 90px; line-height: 1.5;
        }
        .textarea-field:focus { border-color: #2b7aab; }

        .modal-overlay {
          position: fixed; inset: 0; background: rgba(27,62,92,0.35);
          display: flex; align-items: flex-end; justify-content: center;
          z-index: 1000; backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease;
          padding: 0;
        }
        @media (min-width: 540px) {
          .modal-overlay { align-items: center; padding: 16px; }
          .modal-box { border-radius: 16px !important; max-height: none !important; }
        }
        .modal-box {
          background: #fff; border-radius: 16px 16px 0 0; padding: 32px 24px;
          width: 100%; max-width: 440px; text-align: center;
          box-shadow: 0 20px 60px rgba(27,62,92,0.15);
          animation: slideUp 0.25s ease;
          max-height: 90vh; overflow-y: auto;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .nav-btn {
          width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid #d0dde8;
          background: #fff; cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: #1b3e5c; transition: all 0.15s;
          font-size: 16px;
        }
        .nav-btn:hover { background: #f0f7fc; border-color: #2b7aab; }

        .ai-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 600; color: #2b7aab;
          background: #e8f2f9; padding: 2px 8px; border-radius: 20px;
          letter-spacing: 0.5px; text-transform: uppercase;
        }

        /* Layout */
        .page-header {
          border-bottom: 1px solid #eef2f6;
          padding: 16px 20px;
          display: flex; align-items: center; gap: 12;
        }
        @media (min-width: 640px) {
          .page-header { padding: 20px 40px; }
        }

        .hero {
          padding: 32px 20px 24px;
          text-align: center;
        }
        @media (min-width: 640px) {
          .hero { padding: 48px 40px 36px; }
        }

        .hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: 26px; font-weight: 700; color: #1b3e5c; line-height: 1.2; margin-bottom: 12px;
        }
        @media (min-width: 640px) {
          .hero h1 { font-size: 36px; }
        }

        .main-grid {
          max-width: 960px; margin: 0 auto;
          padding: 0 16px 60px;
          display: flex; flex-direction: column; gap: 20;
        }
        @media (min-width: 768px) {
          .main-grid {
            padding: 0 40px 60px;
            display: grid; grid-template-columns: 1fr 1fr; gap: 32px;
          }
        }

        .panel {
          background: #fff; border: 1px solid #eef2f6; border-radius: 16px;
          padding: 20px; box-shadow: 0 4px 24px rgba(27,62,92,0.06);
        }
        @media (min-width: 640px) {
          .panel { padding: 28px; }
        }

        .slots-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
          max-height: 220px; overflow-y: auto;
        }
        @media (min-width: 480px) {
          .slots-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (min-width: 768px) {
          .slots-grid { grid-template-columns: 1fr 1fr; }
        }

        .right-col {
          display: flex; flex-direction: column; gap: 20px;
        }
      `}</style>

      {/* Header */}
      <header className="page-header">
        <div style={{ width: 36, height: 36, background: "#1b3e5c", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: "#1b3e5c" }}>Smart Logics Solution</span>
      </header>

      {/* Hero */}
      <div className="hero" style={{ maxWidth: 960, margin: "0 auto" }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, color: "#2b7aab", textTransform: "uppercase", marginBottom: 12 }}>Book a Meeting</p>
        <h1 className="hero h1">Schedule a 30-Minute Call</h1>
        <p style={{ color: "#7a8fa0", fontSize: 14, maxWidth: 480, margin: "0 auto" }}>
          Select a date and time that works for you. We'll send a Google Meet link straight to your inbox.
        </p>
      </div>

      {/* Main content */}
      <div className="main-grid">

        {/* Calendar */}
        <div className="panel" style={{ alignSelf: "start" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <button className="nav-btn" onClick={prevMonth}>‹</button>
            <span style={{ fontWeight: 600, fontSize: 15, color: "#1b3e5c" }}>{MONTHS[currentMonth]} {currentYear}</span>
            <button className="nav-btn" onClick={nextMonth}>›</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#7a8fa0", padding: "4px 0", letterSpacing: 0.5 }}>{d}</div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const pad = (n: number) => String(n).padStart(2, "0");
              const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
              const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
              const disabled = isPast(day) || isWeekend(day);
              const selected = selectedDate === dateStr;

              return (
                <div key={day} style={{ display: "flex", justifyContent: "center" }}>
                  <button
                    className={`cal-day ${selected ? "selected" : ""} ${isToday && !selected ? "today" : ""} ${disabled ? (isWeekend(day) ? "weekend" : "disabled") : ""}`}
                    onClick={() => handleDateClick(day)}
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #eef2f6" }}>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#7a8fa0" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#2b7aab", display: "inline-block" }}/>Available
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#d0dde8", display: "inline-block" }}/>Unavailable
              </span>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="right-col">

          {/* Slots */}
          <div className="panel">
            {!selectedDate ? (
              <div style={{ textAlign: "center", padding: "28px 0" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c0c8d0" strokeWidth="1.5" style={{ marginBottom: 12 }}>
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p style={{ color: "#7a8fa0", fontSize: 14 }}>Select a date to see available slots</p>
              </div>
            ) : loadingSlots ? (
              <div style={{ textAlign: "center", padding: "28px 0", color: "#7a8fa0", fontSize: 14 }}>Loading slots...</div>
            ) : (
              <>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#2b7aab", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Available Times</p>
                <p style={{ fontSize: 13, color: "#7a8fa0", marginBottom: 16 }}>{formatDisplayDate(selectedDate)}</p>
                {slots.length === 0 ? (
                  <p style={{ color: "#7a8fa0", fontSize: 14, padding: "16px 0" }}>No available slots for this day.</p>
                ) : (
                  <div className="slots-grid">
                    {slots.map((slot, i) => (
                      <button
                        key={i}
                        className={`slot-btn ${selectedSlot === slot ? "selected" : ""}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {formatTime(slot.start)}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Booking form */}
          {selectedSlot && (
            <div className="panel" style={{ animation: "slideUp 0.2s ease" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#2b7aab", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>Your Details</p>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#1b3e5c", marginBottom: 6 }}>Full Name</label>
                <input
                  className="input-field"
                  placeholder="John Smith"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#1b3e5c", marginBottom: 6 }}>Email Address</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#1b3e5c", marginBottom: 6 }}>Contact Number <span style={{ color: "#7a8fa0", fontWeight: 400 }}>(optional)</span></label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="Contact number"
                  value={form.contact_number}
                  onChange={e => setForm(f => ({ ...f, contact_number: e.target.value }))}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#1b3e5c", marginBottom: 6 }}>Purpose of Meeting</label>
                <select
                  className="select-field"
                  value={form.purpose}
                  onChange={e => setForm(f => ({ ...f, purpose: e.target.value, userInput: "" }))}
                >
                  <option value="">Select a purpose...</option>
                  {PURPOSES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {form.purpose && (
                <div style={{ marginBottom: 20, animation: "slideUp 0.2s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "#1b3e5c" }}>
                      {PURPOSE_LABELS[form.purpose]}
                    </label>
                    <span className="ai-badge">✦ AI Enhanced</span>
                  </div>
                  <textarea
                    className="textarea-field"
                    placeholder={PURPOSE_PLACEHOLDERS[form.purpose]}
                    value={form.userInput}
                    onChange={e => setForm(f => ({ ...f, userInput: e.target.value }))}
                  />
                  <p style={{ fontSize: 11, color: "#7a8fa0", marginTop: 5 }}>Optional</p>
                </div>
              )}

              {!form.purpose && <div style={{ marginBottom: 20 }} />}

              {error && <p style={{ color: "#e05252", fontSize: 13, marginBottom: 12 }}>{error}</p>}

              <button
                className="book-btn"
                onClick={handleBook}
                disabled={!canBook}
              >
                {booking ? "Preparing your meeting..." : `Confirm — ${formatTime(selectedSlot.start)}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ width: 56, height: 56, background: "#e8f7ee", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#1b3e5c", marginBottom: 8 }}>You're Booked!</h2>
            <p style={{ color: "#7a8fa0", fontSize: 14, marginBottom: 24 }}>A confirmation with your meeting link has been sent to your email.</p>

            <div style={{ background: "#f4f8fc", borderRadius: 10, padding: "14px 16px", marginBottom: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#7a8fa0", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Google Meet Link</p>
              <a href={modal.meetLink} target="_blank" rel="noopener noreferrer" style={{ color: "#2b7aab", fontWeight: 500, fontSize: 13, wordBreak: "break-all", textDecoration: "none" }}>
                {modal.meetLink}
              </a>
            </div>

            <button
              onClick={() => setModal(null)}
              style={{ padding: "11px 32px", background: "#1b3e5c", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}