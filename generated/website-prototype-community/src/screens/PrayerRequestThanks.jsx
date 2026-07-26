import { Link, useNavigate } from 'react-router-dom'

export default function PrayerRequestThanks() {
  const navigate = useNavigate()
  return (
    <div className="prayer-thanks-page">
      <p className="prayer-thanks-text">
        Thank you for connecting with us,<br />
        We will contact you shortly, and for Now &nbsp;we pray for you &amp; your family.
      </p>
      <div className="prayer-thanks-actions">
        <button className="prayer-thanks-btn" onClick={() => navigate(-1)}>Back</button>
        <Link to="/joining-the-session" className="prayer-thanks-btn">Connect Online</Link>
      </div>
    </div>
  )
}
