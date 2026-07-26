import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function NewsUpdates() {
  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section className="hero" style={{ minHeight: '420px' }}>
        <img className="hero__bg" src="/assets/image_e15c52822afc5109ac522cad42daac2929ad3823.png" alt="News and Updates" />
        <div className="hero__overlay" />
        <div className="hero__content">
          <p className="hero__eyebrow">It's time for you,</p>
          <h1 className="hero__title">To Stay Alert<br />for Recent Updates</h1>
          <div className="hero__actions">
            <Link to="/joining-the-session" className="btn-green">Know More</Link>
            <Link to="/joining-the-session" className="btn-ghost">Join The Platform</Link>
          </div>
        </div>
      </section>

      {/* 90 Days Campaign */}
      <section className="campaign-section">
        <h2>90 Days of Prayer Campaign</h2>
        <p className="hashtag">#LiftUpZimbabwe</p>
        <div className="session-cards">
          <div className="session-card">
            <div className="session-card__header"><h3>Morning Session</h3></div>
            <div className="session-card__body">
              <p>
                It's bigger, it's here!<br />
                Its time to joing the morning prayer session every day at 6.30am CAT on Zoom &amp;
                Facebook by clicking the button below
              </p>
              <Link to="/joining-the-session" className="btn-green">Click Me</Link>
            </div>
          </div>
          <div className="session-card">
            <div className="session-card__header"><h3>Evening Session</h3></div>
            <div className="session-card__body">
              <p>
                It's bigger, it's here!<br />
                Its time to joing the evening prayer session every day at 8:30pm  CAT on Zoom &amp;
                Facebook by clicking the button below
              </p>
              <Link to="/joining-the-session" className="btn-green">Click Me</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Three Days & Nights */}
      <section className="three-days">
        <h2>Join the Three Days &amp; Nights</h2>
        <p>Of Prayer &amp; Fasting every Last Tuesday 6AM CAT  to Friday  6 AM CAT of the Month</p>
        <img src="/assets/image_70eb74be366442e2a0452fe336e8e19227893222.png" alt="Woman praying with Bible" />
        <div className="three-days__actions">
          <Link to="/prayer-request-form" className="btn-green">Send  Your Prayer Request</Link>
          <Link to="/joining-the-session" className="btn-green">Join the Prayer Platform</Link>
        </div>
      </section>

      {/* Leave Details */}
      <section className="details-form-section">
        <div className="details-form-box">
          <h2>Leave Your Details Here</h2>
          <p>So that we can get in touch with you about all our updates</p>
          <div className="details-form-fields">
            <input type="text" placeholder="Full Name" />
            <input type="tel" placeholder="Phone" />
            <input type="email" placeholder="Email" />
          </div>
          <button className="btn-submit-large">SUBMIT</button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
