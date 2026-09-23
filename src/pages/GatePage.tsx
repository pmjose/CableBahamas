import { seededRandom } from '../data/scenario'
const scenarioRandom = seededRandom(2113)
import { useState, useEffect, useRef, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { ArrowRight, Lock } from 'lucide-react'

// Animated particle-network canvas — nodes drift, lines connect nearby ones.
// Evokes a high-speed connectivity grid without any brand reference.
function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mouse = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0, h = 0, dpr = window.devicePixelRatio || 1

    type P = { x: number; y: number; vx: number; vy: number; r: number; pulse: number }
    let particles: P[] = []

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const target = Math.floor((w * h) / 12000) // density
      particles = Array.from({ length: target }, () => ({
        x: scenarioRandom() * w,
        y: scenarioRandom() * h,
        vx: (scenarioRandom() - 0.5) * 0.35,
        vy: (scenarioRandom() - 0.5) * 0.35,
        r: 1 + scenarioRandom() * 1.6,
        pulse: scenarioRandom() * Math.PI * 2,
      }))
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onLeave = () => { mouse.current = null }

    const tick = (t: number) => {
      ctx.clearRect(0, 0, w, h)

      // soft red glow background pass
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.6, 0, w * 0.5, h * 0.6, Math.max(w, h) * 0.7)
      grad.addColorStop(0, 'rgba(255, 68, 56, 0.10)')
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // update particles
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.pulse += 0.03

        // wrap around edges
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10
        if (p.y > h + 10) p.y = -10

        // slight gravitation toward mouse
        if (mouse.current) {
          const dx = mouse.current.x - p.x
          const dy = mouse.current.y - p.y
          const d2 = dx * dx + dy * dy
          if (d2 < 22500) {
            p.vx += (dx / Math.sqrt(d2)) * 0.02
            p.vy += (dy / Math.sqrt(d2)) * 0.02
          }
        }
        // friction
        p.vx *= 0.985
        p.vy *= 0.985
      }

      // draw lines between nearby particles
      const maxDist = 130
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < maxDist) {
            const alpha = (1 - d / maxDist) * 0.5
            ctx.strokeStyle = `rgba(255, 68, 56, ${alpha})`
            ctx.lineWidth = 0.6
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // line to cursor
      if (mouse.current) {
        for (const p of particles) {
          const dx = mouse.current.x - p.x
          const dy = mouse.current.y - p.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 180) {
            ctx.strokeStyle = `rgba(255, 226, 77, ${(1 - d / 180) * 0.7})`
            ctx.lineWidth = 0.8
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(mouse.current.x, mouse.current.y)
            ctx.stroke()
          }
        }
      }

      // draw nodes
      for (const p of particles) {
        const flicker = 0.65 + Math.sin(p.pulse) * 0.35
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, ${120 + Math.floor(flicker * 80)}, ${120 + Math.floor(flicker * 80)}, ${0.6 + flicker * 0.4})`
        ctx.fill()
        // halo
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 68, 56, ${0.06 * flicker})`
        ctx.fill()
      }

      // travelling data pulses along a few connections
      const pulseTime = (t / 1000) % 4
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 - pulseTime * 0.15})`
      ctx.lineWidth = 1.5
      for (let i = 0; i < particles.length; i += 7) {
        const a = particles[i]
        const b = particles[(i + 3) % particles.length]
        const k = pulseTime / 4
        const x = a.x + (b.x - a.x) * k
        const y = a.y + (b.y - a.y) * k
        ctx.beginPath()
        ctx.arc(x, y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.fill()
      }

      raf = requestAnimationFrame(tick)
    }

    resize()
    raf = requestAnimationFrame(tick)
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  )
}

export default function GatePage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (login(pw)) {
      navigate('/landing')
    } else {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden mesh-bg animate-gradient-shift flex items-center justify-center px-4">
      {/* Animated particle network */}
      <ParticleNetwork />

      {/* Floating orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/5 w-72 h-72 rounded-full bg-vfes-red/30 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/5 w-96 h-96 rounded-full bg-vfes-red-light/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-vfes-red-dark/40 blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Pulsing ring */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full border border-vfes-red/20 animate-pulse-glow" />
        <div className="absolute w-[800px] h-[800px] rounded-full border border-vfes-red/10 animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Scanline */}
      <div className="pointer-events-none absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-vfes-red/15 to-transparent animate-scan" />

      <div className={`relative z-10 w-full max-w-md ${shake ? 'animate-shake' : ''}`}>
        <div className="glass rounded-2xl p-10 shadow-2xl">
          <div className="flex items-center gap-2 mb-8 text-xs uppercase tracking-[0.4em] text-white/50">
            <span className="w-2 h-2 rounded-full bg-vfes-red animate-pulse" />
            {t('Secure Channel')}
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-3 bg-gradient-to-br from-white via-white to-vfes-red-light bg-clip-text text-transparent">
            {t('headline.line1')}<br/>{t('headline.line2a')} <span className="inline-block text-vfes-red-light animate-faster-pulse" style={{ WebkitTextFillColor: 'currentColor' }}>{t('headline.accent')}</span>{t('headline.line2b')}
          </h1>

          <p className="text-white/60 text-sm mb-8 leading-relaxed">
            {t('A new chapter in connectivity. Authorized access only.')}
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="password"
                value={pw}
                onChange={(e) => { setPw(e.target.value); setError(false) }}
                placeholder={t('Access code')}
                autoFocus
                className={`w-full bg-black/40 border rounded-lg pl-11 pr-4 py-3.5 text-white placeholder-white/30 focus:outline-none transition ${
                  error ? 'border-vfes-red' : 'border-white/10 focus:border-vfes-red/60'
                }`}
              />
            </div>

            {error && (
              <p className="text-vfes-red text-xs">{t('Invalid access code. Try again.')}</p>
            )}

            <button
              type="submit"
              className="group w-full bg-vfes-red hover:bg-vfes-red-light text-vfes-dark font-semibold py-3.5 rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-vfes-red/30"
            >
              {t('Enter')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6 tracking-wider">
          © 2026 — {t('Powered by Snowflake AI Data Cloud.')}
        </p>
      </div>
    </div>
  )
}
