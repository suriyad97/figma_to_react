import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

const inp = { background:"#c4c4c4", border:"none", borderRadius:"16px", height:"72px", padding:"0 28px", fontFamily:"Poppins,sans-serif", fontSize:"24px", fontWeight:700, color:"#fff", outline:"none" }

export default function ContactUs() {
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

      <section style={{ padding:"60px", textAlign:"center" }}>
        <h2 style={{ fontFamily:"Poppins,sans-serif", fontSize:"48px", fontWeight:700, color:"#119305" }}>
          Do You Need More Information?
        </h2>
        <p style={{ fontFamily:"Poppins,sans-serif", fontSize:"24px", fontWeight:700, color:"#000", marginTop:"8px" }}>
          Please Contact Us
        </p>
        <form onSubmit={e => e.preventDefault()} style={{ maxWidth:"1026px", margin:"40px auto 0", display:"flex", flexDirection:"column", gap:"20px" }}>
          <div style={{ display:"flex", gap:"60px", justifyContent:"space-between" }}>
            <input type="text" placeholder="Full Name" style={{ ...inp, flex:"0 0 311px" }} />
            <input type="tel" placeholder="Phone" style={{ ...inp, flex:"0 0 292px" }} />
            <input type="email" placeholder="Email" style={{ ...inp, flex:"0 0 292px" }} />
          </div>
          <div style={{ display:"flex", gap:"148px" }}>
            <input type="text" placeholder="Sex" style={{ ...inp, flex:"0 0 439px" }} />
            <input type="text" placeholder="Age" style={{ ...inp, flex:"0 0 439px" }} />
          </div>
          <div style={{ display:"flex", gap:"148px" }}>
            <input type="text" placeholder="City" style={{ ...inp, flex:"0 0 439px" }} />
            <input type="text" placeholder="Country" style={{ ...inp, flex:"0 0 439px" }} />
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"30px", flexWrap:"wrap" }}>
            <div style={{ ...inp, flex:"0 0 439px", display:"flex", alignItems:"center" }}>Born Again:</div>
            <span style={{ fontFamily:"Poppins,sans-serif", fontSize:"24px", fontWeight:700, color:"#000" }}>YES</span>
            <div style={{ width:"103px", height:"72px", background:"#c4c4c4", borderRadius:"16px", flexShrink:0 }} />
            <span style={{ fontFamily:"Poppins,sans-serif", fontSize:"24px", fontWeight:700, color:"#000" }}>NO</span>
            <div style={{ width:"103px", height:"72px", background:"#c4c4c4", borderRadius:"16px", flexShrink:0 }} />
          </div>
          <button type="submit" style={{ width:"426px", height:"72px", background:"#119305", color:"#fff", border:"none", borderRadius:"16px", fontFamily:"Poppins,sans-serif", fontSize:"48px", fontWeight:700, cursor:"pointer", alignSelf:"center", marginTop:"20px" }}>
            SUBMIT
          </button>
        </form>
      </section>

      <Footer />
    </div>
  )
}
