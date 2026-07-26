import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

const eventItems = [1,2,3,4,5]
const inp = { background:"#c4c4c4", border:"none", borderRadius:"16px", height:"72px", padding:"0 28px", fontFamily:"Poppins,sans-serif", fontSize:"24px", fontWeight:700, color:"#fff", outline:"none" }

export default function Events() {
  return (
    <div>
      <Navbar />
      <section className="hero" style={{ minHeight:"460px" }}>
        <div className="hero-bg" style={{ background:"linear-gradient(160deg,#1a1a1a 0%,#2e2e2e 60%,#1a1a1a 100%)" }} />
        <div className="hero-overlay" style={{ background:"rgba(0,0,0,0.5)" }} />
        <div className="hero-content">
          <p className="hero-eyebrow">Be part of the team</p>
          <h1 className="hero-title">Join Our Programs<br />&amp; Stay Alert always</h1>
          <div className="hero-actions">
            <Link to="/news-updates" className="btn-hero-green">Know More</Link>
            <Link to="/joining-the-session" className="btn-hero-text">Join The Platform</Link>
          </div>
        </div>
      </section>

      <div style={{ padding:"20px 60px" }}>
        {eventItems.map((id) => (
          <div key={id} style={{ display:"flex", alignItems:"flex-start", gap:"20px", padding:"32px 0", borderBottom:"1px solid #f3efef" }}>
            <div style={{ width:"171px", height:"184px", background:"#c4c4c4", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none"><circle cx="30" cy="22" r="10" fill="#888"/><ellipse cx="30" cy="48" rx="18" ry="10" fill="#888"/></svg>
            </div>
            <div style={{ fontFamily:"Poppins,sans-serif", fontSize:"48px", fontWeight:700, color:"#000", lineHeight:1.1, flexShrink:0, minWidth:"114px", textAlign:"center" }}>
              23<br />JAN<br />2022
            </div>
            <div style={{ flex:1 }}>
              <h3 style={{ fontFamily:"Poppins,sans-serif", fontSize:"48px", fontWeight:700, color:"#000", marginBottom:"10px", lineHeight:1.1 }}>LiftUp Zimbabwe 2022</h3>
              <p style={{ fontFamily:"Poppins,sans-serif", fontSize:"18px", fontWeight:400, color:"#000", lineHeight:1.5, marginBottom:"16px" }}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc, ut sagittis sit aliquam in mauris ultricies non. Laoreet sed nunc faucibus ipsum congue. Egestas diam faucibus cursus ultricies
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:"20px", flexWrap:"wrap" }}>
                <Link to="/joining-the-session" style={{ background:"#119305", color:"#fff", border:"none", borderRadius:"21px", width:"254px", height:"64px", display:"inline-flex", alignItems:"center", justifyContent:"center", fontFamily:"Roboto,sans-serif", fontSize:"24px", fontWeight:400, textDecoration:"none" }}>
                  Join the Event
                </Link>
                <Link to="/joining-the-session" style={{ fontFamily:"Roboto,sans-serif", fontSize:"24px", fontWeight:400, color:"#000", textDecoration:"none" }}>
                  Join The Platform
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ border:"2px solid #000", margin:"40px 60px", padding:"40px", textAlign:"center" }}>
        <h2 style={{ fontFamily:"Poppins,sans-serif", fontSize:"48px", fontWeight:700, color:"#119305" }}>Leave Your Details Here</h2>
        <p style={{ fontFamily:"Poppins,sans-serif", fontSize:"24px", fontWeight:700, color:"#000", marginTop:"8px" }}>So that we can get in touch with you about all our updates</p>
        <div style={{ display:"flex", gap:"20px", justifyContent:"center", marginTop:"24px", flexWrap:"wrap" }}>
          <input type="text" placeholder="Full Name" style={{ ...inp, flex:"0 0 311px" }} />
          <input type="tel" placeholder="Phone" style={{ ...inp, flex:"0 0 292px" }} />
          <input type="email" placeholder="Email" style={{ ...inp, flex:"0 0 292px" }} />
        </div>
        <button style={{ background:"#119305", color:"#fff", border:"none", borderRadius:"16px", width:"426px", height:"72px", fontFamily:"Poppins,sans-serif", fontSize:"48px", fontWeight:700, cursor:"pointer", marginTop:"20px" }}>SUBMIT</button>
      </div>

      <Footer />
    </div>
  )
}
