import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

// Animated hexagon loop SVG for the hero
function HexLoop() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <svg
        width="680" height="680" viewBox="0 0 680 680"
        className="opacity-[0.07] animate-spin-very-slow"
      >
        {/* Outer ring */}
        <polygon
          points="340,40 600,190 600,490 340,640 80,490 80,190"
          fill="none" stroke="var(--cyan)" strokeWidth="1"
        />
        {/* Middle ring */}
        <polygon
          points="340,100 550,225 550,455 340,580 130,455 130,225"
          fill="none" stroke="var(--cyan)" strokeWidth="0.5" opacity="0.6"
        />
        {/* Inner ring */}
        <polygon
          points="340,170 490,265 490,415 340,510 190,415 190,265"
          fill="none" stroke="var(--cyan)" strokeWidth="0.5" opacity="0.3"
        />
        {/* Center dot */}
        <circle cx="340" cy="340" r="4" fill="var(--cyan)" opacity="0.5" />
        {/* Connection lines from center to vertices */}
        {[
          [340, 40], [600, 190], [600, 490], [340, 640], [80, 490], [80, 190],
        ].map(([x, y], i) => (
          <line
            key={i} x1="340" y1="340" x2={x} y2={y}
            stroke="var(--cyan)" strokeWidth="0.3" opacity="0.2"
          />
        ))}
      </svg>

      {/* Orbiting particles */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[var(--cyan)]"
          style={{
            animation: `orbit ${8 + i * 2}s linear infinite`,
            animationDelay: `${i * -1.5}s`,
            opacity: 0.4 + i * 0.1,
          }}
        />
      ))}
    </div>
  )
}

