import { Link, useNavigate } from 'react-router-dom'

export default function PrayerRequestForm() {
  const navigate = useNavigate()

  return (
    <div className="prayer-form-page">
      <h1>Send Us Your Prayer Request</h1>
      <p className="subtitle">We Will be Praying &amp; Contacting You.</p>

      <form className="prayer-form" onSubmit={e => { e.preventDefault(); navigate('/prayer-request-thanks') }}>
        <div className="prayer-form-row">
          <input className="prayer-input" type="text" placeholder="Full Name:" />
          <input className="prayer-input" type="tel" placeholder="Phone:" />
          <input className="prayer-input" type="email" placeholder="Email:" />
        </div>
        <div className="prayer-form-row-2">
          <input className="prayer-input" type="text" placeholder="Sex" />
          <input className="prayer-input" type="text" placeholder="Age:" />
        </div>
        <div className="prayer-form-row-2">
          <input className="prayer-input" type="text" placeholder="City:" />
          <input className="prayer-input" type="text" placeholder="Country:" />
        </div>
        <div className="prayer-born-again">
          <input className="prayer-input" type="text" placeholder="Born Again:" style={{ maxWidth: '380px' }} />
          <div className="yn-group">
            <label>YES</label>
            <input type="checkbox" />
          </div>
          <div className="yn-group">
            <label>NO</label>
            <input type="checkbox" />
          </div>
        </div>
        <textarea className="prayer-textarea" placeholder="Message:" />
        <div className="prayer-form__actions">
          <button type="submit" className="btn-send">SEND</button>
          <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>cancel</button>
        </div>
      </form>
    </div>
  )
}
