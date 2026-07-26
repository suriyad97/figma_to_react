import { Link, useNavigate } from 'react-router-dom'

export default function ThankYouNote() {
  const navigate = useNavigate()
  return (
    <div className="thank-you-page">
      <div className="thank-you-bg" />
      <div className="thank-you-content">
        <h1 className="thank-you-title">
          Thank You for the Interest<br />
          in joining the Global Intercessors family
        </h1>
        <div className="thank-you-actions">
          <button className="btn-light" onClick={() => navigate(-1)}>Back</button>
          <Link to="/joining-the-session" className="btn-amber">Join the Platform</Link>
        </div>
      </div>
    </div>
  )
}
