import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

export default function Home() {
  return (
    <div>
      <Navbar />
      <section className="hero" style={{ minHeight: "520px" }}>
        <div className="hero-bg" style={{ background: "linear-gradient(135deg,#7a2020 0%,#4a2010 20%,#2a5a20 60%,#c4a020 100%)" }} />
        <div className="hero-overlay" style={{ background: "rgba(20,20,10,0.5)" }} />
        <div className="hero-content">
          <p className="hero-eyebrow">Welcome to Global Intercessors</p>
          <h1 className="hero-title">A 24 Hour <br />Prayer Platform</h1>
          <div className="hero-actions">
            <Link to="/joining-the-session" className="btn-hero-gold">Join the Platform</Link>
            <Link to="/prayer-request-form" className="btn-hero-text">Send Prayer Request</Link>
          </div>
        </div>
      </section>
      <section style={{ padding: "60px 60px 40px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "Poppins,sans-serif", fontSize: "48px", fontWeight: 700 }}>
          <span style={{ color: "#119305" }}>About</span> Us
        </h2>
        <p style={{ fontFamily: "Poppins,sans-serif", fontSize: "24px", fontWeight: 700, maxWidth: "900px", margin: "28px auto 0", lineHeight: 1.5, textAlign: "center" }}>
          We are a 24 hour online house of prayer committed to prayer, fasting and bringing forth the Kingdom of God on earth as it is in Heaven.
        </p>
      </section>
      <div style={{ width: "100%", aspectRatio: "16/7", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(3,37,0,0.6)" }} />
        <div style={{ position: "relative", zIndex: 1, width: "90px", height: "90px", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none"><polygon points="10,4 30,17 10,30" fill="#032500" /></svg>
        </div>
      </div>
      <section style={{ padding: "50px 60px 30px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "Poppins,sans-serif", fontSize: "48px", fontWeight: 700 }}>
          <span style={{ color: "#119305" }}>Ongoing</span> Events
        </h2>
      </section>
      <div style={{ background: "#0a3d02", padding: "40px 48px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="40" height="40" viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="20" stroke="#ffc061" strokeWidth="2" fill="none"/><ellipse cx="22" cy="22" rx="10" ry="20" stroke="#ffc061" strokeWidth="1.5" fill="none"/><line x1="2" y1="22" x2="42" y2="22" stroke="#ffc061" strokeWidth="1.5"/><circle cx="22" cy="22" r="3" fill="#ffc061"/></svg>
            <div style={{ fontFamily: "Poppins,sans-serif", fontSize: "11px", fontWeight: 700, color: "#fff", textTransform: "uppercase", lineHeight: 1.3 }}>GLOBAL<br />INTERCESSORS</div>
          </div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontFamily: "Poppins,sans-serif", fontSize: "85px", fontWeight: 700, color: "#fff", lineHeight: 1 }}>90</div>
            <div style={{ fontFamily: "Poppins,sans-serif", fontSize: "18px", fontWeight: 700, color: "#fff", letterSpacing: "3px", marginTop: "4px" }}>DAYS OF<br />PRAYER</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Poppins,sans-serif", fontSize: "38px", fontWeight: 700, color: "#d89025", lineHeight: 1 }}>Lift Up</div>
            <div style={{ fontFamily: "Roboto,sans-serif", fontSize: "14px", color: "#fff", lineHeight: 1.4, marginTop: "4px" }}>Zimbabwe<br />Prayer Campaign 2022</div>
          </div>
        </div>
        <p style={{ fontFamily: "Roboto,sans-serif", fontSize: "22px", color: "#fff", marginTop: "16px" }}>Join daily prayer sessions</p>
        <p style={{ fontFamily: "Poppins,sans-serif", fontSize: "28px", fontWeight: 700, color: "#d89025" }}>6:30am &amp; 8:30PM CAT</p>
        <Link to="/joining-the-session" style={{ background: "#d89025", color: "#fff", borderRadius: "8px", padding: "16px 80px", fontFamily: "Poppins,sans-serif", fontSize: "28px", fontWeight: 700, textDecoration: "none", display: "inline-block", marginTop: "10px" }}>Click to Join</Link>
      </div>
      <div style={{ height: "134px", background: "#d89025" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ background: "#0d2a0d", minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ textAlign: "center", color: "#fff" }}>
            <div style={{ fontFamily: "Poppins,sans-serif", fontSize: "12px", fontWeight: 700 }}>GLOBAL INTERCESSORS</div>
            <div style={{ color: "#ffc061", fontSize: "24px", fontWeight: 700, margin: "8px 0", fontFamily: "Poppins,sans-serif" }}>Lift Up</div>
            <div style={{ fontFamily: "Poppins,sans-serif", fontSize: "28px", fontWeight: 700, lineHeight: 1.1 }}>BIBLE<br />READING<br />Programme</div>
            <div style={{ fontSize: "11px", marginTop: "12px", lineHeight: 1.5, fontFamily: "Roboto,sans-serif" }}>
              Join us on Radio Zimbabwe to pray for the nation.<br />
              Tune in every <span style={{ color: "#ffc061", fontWeight: 700 }}>Wednesday 31 8:30PM CAT</span><br />
              for Bible reading in IsiNdebele.
            </div>
          </div>
        </div>
        <div style={{ background: "#0d2a0d", minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ textAlign: "center", color: "#fff" }}>
            <div style={{ fontFamily: "Poppins,sans-serif", fontSize: "12px", fontWeight: 700 }}>GLOBAL INTERCESSORS</div>
            <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "8px", color: "#ffc061", fontFamily: "Poppins,sans-serif" }}>WEEK 3</div>
            <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "Poppins,sans-serif", marginTop: "4px" }}>Praying for<br />Presidential &amp;<br />Parliamentary Elections</div>
            <div style={{ fontSize: "11px", marginTop: "10px", color: "#ccc", fontFamily: "Roboto,sans-serif", lineHeight: 1.6 }}>07 FEB - 13 FEB 2022<br />Pray · Hope · Share · #LiftUpZimbabwe</div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", padding: "20px 40px", gap: "16px", flexWrap: "wrap" }}>
        <span style={{ fontFamily: "Poppins,sans-serif", fontSize: "18px", fontWeight: 700, whiteSpace: "nowrap" }}>SEND YOUR DETAILS</span>
        <input type="text" placeholder="FULL NAME" style={{ background: "#c4c4c4", border: "none", borderRadius: "4px", padding: "0 16px", width: "221px", height: "44px", fontFamily: "Poppins,sans-serif", fontSize: "12px", fontWeight: 700, color: "#000", outline: "none" }} />
        <input type="email" placeholder="EMAIL" style={{ background: "#c4c4c4", border: "none", borderRadius: "4px", padding: "0 16px", width: "221px", height: "44px", fontFamily: "Poppins,sans-serif", fontSize: "12px", fontWeight: 700, color: "#000", outline: "none" }} />
        <button style={{ background: "#119305", color: "#fff", border: "none", borderRadius: "11px", width: "221px", height: "80px", fontFamily: "Poppins,sans-serif", fontSize: "36px", fontWeight: 700, cursor: "pointer" }}>SUBMIT</button>
      </div>
      <Footer />
    </div>
  )
}
