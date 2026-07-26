import { Link, useNavigate } from 'react-router-dom'

export default function PrayerRequestForm() {
  const navigate = useNavigate()
  return (
    <div className="prayer-form-page">
      <h1 className="prayer-form-title">Send Us Your Prayer Request</h1>
      <p className="prayer-form-subtitle">We Will be Praying &amp; Contacting You.</p>

      <form className="prayer-form" onSubmit={e => e.preventDefault()}>
        <div className="prayer-form-row">
          <input className="prayer-form-input" type="text" placeholder="Full Name:" />
          <input className="prayer-form-input" type="tel" placeholder="Phone:" />
          <input className="prayer-form-input" type="email" placeholder="Email:" />
        </div>

        <div className="prayer-form-row">
          <input className="prayer-form-input" type="text" placeholder="Sex" style={{ maxWidth: '45%' }} />
          <input className="prayer-form-input" type="text" placeholder="Age:" style={{ maxWidth: '45%' }} />
        </div>

        <div className="prayer-form-row">
          <input className="prayer-form-input" type="text" placeholder="City:" style={{ maxWidth: '45%' }} />
          <input className="prayer-form-input" type="text" placeholder="Country:" style={{ maxWidth: '45%' }} />
        </div>

        <div className="prayer-born-again">
          <div className="prayer-born-label">Born Again:</div>
          <div className="prayer-born-options">
            <span>YES</span>
            <button type="button" className="prayer-toggle" aria-label="Yes" />
            <span>NO</span>
            <button type="button" className="prayer-toggle" aria-label="No" />
          </div>
        </div>

        <textarea
          className="prayer-form-textarea"
          placeholder="Message:"
          rows={10}
        />

        <div className="prayer-form-actions">
          <button type="submit" className="prayer-send-btn"
            onClick={() => navigate('/prayer-request-thanks')}>
            SEND
          </button>
          <button type="button" className="prayer-cancel-btn" onClick={() => navigate(-1)}>
            cancel
          </button>
        </div>
      </form>
    </div>
  )
}
