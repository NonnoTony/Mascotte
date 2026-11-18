import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Scene } from '../types'



const HIDDEN: Scene = { action: 'hidden', say: '', x0: -80, x1: -80, ms: 0, seq: 0 }
const scene = atom({ plugin: 'clawd-mascotte', key: 'scene' } as const, HIDDEN, {
  shape: 'scene-1',
})

// ---------- Disegno ----------
const W = 320 // larghezza del palco
const H = 64
const U = 5 // un "pixel" di Clawd
const CW = 12 * U // 60
const Y = H - 8 * U - 4 // linea dei piedi
const MAIN = '#d97757'
const INK = '#141414'

type R = [number, number, number, number]
const rects = (list: R[], extra = '') =>
  list.map(([x, y, w, h]) => `<rect x="${x * U}" y="${y * U}" width="${w * U}" height="${h * U}"${extra}/>`).join('')

function eyes(kind: string): string {
  const at = (fn: (c: number) => R[]) => rects([...fn(3), ...fn(8)])
  switch (kind) {
    case 'happy':
      return `<g fill="${INK}">${at(c => [[c - 0.3, 1.5, 0.5, 0.5], [c + 0.2, 1, 0.6, 0.5], [c + 0.8, 1.5, 0.5, 0.5]])}</g>`
    case 'closed':
      return `<g fill="${INK}">${at(c => [[c - 0.2, 1.4, 1.4, 0.4]])}</g>`
    case 'x':
      return `<g fill="${INK}">${at(c => [[c - 0.2, 0.8, 0.4, 0.4], [c + 0.8, 0.8, 0.4, 0.4], [c + 0.3, 1.3, 0.4, 0.4], [c - 0.2, 1.8, 0.4, 0.4], [c + 0.8, 1.8, 0.4, 0.4]])}</g>`
    case 'heart':
      return `<g fill="#ff3d6e">${at(c => [[c - 0.3, 0.9, 0.6, 0.4], [c + 0.7, 0.9, 0.6, 0.4], [c - 0.3, 1.3, 1.6, 0.4], [c + 0.2, 1.7, 0.6, 0.4]])}</g>`
    default:
      return `<g class="eyes" fill="${INK}">${rects([[3, 1, 1, 1], [8, 1, 1, 1]])}</g>`
  }
}

const FACE: Record<string, { eyes: string; mouth?: R[]; brows?: boolean; blush?: boolean }> = {
  idle: { eyes: 'normal' },
  walk: { eyes: 'normal' },
  look: { eyes: 'normal', mouth: [[5.5, 3, 1, 1]] },
  peek: { eyes: 'normal' },
  dance: { eyes: 'happy', mouth: [[5, 3, 2, 0.6], [5.4, 3.6, 1.2, 0.4]] },
  wave: { eyes: 'happy' },
  jump: { eyes: 'happy', mouth: [[5, 3, 2, 0.6], [5.4, 3.6, 1.2, 0.4]] },
  happy: { eyes: 'happy', mouth: [[5, 3, 2, 0.6], [5.4, 3.6, 1.2, 0.4]], blush: true },
  surprised: { eyes: 'normal', mouth: [[5.5, 3, 1, 1]] },
  sleep: { eyes: 'closed' },
  stretch: { eyes: 'happy' },
  love: { eyes: 'heart', mouth: [[5, 3, 2, 0.6], [5.4, 3.6, 1.2, 0.4]], blush: true },
  dizzy: { eyes: 'x' },
  spin: { eyes: 'happy' },
  angry: { eyes: 'normal', brows: true },
}

const PARTICLES: Record<string, string[]> = {
  dance: ['♪', '♫', '♪', '✦'],
  sleep: ['Z', 'z', 'Z'],
  love: ['❤', '❤', '❤', '❤'],
  happy: ['✦', '✦'],
  jump: ['✦', '✦'],
  dizzy: ['✦', '✦', '✦'],
  angry: ['#', '!'],
}

function clawd(face: { eyes: string; mouth?: R[]; brows?: boolean; blush?: boolean }) {
  return `
  <g class="leg-a" fill="${MAIN}">${rects([[2, 6, 1, 2], [7, 6, 1, 2]])}</g>
  <g class="leg-b" fill="${MAIN}">${rects([[4, 6, 1, 2], [9, 6, 1, 2]])}</g>
  <g class="arm-l"><rect x="0" y="${2 * U}" width="${2 * U + 1}" height="${2 * U}" fill="${MAIN}"/></g>
  <g class="arm-r"><rect x="${10 * U - 1}" y="${2 * U}" width="${2 * U + 1}" height="${2 * U}" fill="${MAIN}"/></g>
  <rect x="${2 * U}" y="0" width="${8 * U}" height="${6 * U}" fill="${MAIN}"/>
  ${face.blush ? `<g fill="#ff8fa8">${rects([[2.3, 2.4, 0.8, 0.5], [8.9, 2.4, 0.8, 0.5]])}</g>` : ''}
  ${eyes(face.eyes)}
  ${face.mouth ? `<g fill="${INK}">${rects(face.mouth)}</g>` : ''}
  ${face.brows ? `<g fill="${INK}">${rects([[2.6, 0.2, 0.8, 0.35], [3.3, 0.5, 0.8, 0.35], [8.6, 0.2, 0.8, 0.35], [7.9, 0.5, 0.8, 0.35]])}</g>` : ''}`
}

