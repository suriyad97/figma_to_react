import { Link, useNavigate } from 'react-router-dom'

export default function ZoomPage() {
  const navigate = useNavigate()
  return (
    <div className="zoom-page">
      <div className="zoom-main">
        <span className="zoom-logo-text">zoom</span>
      </div>
      <button className="zoom-close" onClick={() => navigate(-1)} aria-label="Close">X</button>
    </div>
  )
}
