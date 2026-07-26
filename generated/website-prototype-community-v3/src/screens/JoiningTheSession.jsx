import { Link, useNavigate } from 'react-router-dom'

export default function JoiningTheSession() {
  const navigate = useNavigate()

  return (
    <div className="joining-page">
      <div className="joining-page__options">
        <Link to="/zoom-page" className="btn-zoom">Pray with us on Zoom</Link>
        <Link to="/facebook-page" className="btn-facebook">Watch a recorded session</Link>
      </div>
      <button className="btn-close-circle" onClick={() => navigate(-1)} aria-label="Close">
        X
      </button>
    </div>
  )
}
