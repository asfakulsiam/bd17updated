
'use client';

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Check if window is defined (i.e., we're on the client)
    if (typeof window === 'undefined') {
        return;
    }

    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Set the initial value on the client
    checkIsMobile();

    window.addEventListener("resize", checkIsMobile)
    
    return () => {
      window.removeEventListener("resize", checkIsMobile)
    }
  }, [])

  return isMobile
}
