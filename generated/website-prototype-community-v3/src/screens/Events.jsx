import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const events = [
  {
    id: 1,
    date: ['23', 'JAN', '2022'],
    title: 'LiftUp Zimbabwe 2022',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc, ut sagittis sit aliquam in mauris ultricies non. Laoreet sed nunc faucibus ipsum congue. Egestas diam faucibus cursus ultricies',
  },
  {
    id: 2,
    date: ['23', 'JAN', '2022'],
    title: 'LiftUp Zimbabwe 2022',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc, ut sagittis sit aliquam in mauris ultricies non. Laoreet sed nunc faucibus ipsum congue. Egestas diam faucibus cursus ultricies',
  },
  {
    id: 3,
    date: ['23', 'JAN', '2022'],
    title: 'LiftUp Zimbabwe 2022',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc, ut sagittis sit aliquam in mauris ultricies non. Laoreet sed nunc faucibus ipsum congue. Egestas diam faucibus cursus ultricies',
  },
  {
    id: 4,
    date: ['23', 'JAN', '2022'],
    title: 'LiftUp Zimbabwe 2022',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc, ut sagittis sit aliquam in mauris ultricies non. Laoreet sed nunc faucibus ipsum congue. Egestas diam faucibus cursus ultricies',
  },
  {
    id: 5,
    date: ['23', 'JAN', '2022'],
    title: 'LiftUp Zimbabwe 2022',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc, ut sagittis sit aliquam in mauris ultricies non. Laoreet sed nunc faucibus ipsum congue. Egestas diam faucibus cursus ultricies',
  },
]

export default function Events() {
  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section className="hero" style={{ minHeight: '420px' }}>
        <img className="hero__bg" src="/assets/image_c9fe6ea14535578d6efc2d1b9ff904f7e092c73d.png" alt="Events hero" />
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

      {/* Events List */}
      <section className="events-list">
        {events.map((ev) => (
          <div key={ev.id} className="event-item">
            <img src="/assets/image_24d839517c54cd9b4fe2f43dd0f1ff32d5f20e4a.png" alt="Event" />
            <div className="event-item__date">
              {ev.date[0]}<br />{ev.date[1]}<br />{ev.date[2]}
            </div>
            <div className="event-item__content">
              <h3>{ev.title}</h3>
              <p>{ev.description}</p>
              <div className="event-item__actions">
                <Link to="/joining-the-session" className="btn-green" style={{ padding: '10px 24px', fontSize: '14px', borderRadius: '20px' }}>
                  Join the Event
                </Link>
                <Link to="/joining-the-session" className="btn-ghost" style={{ color: '#000', fontSize: '14px' }}>
                  Join The Platform
                </Link>
              </div>
            </div>
          </div>
        ))}
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
