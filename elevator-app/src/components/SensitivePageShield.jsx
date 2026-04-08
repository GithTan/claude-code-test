import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { logSensitivePageAccess } from '../lib/api'

export default function SensitivePageShield({ label = 'Confidential', pageKey = 'confidential_page', children }) {
  const { user, role } = useAuth()
  const [notice, setNotice] = useState('')

  const watermarkText = useMemo(() => {
    const who = user?.email || role || 'authorized user'
    const when = new Date().toLocaleString('en-PH')
    return `${label} • ${who} • ${when}`
  }, [label, role, user])

  useEffect(() => {
    const viewKey = `${pageKey}:${window.location.pathname}:${user?.email || role || 'unknown'}`
    if (!sessionStorage.getItem(viewKey)) {
      sessionStorage.setItem(viewKey, '1')
      logSensitivePageAccess(pageKey, label, window.location.pathname, user?.email || null, role || null)
    }
  }, [label, pageKey, role, user])

  useEffect(() => {
    function blockCopyAction(message) {
      setNotice(message)
      window.clearTimeout(window.__fiecSensitiveNoticeTimeout)
      window.__fiecSensitiveNoticeTimeout = window.setTimeout(() => setNotice(''), 2200)
    }

    function handleContextMenu(event) {
      event.preventDefault()
      blockCopyAction('Right click is disabled on confidential pages.')
    }

    function handleCopyLike(event) {
      event.preventDefault()
      blockCopyAction('Copying is disabled on confidential pages.')
    }

    function handleKeyDown(event) {
      const key = String(event.key || '').toLowerCase()
      const command = event.ctrlKey || event.metaKey
      if (command && ['c', 'p', 's', 'u'].includes(key)) {
        event.preventDefault()
        blockCopyAction('Copy, print, save, and view-source shortcuts are disabled on confidential pages.')
      }
      if (key === 'printscreen') {
        event.preventDefault()
        blockCopyAction('Please avoid screenshots on confidential pages.')
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('copy', handleCopyLike)
    document.addEventListener('cut', handleCopyLike)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('copy', handleCopyLike)
      document.removeEventListener('cut', handleCopyLike)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div style={{ position: 'relative', userSelect: 'none', WebkitUserSelect: 'none' }}>
      <div style={{ backgroundColor: '#FFF8E8', border: '1px solid #D4AF37', padding: '10px 14px', marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#2C2C2C' }}>{label}</p>
        <p style={{ fontSize: 11, color: '#888888', marginTop: 2 }}>
          Sensitive data is restricted. This page is watermarked and browser copy shortcuts are limited.
        </p>
        {notice && <p style={{ fontSize: 11, color: '#8B0000', marginTop: 6, fontWeight: 700 }}>{notice}</p>}
      </div>

      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 20,
          opacity: 0.11,
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='420' height='220'>
              <text x='16' y='110' fill='#D4AF37' font-size='18' font-family='Arial, sans-serif' transform='rotate(-18 210 110)'>${watermarkText}</text>
            </svg>`
          )}")`,
          backgroundRepeat: 'repeat',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
