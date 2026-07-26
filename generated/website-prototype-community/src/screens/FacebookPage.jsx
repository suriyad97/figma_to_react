import { useNavigate } from 'react-router-dom'

export default function FacebookPage() {
  const navigate = useNavigate()
  return (
    <div className="facebook-page">
      <div className="facebook-logo-text">facebook</div>
      <div className="facebook-mockup">
        <div style={{
          width: '100%', height: '100%',
          background: '#3b5998',
          display: 'flex', flexDirection: 'column'
        }}>
          {/* Mockup header */}
          <div style={{ background: '#3b5998', padding: '8px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#3b5998', fontWeight: '900', fontSize: '14px' }}>f</span>
            </div>
            <div style={{ flex: 1, background: '#fff', borderRadius: '12px', height: '16px' }} />
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0,1,2].map(i => <div key={i} style={{ width: '8px', height: '8px', background: '#aaa', borderRadius: '2px' }} />)}
            </div>
          </div>
          {/* Mockup body */}
          <div style={{ flex: 1, background: '#e9ebee', display: 'flex', gap: '0', overflow: 'hidden' }}>
            <div style={{ width: '140px', background: '#f5f6f7', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[60,50,50,50,50,40,40,40].map((w,i) => (
                <div key={i} style={{ width: `${w}%`, height: '6px', background: '#ccc', borderRadius: '3px' }} />
              ))}
            </div>
            <div style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ background: '#fff', borderRadius: '4px', padding: '8px' }}>
                <div style={{ height: '6px', background: '#ccc', borderRadius: '3px', width: '60%', marginBottom: '6px' }} />
                <div style={{ height: '60px', background: '#b0c4de', borderRadius: '3px' }} />
              </div>
              <div style={{ background: '#fff', borderRadius: '4px', padding: '8px' }}>
                <div style={{ height: '6px', background: '#ccc', borderRadius: '3px', width: '50%', marginBottom: '6px' }} />
                <div style={{ height: '50px', background: '#b0c4de', borderRadius: '3px' }} />
              </div>
            </div>
            <div style={{ width: '100px', background: '#f5f6f7', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[80,60,60].map((w,i) => (
                <div key={i} style={{ width: `${w}%`, height: '6px', background: '#ccc', borderRadius: '3px' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <button className="facebook-close" onClick={() => navigate(-1)} aria-label="Close">X</button>
    </div>
  )
}
