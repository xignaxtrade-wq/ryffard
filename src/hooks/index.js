import { useState, useEffect, useRef } from 'react'

const SITE_URL = import.meta.env.VITE_APP_URL || window.location.origin
const DEFAULT_IMAGE = `${SITE_URL}/logo-ryffasrd.png`

function setMetaTag(attr, name, content) {
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

// Dynamic SEO: updates title + meta tags on mount, restores on unmount
export function useSEO({ title, description, image, url, type = 'website' } = {}) {
  useEffect(() => {
    const fullTitle = title
      ? `${title} | RyffasRD`
      : 'RyffasRD | Plataforma de Rifas Digitales en República Dominicana'
    const desc = description || 'Crea y gestiona rifas digitales profesionales en República Dominicana. Talonario digital, sorteo certificado, multi-premio.'
    const img = image || DEFAULT_IMAGE
    const pageUrl = url || (SITE_URL + window.location.pathname)

    document.title = fullTitle

    setMetaTag('name', 'description', desc)
    setMetaTag('property', 'og:title', fullTitle)
    setMetaTag('property', 'og:description', desc)
    setMetaTag('property', 'og:image', img)
    setMetaTag('property', 'og:url', pageUrl)
    setMetaTag('property', 'og:type', type)
    setMetaTag('name', 'twitter:title', fullTitle)
    setMetaTag('name', 'twitter:description', desc)
    setMetaTag('name', 'twitter:image', img)

    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) canonical.setAttribute('href', pageUrl)

    return () => {
      document.title = 'RyffasRD | Plataforma de Rifas Digitales en República Dominicana'
    }
  }, [title, description, image, url, type])
}

// Detect when element enters viewport
export function useInView(threshold = 0.1) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])

  return [ref, isVisible]
}

// Animate a number counter from 0 to end
export function useCounter(end, duration = 2000, start = false) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!start) return
    let startTime = null
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, end, duration])

  return count
}

// Live countdown to a target date
export function useCountdown(targetDate) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - new Date()
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      return {
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      }
    }
    setTime(calc())
    const interval = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  return time
}

// PWA install prompt
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setCanInstall(false)
  }

  return { canInstall, install }
}