function stage(s: Scene): string {
  const face = FACE[s.action] ?? FACE.idle!
  const moving = s.x0 !== s.x1
  const peekY = Y + 22
  let pos = ''
  if (s.action === 'peek') {
    pos = `@keyframes pos{0%{transform:translate(${s.x1}px,${H + 4}px)}20%,75%{transform:translate(${s.x1}px,${peekY}px)}100%{transform:translate(${s.x1}px,${peekY}px)}}
      .pos{animation:pos ${s.ms}ms ease-out forwards}`
  } else if (s.action === 'unpeek') {
    pos = `@keyframes pos{from{transform:translate(${s.x1}px,${peekY}px)}to{transform:translate(${s.x1}px,${H + 4}px)}}
      .pos{animation:pos ${s.ms}ms ease-in forwards}`
  } else if (moving) {
    pos = `@keyframes pos{from{transform:translate(${s.x0}px,${Y}px)}to{transform:translate(${s.x1}px,${Y}px)}}
      .pos{animation:pos ${s.ms}ms linear forwards}`
  } else {
    pos = `.pos{transform:translate(${s.x1}px,${Y}px)}`
  }
  const parts = (PARTICLES[s.action] ?? [])
    .map((ch, i) => {
      const x = s.x1 + 10 + ((i * 17) % 44)
      return `<text class="p" x="${x}" y="${Y + 6}" style="animation-delay:${i * 0.45}s">${ch}</text>`
    })
    .join('')
  const a = s.action
  const body = moving || a === 'walk' ? 'walk' : a
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" shape-rendering="crispEdges">
<style>
  *{transform-box:fill-box}
  ${pos}
  .body{transform-origin:50% 100%;animation:breathe 2.6s ease-in-out infinite}
  .arm-l{transform-origin:100% 50%} .arm-r{transform-origin:0% 50%}
  .eyes{transform-origin:50% 50%;animation:blink 4s infinite}
  .p{font:bold 11px sans-serif;fill:${a === 'love' ? '#ff3d6e' : a === 'sleep' ? '#8a8aa8' : '#f0a020'};opacity:0;animation:float 1.8s ease-out infinite}
  .walk .body{animation:bob .4s ease-in-out infinite}
  .walk .leg-a,.dance .leg-a{animation:step .4s ease-in-out infinite}
  .walk .leg-b,.dance .leg-b{animation:step .4s ease-in-out -.2s infinite}
  .dance .body{animation:dance .8s ease-in-out infinite}
  .dance .arm-l{animation:upl .4s ease-in-out infinite alternate}
  .dance .arm-r{animation:upr .4s ease-in-out infinite alternate-reverse}
  .wave .arm-r{animation:wave .3s ease-in-out infinite alternate}
  .jump .body,.happy .body{animation:jump .9s cubic-bezier(.3,.7,.4,1) 2}
  .jump .arm-l,.happy .arm-l{animation:upl .45s ease-in-out 4 alternate}
  .jump .arm-r,.happy .arm-r{animation:upr .45s ease-in-out 4 alternate}
  .love .body{animation:squish .6s ease-out 3}
  .stretch .body{animation:stretch 1.4s ease-in-out}
  .stretch .arm-l{animation:upl .7s ease-in-out 2 alternate}
  .stretch .arm-r{animation:upr .7s ease-in-out 2 alternate}
  .sleep .body{transform:rotate(-6deg);animation:breathe 3.8s ease-in-out infinite}
  .dizzy .body,.spin .body{transform-origin:50% 50%;animation:spin 1.1s ease-in-out}
  .angry .body{animation:shake .25s linear 6}
  .look .body{animation:jump .9s cubic-bezier(.3,.7,.4,1)}
  @keyframes breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.03,.97)}}
  @keyframes blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
  @keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
  @keyframes step{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
  @keyframes dance{0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(-5px,-6px) rotate(-10deg)}50%{transform:scale(1.06,.94)}75%{transform:translate(5px,-6px) rotate(10deg)}}
  @keyframes upl{from{transform:rotate(0)}to{transform:rotate(55deg)}}
  @keyframes upr{from{transform:rotate(0)}to{transform:rotate(-55deg)}}
  @keyframes wave{from{transform:rotate(-15deg)}to{transform:rotate(-65deg)}}
  @keyframes jump{0%{transform:translateY(0) scale(1,1)}15%{transform:scale(1.15,.85)}45%,60%{transform:translateY(-16px) scale(.94,1.08)}88%{transform:translateY(0) scale(1.12,.88)}100%{transform:none}}
  @keyframes squish{0%,100%{transform:scale(1,1)}30%{transform:scale(1.2,.8)}60%{transform:scale(.9,1.1)}}
  @keyframes stretch{0%,100%{transform:scale(1,1)}40%,60%{transform:scale(.92,1.12)}}
  @keyframes spin{to{transform:rotate(720deg)}}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
  @keyframes float{0%{opacity:0;transform:translate(0,0)}20%{opacity:1}100%{opacity:0;transform:translate(6px,-30px)}}
  @media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<rect width="${W}" height="${H}" fill="none"/>
