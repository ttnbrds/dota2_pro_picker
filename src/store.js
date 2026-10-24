import { reactive } from 'vue'
import { getHeroStats, getItems } from './api'

export const store = reactive({ heroList: [], heroes: {}, items: {}, matchId: null, tab: 'meta', ready: false, error: '' })

export async function init() {
  try {
    const [h, items] = await Promise.all([getHeroStats(), getItems()])
    store.heroList = h
    h.forEach((x) => (store.heroes[x.id] = x))
    store.items = items
    store.ready = true
  } catch (e) { store.error = e.message }
}
export function openMatch(id) { store.matchId = id; store.tab = 'analysis' }
