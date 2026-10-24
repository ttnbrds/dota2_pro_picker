const BASE = 'https://api.opendota.com/api'
const CDN = 'https://cdn.cloudflare.steamstatic.com'
export const img = (p) => (p ? (p.startsWith('http') ? p : CDN + p) : '')

async function get(path) {
  const r = await fetch(BASE + path)
  if (!r.ok) throw new Error(`OpenDota ${r.status} on ${path}`)
  return r.json()
}
export const getHeroStats = () => get('/heroStats')      // pro_pick / pro_win / pro_ban
export const getProMatches = () => get('/proMatches')    // recent pro matches
export const getLive = () => get('/live')                // live games
export const getMatch = (id) => get('/matches/' + id)    // parsed details: purchase_log, obs_log, sen_log
export const getItems = () => get('/constants/items')

// Cumulative XP needed to reach level 1..30 (approximate; used to map purchase time -> hero level)
const XP = [0,240,640,1160,1800,2500,3300,4200,5200,6300,7500,8800,10200,11700,13300,15000,16800,18700,20700,22800,25000,27500,30500,34000,38000,42500,47500,52500,57500,62500]
export function levelAt(player, t) {
  const arr = player.xp_t || []
  if (!arr.length) return null
  const xp = arr[Math.min(Math.max(Math.floor(t / 60), 0), arr.length - 1)]
  let lvl = 1
  for (let i = 0; i < XP.length; i++) if (xp >= XP[i]) lvl = i + 1
  return lvl
}
export const fmtTime = (s) => {
  const sign = s < 0 ? '-' : ''
  s = Math.abs(Math.round(s))
  return `${sign}${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// wins = how often the queried hero beat `hero_id` (public-match sample)
export const getMatchups = (heroId) => get(`/heroes/${heroId}/matchups`)
