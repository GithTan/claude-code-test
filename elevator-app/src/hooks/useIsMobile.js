import { useEffect, useState } from 'react'

export default function useIsMobile(breakpoint = 900) {
  const getMatch = () => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= breakpoint
  }

  const [isMobile, setIsMobile] = useState(getMatch)

  useEffect(() => {
    function handleResize() {
      setIsMobile(getMatch())
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoint])

  return isMobile
}
