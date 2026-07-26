import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

const partners = Array.from({ length: 10 })

export default function AboutUs() {
  return (
    <div>
      <Navbar />
      <section className="hero" style={{ minHeight: "480px" }}>
        <div className="hero-bg" style={{ background: "linear-gradient(160deg,#6b7c3a 0%,#3a5c2a 50%,#2a4a1a 100%)" }} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-eyebrow">Who We Are As The</p>
          <h1 className="hero-title">Intercessors<br />of the Nations</h1>
          <div className="hero-actions">
            <Link to="/prayer-request-form" className="btn-hero-green">Submit Request</Link>
            <Link to="/joining-the-session" className="btn-hero-text">Join The Platform</Link>
          </div>
        </div>
      </section>

      <section style={{ padding: "60px 58px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "Poppins,sans-serif", fontSize: "48px", fontWeight: 700 }}>
          <span style={{ color: "#119305" }}>Mission</span> Statement
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "562px 562px", gap: "34px", marginTop: "40px", justifyContent: "center" }}>
          <div style={{ overflow: "hidden" }}>
            <div style={{ background: "#119305", height: "110px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <h3 style={{ fontFamily: "Poppins,sans-serif", fontSize: "48px", fontWeight: 700, color: "#fff", letterSpacing: "2px" }}>MISSION</h3>
            </div>
            <div style={{ background: "#c4c4c4", padding: "32px 28px", minHeight: "452px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontFamily: "Poppins,sans-serif", fontSize: "24px", fontWeight: 700, color: "#000", lineHeight: 1.6, textAlign: "center" }}>
                Our mission is to be a global prayer movement, focusing on prayer and fasting for spiritual revival across the globe.
              </p>
            </div>
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ background: "#119305", height: "110px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <h3 style={{ fontFamily: "Poppins,sans-serif", fontSize: "48px", fontWeight: 700, color: "#fff", letterSpacing: "2px" }}>VISION</h3>
            </div>
            <div style={{ background: "#c4c4c4", padding: "32px 28px", minHeight: "452px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontFamily: "Poppins,sans-serif", fontSize: "14px", fontWeight: 400, color: "#000", lineHeight: 1.7, textAlign: "center" }}>
                Our vision is to unite Christians from around the globe in prayer, fasting and intercession and to train, &amp; instruct the church to pray and intercede to bring transformation in all areas of life in furtherance of Christ&apos;s Kingdom.
              </p>
              <p style={{ fontFamily: "Poppins,sans-serif", fontSize: "14px", fontStyle: "italic", color: "#000", textAlign: "center", marginTop: "16px", lineHeight: 1.5 }}>
                &quot;My house will be called a house of prayer for all nations.&quot; <strong>Isaiah 56:7</strong>
              </p>
            </div>
          </div>
        </div>
        <div style={{ marginTop: "40px", maxWidth: "900px", margin: "40px auto 0" }}>
          <p style={{ fontFamily: "Poppins,sans-serif", fontSize: "24px", fontWeight: 700, lineHeight: 1.5 }}>
            Now that you understand our mission &amp; vision. It&apos;s time to take a great step by being part of the big family
          </p>
          <Link to="/contact-us" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#119305", color: "#fff", border: "none", borderRadius: "21px", width: "254px", height: "64px", fontFamily: "Roboto,sans-serif", fontSize: "24px", fontWeight: 400, textDecoration: "none", marginTop: "24px" }}>
            Sign Up
          </Link>
        </div>
      </section>

      <section style={{ padding: "60px 102px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "Poppins,sans-serif", fontSize: "48px", fontWeight: 700 }}>
          <span style={{ color: "#119305" }}>Our</span> Partners
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,172px)", gap: "54px", marginTop: "40px", justifyContent: "center" }}>
          {partners.map((_, i) => (
            <div key={i} style={{ width: "172px", height: "172px", background: "#c4c4c4", borderRadius: "4px" }} />
          ))}
        </div>
      </section>

      <section style={{ padding: "60px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "Poppins,sans-serif", fontSize: "48px", fontWeight: 700 }}>
          <span style={{ color: "#119305" }}>Our</span> Founders
        </h2>
        <div style={{ display: "flex", gap: "80px", justifyContent: "center", marginTop: "40px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "224px", height: "224px", borderRadius: "50%", background: "#c4a882", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="28" r="18" fill="#a08060"/><ellipse cx="40" cy="70" rx="30" ry="18" fill="#a08060"/></svg>
            </div>
            <p style={{ fontFamily: "Poppins,sans-serif", fontSize: "24px", fontWeight: 600, color: "#000" }}>Mrs Tsitsi Masiyiwa</p>
            <p style={{ fontFamily: "Poppins,sans-serif", fontSize: "16px", fontWeight: 600, color: "#000", textAlign: "center", lineHeight: 1.5 }}>Co-Founder<br />Higherlife Foundation</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "224px", height: "224px", borderRadius: "50%", background: "#7a9a60", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="28" r="18" fill="#5a7a40"/><ellipse cx="40" cy="70" rx="30" ry="18" fill="#5a7a40"/></svg>
            </div>
            <p style={{ fontFamily: "Poppins,sans-serif", fontSize: "24px", fontWeight: 600, color: "#000" }}>Ms Petronella Maramba</p>
            <p style={{ fontFamily: "Poppins,sans-serif", fontSize: "16px", fontWeight: 600, color: "#000", textAlign: "center", lineHeight: 1.5 }}>Executive Director<br />Higherlife Foundation</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
