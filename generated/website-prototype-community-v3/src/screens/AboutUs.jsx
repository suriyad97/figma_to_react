import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const partners = Array.from({ length: 10 })

export default function AboutUs() {
  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section className="hero" style={{ minHeight: '420px' }}>
        <img className="hero__bg" src="/assets/image_8b1626b3094e3ec5db30d49ddd5f7bb4618d92bf.png" alt="Intercessors" />
        <div className="hero__overlay" />
        <div className="hero__content">
          <p className="hero__eyebrow">Who We Are As The</p>
          <h1 className="hero__title">Intercessors<br />of the Nations</h1>
          <div className="hero__actions">
            <Link to="/prayer-request-form" className="btn-green">Submit Request</Link>
            <Link to="/joining-the-session" className="btn-ghost">Join The Platform</Link>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="mission-section">
        <h2 className="section-title"><span className="green">Mission</span> Statement</h2>
        <div className="mission-cards">
          <div className="mission-card">
            <div className="mission-card__header"><h3>MISSION</h3></div>
            <div className="mission-card__body">
              <p>
                Our mission is to be a global prayer movement, focusing on prayer and fasting for
                spiritual revival across the globe.
              </p>
            </div>
          </div>
          <div className="mission-card">
            <div className="mission-card__header"><h3>VISION</h3></div>
            <div className="mission-card__body">
              <p>
                Our vision is to unite Christians from around the globe in prayer, fasting and
                intercession and to train, &amp; instruct the church to pray and intercede to bring
                transformation in all areas of life in furtherance of Christ's Kingdom.
              </p>
              <em>"My house will be called a house of prayer for all nations." <strong>Isaiah 56:7</strong></em>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="mission-cta">
        <p>
          Now that you understand our mission &amp; vision. It's time to take a great step by being
          part of the big family
        </p>
        <Link to="/joining-the-session" className="btn-green">Sign Up</Link>
      </div>

      {/* Our Partners */}
      <section className="partners-section">
        <h2 className="section-title"><span className="green">Our</span> Partners</h2>
        <div className="partners-grid">
          {partners.map((_, i) => (
            <div key={i} className="partner-box" />
          ))}
        </div>
      </section>

      {/* Our Founders */}
      <section className="founders-section">
        <h2 className="section-title"><span className="green">Our</span> Founders</h2>
        <div className="founders-grid">
          <div className="founder-card">
            <img src="/assets/image_fd57bacc98bd140f93b930c901e8c0d73a5db807.png" alt="Mrs Tsitsi Masiyiwa" />
            <p className="founder-card__name">Mrs Tsitsi Masiyiwa</p>
            <p className="founder-card__title">Co-Founder<br />Higherlife Foundation</p>
          </div>
          <div className="founder-card">
            <img src="/assets/image_d484c4f9f124a82f36350d26d6d7856ce1fea51f.png" alt="Ms Petronella Maramba" />
            <p className="founder-card__name">Ms Petronella Maramba</p>
            <p className="founder-card__title">Executive Director<br />Higherlife Foundation</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
