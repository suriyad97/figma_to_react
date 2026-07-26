import { Link } from 'react-router-dom'

export default function PrayerRequestThanks() {
  return (
    <div className="prayer-thanks-page">
      <h1>Thank You for Your Prayer Request!</h1>
      <p>We Will be Praying &amp; Contacting You.</p>
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <Link to="/home" className="btn-back">Back to Home</Link>
        <Link to="/joining-the-session" className="btn-join-platform">Join the Platform</Link>
      </div>
    </div>
  )
}
