import { Link, useNavigate } from 'react-router-dom'

export default function ThankYouNote() {
  const navigate = useNavigate()

  return (
    <div className="thankyou-page">
      <img
        className="thankyou-page__bg"
        src="/assets/image_4b4d4ea2d414d393193e0788190518e3b46bc6c3.png"
        alt="Prayer hands"
      />
      <div className="thankyou-page__overlay" />
      <div className="thankyou-page__content">
        <h1 className="thankyou-page__title">
          Thank You for the Interest<br />in joining the Global Intercessors family
        </h1>
        <div className="thankyou-page__actions">
          <button className="btn-back" onClick={() => navigate(-1)}>Back</button>
          <Link to="/joining-the-session" className="btn-join-platform">Join the Platform</Link>
        </div>
      </div>
    </div>
  )
}