// Pipeline step visualization (animated)
function PipelineDemo() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % 4)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const steps = [
    { name: 'VALIDATE', icon: 'M13 5L6.5 11.5L3 8', delay: 0 },
    { name: 'SIMULATE', icon: 'M2 12L5.5 5L8.5 8L11 3L14 7', delay: 1 },
    { name: 'ANALYZE', icon: 'M8 2V8L12 12', delay: 2 },
    { name: 'SUGGEST', icon: 'M2 8H14M10 4L14 8L10 12', delay: 3 },
  ]

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => (
        <div key={step.name} className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-500 ${
              i <= active
                ? i === active
                  ? 'border-[var(--cyan-dim)] bg-[var(--cyan)]/5 scale-105 shadow-[0_0_20px_var(--cyan-dim)]'
                  : 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-[var(--border)] bg-[var(--surface-2)]'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d={step.icon}
                stroke={i <= active ? (i === active ? 'var(--cyan)' : 'var(--emerald)') : 'var(--text-muted)'}
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
            <span className={`font-mono-lab text-[10px] tracking-[0.15em] font-semibold transition-colors duration-500 ${
              i <= active
                ? i === active ? 'text-[var(--cyan)]' : 'text-emerald-400'
                : 'text-[var(--text-muted)]'
            }`}>
              {step.name}
            </span>
            {i === active && (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-pulse-dot" />
            )}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-6 h-px transition-colors duration-500 ${
              i < active ? 'bg-emerald-400' : 'bg-[var(--border)]'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

// Feature card
function FeatureCard({ icon, title, desc, accent, delay }) {
  return (
    <div
      className="animate-slide-up group relative bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-7 transition-all duration-500 hover:border-[var(--border-bright)] hover:bg-[var(--surface-2)]"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Hover glow */}
      <div className={`absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b ${accent} pointer-events-none`} />

      <div className="relative">
        <div className="w-11 h-11 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mb-5 group-hover:border-[var(--cyan-dim)] transition-colors">
          {icon}
        </div>
        <h3 className="font-mono-lab text-sm font-semibold text-[var(--text-primary)] mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  )
}

// Animated counter
function AnimCounter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true) },
      { threshold: 0.5 }
    )
    const el = document.getElementById(`counter-${target}`)
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  useEffect(() => {
    if (!started) return
    let start = 0
    const step = target / (duration / 16)
    const interval = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(interval)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(interval)
  }, [started, target, duration])

  return (
    <span id={`counter-${target}`} className="font-mono-lab text-3xl font-bold text-[var(--cyan)]">
      {count}{suffix}
    </span>
  )
}

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex flex-col">
        {/* Background layers */}
        <div className="absolute inset-0">
          {/* Deep radial gradient */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-[radial-gradient(ellipse,_rgba(0,240,255,0.06)_0%,_transparent_50%)]" />
          {/* Secondary glow */}
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse,_rgba(52,211,153,0.03)_0%,_transparent_60%)]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(var(--cyan) 1px, transparent 1px), linear-gradient(90deg, var(--cyan) 1px, transparent 1px)`,
              backgroundSize: '80px 80px',
            }}
          />
        </div>

        <HexLoop />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-lg bg-[var(--cyan)] opacity-10" />
              <div className="absolute inset-[2px] rounded-md border border-[var(--cyan)] opacity-40" />
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="relative z-10">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="var(--cyan)" strokeWidth="1.5" fill="none"/>
                <circle cx="8" cy="8" r="2" fill="var(--cyan)" opacity="0.8"/>
              </svg>
            </div>
            <span className="font-mono-lab text-base font-semibold text-[var(--text-primary)] tracking-tight">
              LoopLab
            </span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="font-mono-lab text-[11px] tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              FEATURES
            </a>
            <a href="#how-it-works" className="font-mono-lab text-[11px] tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              HOW IT WORKS
            </a>
            <a href="#architecture" className="font-mono-lab text-[11px] tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              ARCHITECTURE
            </a>
            <button
              onClick={() => navigate('/dashboard')}
              className="font-mono-lab text-[11px] tracking-wider font-semibold text-[var(--surface-0)] bg-[var(--cyan)] px-4 py-2 rounded-lg cursor-pointer transition-all hover:shadow-[0_0_20px_var(--cyan-dim)] active:scale-[0.97]"
            >
              LAUNCH APP
            </button>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-20">
          {/* Badge */}
          <div className="animate-slide-up mb-8">
            <span className="inline-flex items-center gap-2 font-mono-lab text-[10px] tracking-[0.2em] uppercase px-4 py-1.5 rounded-full border border-[var(--cyan-dim)] bg-[var(--cyan)]/5 text-[var(--cyan)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-pulse-dot" />
              Materials Discovery Engine
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-slide-up delay-1 text-center max-w-4xl">
            <span className="block text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-[var(--text-primary)]">
              Close the loop on
            </span>
            <span className="block text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mt-1">
              <span className="bg-gradient-to-r from-[var(--cyan)] via-[#34d399] to-[var(--cyan)] bg-clip-text text-transparent">
                materials discovery
              </span>
            </span>
          </h1>

          {/* Subheadline */}
          <p className="animate-slide-up delay-2 mt-6 text-center max-w-xl text-lg text-[var(--text-secondary)] leading-relaxed">
            Define a goal. Watch the pipeline run live. Get AI-powered suggestions for the next iteration. All in one dashboard.
          </p>

          {/* CTA row */}
          <div className="animate-slide-up delay-3 flex items-center gap-4 mt-10">
            <button
              onClick={() => navigate('/dashboard')}
              className="group font-mono-lab text-sm font-semibold tracking-wider text-[var(--surface-0)] bg-[var(--cyan)] px-7 py-3.5 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-[0_0_40px_var(--cyan-dim)] active:scale-[0.97]"
            >
              <span className="flex items-center gap-2">
                START EXPERIMENTING
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="group-hover:translate-x-1 transition-transform">
                  <path d="M1 7H13M10 4L13 7L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </button>
            <a
              href="#how-it-works"
              className="font-mono-lab text-sm tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-5 py-3.5 rounded-xl border border-[var(--border)] hover:border-[var(--border-bright)] transition-all cursor-pointer"
            >
              SEE HOW IT WORKS
            </a>
          </div>

          {/* Animated pipeline preview */}
          <div className="animate-slide-up delay-4 mt-16">
            <PipelineDemo />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in delay-6">
          <span className="font-mono-lab text-[9px] tracking-[0.3em] text-[var(--text-muted)] uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-[var(--text-muted)] to-transparent animate-pulse" />
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="relative py-32 px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <span className="font-mono-lab text-[10px] tracking-[0.3em] uppercase text-[var(--cyan)] block mb-4">
              Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
              Everything you need to iterate faster
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              delay={0.1}
              accent="from-[var(--cyan)]/5 to-transparent"
              icon={
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L2 6L10 10L18 6L10 2Z" stroke="var(--cyan)" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M2 14L10 18L18 14" stroke="var(--cyan)" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M2 10L10 14L18 10" stroke="var(--cyan)" strokeWidth="1.5" strokeLinejoin="round" opacity="0.5"/>
                </svg>
              }
              title="3-Step Async Pipeline"
              desc="Validation, simulation, and analysis run asynchronously. No blocking, no polling — just real-time progress streamed to your screen."
            />
            <FeatureCard
              delay={0.15}
              accent="from-emerald-500/5 to-transparent"
              icon={
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 17L7 10L11 13L15 5L17 8" stroke="var(--emerald)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="15" cy="5" r="2" stroke="var(--emerald)" strokeWidth="1.5"/>
                </svg>
              }
              title="Live WebSocket Streaming"
              desc="Watch each pipeline step start, progress, and complete in real time. Reconnect mid-run and catch up instantly via event replay."
            />
            <FeatureCard
              delay={0.2}
              accent="from-amber-500/5 to-transparent"
              icon={
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="7" stroke="var(--amber)" strokeWidth="1.5"/>
                  <path d="M10 6V10L13 13" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M14.5 3L17 5.5" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                </svg>
              }
              title="AI-Powered Suggestions"
              desc="An LLM agent analyzes your results and suggests the single most impactful parameter change. Scientific rationale included."
            />
            <FeatureCard
              delay={0.25}
              accent="from-[var(--cyan)]/5 to-transparent"
              icon={
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M8 3H4C3 3 2 4 2 5V15C2 16 3 17 4 17H16C17 17 18 16 18 15V11" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M14 2L18 6L10 14H6V10L14 2Z" stroke="var(--cyan)" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              }
              title="One-Click Iteration"
              desc="AI suggestion pre-fills the next experiment. Tweak a parameter, hit launch — the loop closes in seconds, not hours."
            />
            <FeatureCard
              delay={0.3}
              accent="from-emerald-500/5 to-transparent"
              icon={
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2V18M2 10H18" stroke="var(--emerald)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
                  <rect x="3" y="3" width="14" height="14" rx="2" stroke="var(--emerald)" strokeWidth="1.5"/>
                  <path d="M7 10L9 12L13 8" stroke="var(--emerald)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              title="Export & Compare"
              desc="Download results as JSON or CSV. Full experiment data with all candidates, metrics, and AI suggestions in one file."
            />
            <FeatureCard
              delay={0.35}
              accent="from-amber-500/5 to-transparent"
              icon={
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 3H7L9 7H17L15 13H5L3 3Z" stroke="var(--amber)" strokeWidth="1.5" strokeLinejoin="round"/>
                  <circle cx="7" cy="16" r="1.5" stroke="var(--amber)" strokeWidth="1.5"/>
                  <circle cx="14" cy="16" r="1.5" stroke="var(--amber)" strokeWidth="1.5"/>
                </svg>
              }
              title="Global Process Tracking"
              desc="Browse the app while experiments run. The processing bar and toast notifications keep you updated from any page."
            />
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="relative py-32 px-8">
        {/* Background accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <span className="font-mono-lab text-[10px] tracking-[0.3em] uppercase text-[var(--cyan)] block mb-4">
              The Loop
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
              Five steps. One closed loop.
            </h2>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--cyan-dim)] via-[var(--border)] to-[var(--cyan-dim)] hidden md:block" />

            {[
              {
                num: '01',
                title: 'Define your objective',
                desc: 'Set a materials goal, input parameters like temperature, pressure, concentration, and define constraints.',
                color: 'var(--cyan)',
              },
              {
                num: '02',
                title: 'Pipeline runs automatically',
                desc: 'Three async steps fire in sequence — parameter validation, material simulation, result analysis. All streamed live.',
                color: 'var(--cyan)',
              },
              {
                num: '03',
                title: 'Results arrive in real time',
                desc: 'Watch candidates generated, best material selected, improvement calculated. No refresh needed.',
                color: 'var(--emerald)',
              },
              {
                num: '04',
                title: 'AI suggests next move',
                desc: 'LangChain agent analyzes results and recommends the single most impactful parameter change with scientific reasoning.',
                color: 'var(--amber)',
              },
              {
                num: '05',
                title: 'Iterate in one click',
                desc: 'Suggested parameters pre-fill the next run. Tweak if needed, launch, and the loop begins again.',
                color: 'var(--emerald)',
              },
            ].map((step, i) => (
              <div
                key={step.num}
                className="animate-slide-up relative flex items-start gap-8 mb-14 last:mb-0 md:pl-8"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Number node */}
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] flex items-center justify-center shrink-0">
                  <span className="font-mono-lab text-lg font-bold" style={{ color: step.color }}>
                    {step.num}
                  </span>
                </div>

                <div className="pt-2">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed max-w-lg">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ARCHITECTURE ===== */}
      <section id="architecture" className="relative py-32 px-8">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-mono-lab text-[10px] tracking-[0.3em] uppercase text-[var(--cyan)] block mb-4">
              Under the Hood
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
              Clean architecture, zero bloat
            </h2>
          </div>

          {/* Architecture diagram */}
          <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-8 font-mono-lab text-xs">
            <div className="grid grid-cols-3 gap-6 text-center">
              {/* Frontend */}
              <div className="space-y-3">
                <div className="px-4 py-3 rounded-xl border border-[var(--cyan-dim)] bg-[var(--cyan)]/5">
                  <p className="text-[var(--cyan)] font-semibold text-sm">React + Vite</p>
                  <p className="text-[var(--text-muted)] text-[10px] mt-1">:5173</p>
                </div>
                <div className="flex justify-center gap-3 text-[var(--text-muted)]">
                  <span className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)]">axios</span>
                  <span className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)]">WebSocket</span>
                </div>
              </div>

              {/* Backend */}
              <div className="space-y-3">
                <div className="px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <p className="text-emerald-400 font-semibold text-sm">FastAPI</p>
                  <p className="text-[var(--text-muted)] text-[10px] mt-1">:8000</p>
                </div>
                <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                  <span className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)]">BackgroundTasks</span>
                  <span className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)]">asyncio.Queue</span>
                </div>
              </div>

              {/* Data + AI */}
              <div className="space-y-3">
                <div className="px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <p className="text-amber-400 font-semibold text-sm">MongoDB + AI</p>
                  <p className="text-[var(--text-muted)] text-[10px] mt-1">:27017</p>
                </div>
                <div className="flex justify-center gap-3 text-[var(--text-muted)]">
                  <span className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)]">Motor</span>
                  <span className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)]">LangChain</span>
                </div>
              </div>
            </div>

            {/* Flow arrows */}
            <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-[var(--border)]">
              <span className="text-[var(--text-muted)]">Request</span>
              <svg width="20" height="8" viewBox="0 0 20 8" fill="none">
                <path d="M1 4H19M16 1L19 4L16 7" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[var(--cyan)]">Pipeline</span>
              <svg width="20" height="8" viewBox="0 0 20 8" fill="none">
                <path d="M1 4H19M16 1L19 4L16 7" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-emerald-400">Result</span>
              <svg width="20" height="8" viewBox="0 0 20 8" fill="none">
                <path d="M1 4H19M16 1L19 4L16 7" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-amber-400">AI Suggestion</span>
              <svg width="20" height="8" viewBox="0 0 20 8" fill="none" className="rotate-180">
                <path d="M1 4H19M16 1L19 4L16 7" stroke="var(--cyan)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[var(--cyan)]">Next Run</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mt-12">
            {[
              { value: 3, suffix: '', label: 'Pipeline steps' },
              { value: 5, suffix: 's', label: 'Avg run time' },
              { value: 0, suffix: '', label: 'External brokers', special: 'ZERO' },
              { value: 100, suffix: '%', label: 'Async' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                {stat.special ? (
                  <span className="font-mono-lab text-3xl font-bold text-[var(--cyan)]">{stat.special}</span>
                ) : (
                  <AnimCounter target={stat.value} suffix={stat.suffix} />
                )}
                <p className="font-mono-lab text-[10px] tracking-wider text-[var(--text-muted)] uppercase mt-2">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="relative py-32 px-8">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,_rgba(0,240,255,0.06)_0%,_transparent_60%)] pointer-events-none" />

        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight mb-4">
            Ready to accelerate discovery?
          </h2>
          <p className="text-lg text-[var(--text-secondary)] mb-10">
            Define your first experiment and watch the pipeline run live.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="group font-mono-lab text-sm font-semibold tracking-wider text-[var(--surface-0)] bg-[var(--cyan)] px-8 py-4 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-[0_0_50px_var(--cyan-dim)] active:scale-[0.97]"
          >
            <span className="flex items-center gap-3">
              LAUNCH LOOPLAB
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-1 transition-transform">
                <path d="M1 8H15M12 5L15 8L12 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-[var(--border)] py-8 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded bg-[var(--cyan)] opacity-10" />
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="var(--cyan)" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
            <span className="font-mono-lab text-xs text-[var(--text-muted)]">
              LoopLab
            </span>
          </div>
          <span className="font-mono-lab text-[10px] text-[var(--text-muted)]">
            Materials Discovery Engine
          </span>
        </div>
      </footer>
    </div>
  )
}