<g class="pos"><g class="${body}"><g class="body">${clawd(face)}</g></g></g>
${parts}
</svg>`
}

// ---------- Comportamento ----------
// Tutto lo stato vive qui; un solo timer (avviato in session.start) fa
// avanzare la sequenza e pubblica la scena da disegnare.
type Step = { action: string; say?: string; to?: number; ms?: number }

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]!
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const SPEED = 0.09 // px per ms

const PHRASES = {
  hello: ['Ciao! 👋', 'Eccomi!', 'Ehilà!', 'Ci sono anch’io!'],
  peek: ['Cucù! 👀', 'Bu!', 'Psst…', 'Chi c’è?'],
  bye: ['Torno dopo!', 'Ciao ciao!', 'Vado a fare un giro…'],
  dance: ['♪ La la la ♪', 'Balliamo! 💃', 'Che ritmo!'],
  tap: ['Ehi! 😄', 'Hihi, solletico!', 'Boing!', 'Ancora! 😆'],
  idle: ['Sono qui! 👋', 'Bella chat! 💬', 'Toccami! 😄', 'Che si dice?'],
  done: ['Fatto! ✨', 'Evviva! 🎉', 'Ecco qua!'],
  notice: ['Oh! 👀', 'Interessante!', 'Hmm…'],
}

let queue: Step[] = []
let stepEnd = 0
let nextAuto = 0
let x = -CW - 10
let visible = false
let busy = false
let seq = 0
let taps: number[] = []
let sulkUntil = 0

const spot = () => rand(10, W - CW - 10)

function play(steps: Step[]) {
  queue = steps.slice()
  stepEnd = 0
  busy = true
}

/** Fa avanzare la mascotte; restituisce la nuova scena, o null se nulla cambia. */
function advance(now: number): Scene | null {
  if (busy && now >= stepEnd) {
    const st = queue.shift()
    if (!st) {
      busy = false
      nextAuto = now + rand(8000, 18000)
      return visible ? { action: 'idle', say: '', x0: x, x1: x, ms: 0, seq: ++seq } : null
    }
    const x0 = x
    const x1 = st.to ?? x
    const ms = st.ms ?? Math.max(300, Math.abs(x1 - x0) / SPEED)
    x = x1
    visible = st.action !== 'hidden'
    stepEnd = now + ms
    return { action: st.action, say: st.say ?? '', x0, x1, ms, seq: ++seq }
  }
  if (!busy && now >= nextAuto) {
    autoAction(now)
    return advance(now)
  }
  return null
}

function enter(fast = false): Step[] {
  x = Math.random() < 0.5 ? -CW - 10 : W + 10
  const to = spot()
  return [{ action: 'walk', to, ms: fast ? Math.abs(to - x) / (SPEED * 2) : undefined }]
}
function leave(say = pick(PHRASES.bye)): Step[] {
  return [
    { action: 'wave', say, ms: 1200 },
    { action: 'walk', to: x + CW / 2 < W / 2 ? -CW - 10 : W + 10 },
    { action: 'hidden', ms: 10 },
  ]
}

const ACTIONS: Record<string, () => Step[]> = {
  dance: () => [{ action: 'dance', say: pick(PHRASES.dance), ms: 4200 }],
  wave: () => [{ action: 'wave', say: pick(PHRASES.hello), ms: 2000 }],
  jump: () => [{ action: 'jump', say: 'Hop! 🦘', ms: 1900 }],
  spin: () => [{ action: 'spin', say: 'Wiii! 🌀', ms: 1300 }],
  sleep: () => [
    { action: 'sleep', say: 'Che sonno… 🥱', ms: 9000 },
    { action: 'surprised', say: 'Eh?!', ms: 600 },
    { action: 'stretch', say: 'Ahhh… 😌', ms: 1500 },
  ],
  love: () => [{ action: 'love', say: pick(['Coccole! 🥰', 'Ti voglio bene! 💕']), ms: 2400 }],
  come: () => [{ action: 'wave', say: 'Eccomi! 😄', ms: 1800 }],
  look: () => [{ action: 'look', say: pick(PHRASES.notice), ms: 1600 }],
  wander: () => [{ action: 'walk', to: spot() }],
  chat: () => [{ action: 'happy', say: pick(PHRASES.idle), ms: 2200 }],
}

function autoAction(now: number) {
  if (!visible) {
    if (now < sulkUntil) {
      nextAuto = sulkUntil
      return
    }
    if (Math.random() < 0.4) {
      x = spot()
      return play([
        { action: 'peek', say: pick(PHRASES.peek), ms: 3200 },
        ...(Math.random() < 0.5
          ? [{ action: 'jump', say: 'Eccomi!', ms: 1900 }]
          : [{ action: 'unpeek', ms: 500 }, { action: 'hidden', ms: 10 }]),
      ])
    }
    return play([...enter(), { action: 'wave', say: pick(PHRASES.hello), ms: 1800 }])
  }
  if (Math.random() < 0.15) return play(leave())
  doAction(pick(['dance', 'dance', 'wave', 'jump', 'jump', 'spin', 'sleep', 'look', 'wander', 'wander', 'chat']))
}

function doAction(name: string) {
  if (name === 'leave') {
    if (visible) play(leave())
    return
  }
  const make = ACTIONS[name]
  if (make) play([...(visible ? [] : enter(true)), ...make()])
}

function tap() {
  const now = Date.now()
  taps = taps.filter(t => now - t < 3000)
  taps.push(now)
  const n = taps.length
  if (n >= 7) {
    taps = []
    sulkUntil = now + 20000
    return play([{ action: 'angry', say: 'Ora basta! 😤', ms: 1500 }, ...leave('Me ne vado! 😤')])
  }
  if (n >= 4) return play([{ action: 'dizzy', say: 'Mi gira la testa… 😵‍💫', ms: 2200 }])
  play(
    pick<Step[]>([
      [{ action: 'happy', say: pick(PHRASES.tap), ms: 1900 }],
      [{ action: 'jump', say: 'Eek! 😲', ms: 1900 }],
      [{ action: 'love', say: 'Hihi 😊', ms: 1800 }],
      [{ action: 'spin', say: 'Wiii! 🌀', ms: 1300 }],
    ]),
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    queue = []
    busy = false
    visible = false
    nextAuto = Date.now() + 3000
    await update($, scene, () => HIDDEN)
    $.clock.every(250, () => {
      const s = advance(Date.now())
      if (s) void update($, scene, () => s)
    })
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    const t = String(e.text ?? '').toLowerCase()
    const has = (...w: string[]) => w.some(k => t.includes(k))
    if (has('vai via', 'sparisci', 'ciao ciao', 'nasconditi')) doAction('leave')
    else if (has('balla', 'ballo', 'musica')) doAction('dance')
    else if (has('salta')) doAction('jump')
    else if (has('dormi', 'buonanotte', 'nanna')) doAction('sleep')
    else if (has('gira', 'piroetta')) doAction('spin')
    else if (has('ti voglio bene', 'coccol', '❤', '🥰')) doAction('love')
    else if (has('ciao', 'salve', 'buongiorno', 'buonasera')) doAction('wave')
    else if (has('clawd', 'vieni', 'dove sei')) doAction('come')
    else if (visible && !busy && Math.random() < 0.5) doAction('look')
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (visible && !busy && Math.random() < 0.5) play([{ action: 'jump', say: pick(PHRASES.done), ms: 1900 }])
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const s = await read($, scene)
    if (e.props.hasSurvey || s.action === 'hidden') return next(e)
    const { Box, Text, Button } = $.ui.resolve(e)
    const buttons = [
      <Button key="clawd-tap" label="👆 Tocca" onPress={() => tap()} />,
      <Button key="clawd-love" label="❤️ Coccole" onPress={() => doAction('love')} />,
      <Button
        key="clawd-bye"
        label="Vai via"
        onPress={() => {
          sulkUntil = Date.now() + 60000
          doAction('leave')
        }}
      />,
    ]
    if (e.surface === 'terminal') {
      return (
        <Box flexDirection="row" gap={1}>
          <Text color="#d97757">▟█▙ Clawd</Text>
          <Text>{s.say || '…'}</Text>
          {buttons}
        </Box>
      )
    }
    const { Svg } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Svg source={stage(s)} alt={`Clawd, la mascotte: ${s.action}`} isInteractive={true} />
        <Box flexDirection="row" gap={1}>
          <Text bold color="#d97757">Clawd</Text>
          <Text>{s.say || ' '}</Text>
        </Box>
        <Box flexDirection="row" gap={1}>{buttons}</Box>
      </Box>
    )
  })
}
