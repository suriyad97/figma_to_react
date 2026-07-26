import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function ContactUs() {
  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section className="hero" style={{ minHeight: '420px' }}>
        <img className="hero__bg" src="/assets/image_c9fe6ea14535578d6efc2d1b9ff904f7e092c73d.png" alt="Contact hero" />
        <div className="hero__overlay" style={{ background: 'rgba(0,0,0,0.55)' }} />
        <div className="hero__content">
          <p className="hero__eyebrow">Be part of the team</p>
          <h1 className="hero__title">Join Our Programs<br />&amp; Stay Alert always</h1>
          <div className="hero__actions">
            <Link to="/joining-the-session" className="btn-green">Know More</Link>
            <Link to="/joining-the-session" className="btn-ghost">Join The Platform</Link>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="contact-form-section">
        <h2>Do You Need More Information?</h2>
        <p className="subtitle">Please Contact Us</p>
        <form className="contact-form" onSubmit={e => e.preventDefault()}>
          <div className="contact-form-row">
            <input type="text" placeholder="Full Name" />
            <input type="tel" placeholder="Phone" />
            <input type="email" placeholder="Email" />
          </div>
          <div className="contact-form-row-2">
            <input type="text" placeholder="Sex" />
            <input type="text" placeholder="Age" />
          </div>
          <div className="contact-form-row-2">
            <input type="text" placeholder="City" />
            <input type="text" placeholder="Country" />
          </div>
          <div className="born-again-row">
            <input type="text" placeholder="Born Again:" />
            <label>YES</label>
            <input type="checkbox" />
            <label>NO</label>
            <input type="checkbox" />
          </div>
          <button type="submit" className="btn-submit-contact">SUBMIT</button>
        </form>
      </section>

      <Footer />
    </div>
  )
}
