import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

const inp = { background:"#c4c4c4", border:"none", borderRadius:"16px", height:"72px", padding:"0 28px", fontFamily:"Poppins,sans-serif", fontSize:"24px", fontWeight:700, color:"#fff", outline:"none" }

export default function NewsUpdates() {
  return (
    <div>
      <Navbar />
      <section className="hero" style={{ minHeight:"480px" }}>
        <div className="hero-bg" style={{ background:"linear-gradient(160deg,#2a7a5c 0%,#1a5a3a 50%,#0a3a2a 100%)" }} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-eyebrow">It&apos;s time for you,</p>
          <h1 className="hero-title">To Stay Alert<br />for Recent Updates</h1>
          <div className="hero-actions">
            <Link to="/about-us" className="btn-hero-green">Know More</Link>
            <Link to="/joining-the-session" className="btn-hero-text">Join The Platform</Link>
          </div>
        </div>
      </section>

      <section style={{ padding:"60px 60px 40px", textAlign:"center" }}>
        <h2 style={{ fontFamily:"Poppins,sans-serif", fontSize:"48px", fontWeight:700, color:"#119305" }}>90 Days of Prayer Campaign</h2>
        <p style={{ fontFamily:"Poppins,sans-serif", fontSize:"24px", fontWeight:700, color:"#000", marginTop:"8px" }}>#LiftUpZimbabwe</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"24px", marginTop:"40px" }}>
          <div style={{ overflow:"hidden" }}>
            <div style={{ background:"#119305", height:"110px", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <h3 style={{ fontFamily:"Poppins,sans-serif", fontSize:"48px", fontWeight:700, color:"#fff" }}>Morning Session</h3>
            </div>
            <div style={{ background:"#c4c4c4", padding:"28px", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:"24px", minHeight:"342px" }}>
              <p style={{ fontFamily:"Poppins,sans-serif", fontSize:"24px", fontWeight:700, color:"#000", lineHeight:1.5 }}>
                It&apos;s bigger, it&apos;s here!<br />Its time to joing the morning prayer session every day at 6.30am CAT on Zoom &amp; Facebook by clicking the button below
              </p>
              <Link to="/joining-the-session" style={{ background:"#119305", color:"#fff", border:"none", borderRadius:"21px", width:"254px", height:"64px", display:"inline-flex", alignItems:"center", justifyContent:"center", fontFamily:"Roboto,sans-serif", fontSize:"24px", fontWeight:400, textDecoration:"none" }}>Click Me</Link>
            </div>
          </div>
          <div style={{ overflow:"hidden" }}>
            <div style={{ background:"#119305", height:"110px", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <h3 style={{ fontFamily:"Poppins,sans-serif", fontSize:"48px", fontWeight:700, color:"#fff" }}>Evening Session</h3>
            </div>
            <div style={{ background:"#c4c4c4", padding:"28px", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:"24px", minHeight:"342px" }}>
              <p style={{ fontFamily:"Poppins,sans-serif", fontSize:"24px", fontWeight:700, color:"#000", lineHeight:1.5 }}>
                It&apos;s bigger, it&apos;s here!<br />Its time to joing the evening prayer session every day at 8:30pm&nbsp; CAT on Zoom &amp; Facebook by clicking the button below
              </p>
              <Link to="/joining-the-session" style={{ background:"#119305", color:"#fff", border:"none", borderRadius:"21px", width:"254px", height:"64px", display:"inline-flex", alignItems:"center", justifyContent:"center", fontFamily:"Roboto,sans-serif", fontSize:"24px", fontWeight:400, textDecoration:"none" }}>Click Me</Link>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding:"60px 60px 40px", textAlign:"center" }}>
        <h2 style={{ fontFamily:"Poppins,sans-serif", fontSize:"48px", fontWeight:700, color:"#119305" }}>Join the Three Days &amp; Nights</h2>
        <p style={{ fontFamily:"Poppins,sans-serif", fontSize:"24px", fontWeight:700, color:"#000", marginTop:"8px" }}>
          Of Prayer &amp; Fasting every Last Tuesday 6AM CAT&nbsp; to Friday&nbsp; 6 AM CAT of the Month
        </p>
        <div style={{ width:"100%", aspectRatio:"16/9", background:"#c4c4c4", margin:"32px 0", overflow:"hidden", position:"relative" }}>
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(160deg,#8b6040 0%,#6b4020 40%,#4b2010 100%)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ background:"rgba(0,0,0,0.3)", padding:"16px 24px", borderRadius:"8px", color:"#fff", fontFamily:"Poppins,sans-serif", fontSize:"22px", fontWeight:700 }}>HOLY BIBLE</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:"24px", justifyContent:"center", flexWrap:"wrap" }}>
          <Link to="/prayer-request-form" style={{ background:"#119305", color:"#fff", border:"none", borderRadius:"16px", width:"426px", height:"72px", display:"inline-flex", alignItems:"center", justifyContent:"center", fontFamily:"Poppins,sans-serif", fontSize:"24px", fontWeight:700, textDecoration:"none" }}>
            Send&nbsp; Your Prayer Request
          </Link>
          <Link to="/joining-the-session" style={{ background:"#119305", color:"#fff", border:"none", borderRadius:"16px", width:"426px", height:"72px", display:"inline-flex", alignItems:"center", justifyContent:"center", fontFamily:"Poppins,sans-serif", fontSize:"24px", fontWeight:700, textDecoration:"none" }}>
            Join the Prayer Platform
          </Link>
        </div>
      </section>

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
