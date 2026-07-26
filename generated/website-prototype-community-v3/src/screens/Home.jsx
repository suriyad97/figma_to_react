import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section className="hero" style={{ minHeight: '480px' }}>
        <img className="hero__bg" src="/assets/image_32667977cb7a386158a924e176ae9d0861cc2bfb.png" alt="Prayer" />
        <div className="hero__overlay" />
        <div className="hero__content">
          <p className="hero__eyebrow">Welcome to Global Intercessors</p>
          <h1 className="hero__title">A 24 Hour<br />Prayer Platform</h1>
          <div className="hero__actions">
            <Link to="/joining-the-session" className="btn-gold">Join the Platform</Link>
            <Link to="/prayer-request-form" className="btn-ghost">Send Prayer Request</Link>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="home-about">
        <h2 className="section-title"><span className="green">About</span> Us</h2>
        <p>
          We are a 24 hour online house of prayer committed to prayer, fasting and bringing forth the
          Kingdom of God on earth as it is in Heaven.
        </p>
      </section>

      {/* Video */}
      <div className="home-video">
        <img src="/assets/image_4b4d4ea2d414d393193e0788190518e3b46bc6c3.png" alt="Prayer session video" />
        <div className="home-video__overlay">
          <div className="play-btn">
            <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
          </div>
        </div>
      </div>

      {/* Ongoing Events */}
      <section className="home-events">
        <h2 className="section-title home-events__title">
          <span className="green">Ongoing</span> Events
        </h2>
        <div className="event-banner">
          <img src="/assets/image_2d8d35ecbe1b87ae4fc061d61b02b5439f2ed32f.png" alt="90 Days of Prayer - Lift Up Zimbabwe" />
        </div>
        <div className="event-images-row">
          <img src="/assets/image_e0019f3d359b320661fc7cfc215f00a8be8629bc.png" alt="Bible Reading Programme" />
          <img src="/assets/image_976ef04ee480b418e490b7dd1e3df13d5fa52f30.png" alt="Week 3 Prayer Campaign" />
        </div>
      </section>

      {/* Send Details Form */}
      <div className="home-details-form">
        <span className="home-details-form__label">SEND YOUR DETAILS</span>
        <input type="text" placeholder="FULL NAME" />
        <input type="email" placeholder="EMAIL" />
        <button className="btn-submit-home">SUBMIT</button>
      </div>

      <Footer />
    </div>
  )
}
