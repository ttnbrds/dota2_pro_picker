<script setup>
import { reactive, ref, computed } from 'vue'
import { store } from '../store'
import { img, getMatchups } from '../api'

const MIN_GAMES = 50 // ignore matchups with too small a sample
const teams = reactive({ radiant: [], dire: [] })
const target = ref('radiant'), search = ref(''), loading = ref(0), err = ref('')
const matchups = reactive({})

async function ensure(id) {
  if (matchups[id]) return
  loading.value++
  try { matchups[id] = await getMatchups(id) } catch (e) { err.value = e.message } finally { loading.value-- }
}
const taken = computed(() => new Set([...teams.radiant, ...teams.dire]))
function add(team, id) {
  if (taken.value.has(id) || teams[team].length >= 5) return
  teams[team].push(id); ensure(id)
}
const remove = (team, id) => (teams[team] = teams[team].filter((x) => x !== id))
const clear = () => { teams.radiant = []; teams.dire = [] }
function onDrop(e, team) { const id = Number(e.dataTransfer.getData('text/plain')); if (id) add(team, id) }
const onDrag = (e, id) => e.dataTransfer.setData('text/plain', String(id))

const pool = computed(() =>
  store.heroList.filter((h) => h.localized_name.toLowerCase().includes(search.value.toLowerCase()))
    .sort((a, b) => a.localized_name.localeCompare(b.localized_name))
)
const name = (id) => store.heroes[id]?.localized_name || id

// Best heroes for `side` = highest average win rate against the enemy picks
function suggest(side) {
  const enemies = side === 'radiant' ? teams.dire : teams.radiant
  if (!enemies.length || enemies.some((e) => !matchups[e])) return []
  const rows = []
  for (const h of store.heroList) {
    if (taken.value.has(h.id)) continue
    const vs = []
    for (const e of enemies) {
      const m = matchups[e].find((x) => x.hero_id === h.id)
      if (m && m.games_played >= MIN_GAMES) vs.push({ enemy: e, wr: (1 - m.wins / m.games_played) * 100, games: m.games_played })
    }
    if (!vs.length) continue
    rows.push({ hero: h, wr: vs.reduce((s, v) => s + v.wr, 0) / vs.length, games: vs.reduce((s, v) => s + v.games, 0), vs })
  }
  return rows.sort((a, b) => b.wr - a.wr).slice(0, 10)
}
const results = computed(() => ({ radiant: suggest('radiant'), dire: suggest('dire') }))
</script>

<template>
  <div class="d-flex align-center ga-3 mb-3 flex-wrap">
    <h2>Counter picker</h2>
    <v-spacer />
    <span class="text-caption text-medium-emphasis">Drag a hero onto a team, or click it to add to</span>
    <v-btn-toggle v-model="target" mandatory density="compact">
      <v-btn value="radiant" color="radiant">Radiant</v-btn><v-btn value="dire" color="dire">Dire</v-btn>
    </v-btn-toggle>
    <v-btn variant="text" @click="clear">Clear</v-btn>
  </div>
  <v-alert v-if="err" type="warning" density="compact" class="mb-3">{{ err }}</v-alert>

  <v-row>
    <v-col v-for="team in ['radiant', 'dire']" :key="team" cols="12" md="6">
      <v-card border flat @dragover.prevent @drop.prevent="onDrop($event, team)" :style="{ borderColor: team === 'radiant' ? '#7bc74d66' : '#e0533d66' }">
        <v-card-title :class="team === 'radiant' ? 'text-radiant' : 'text-dire'" class="display">{{ team === 'radiant' ? 'Radiant' : 'Dire' }} <span class="text-caption text-medium-emphasis">{{ teams[team].length }}/5</span></v-card-title>
        <v-card-text class="d-flex ga-2">
          <div v-for="i in 5" :key="i" class="slot" :title="teams[team][i - 1] ? 'Click to remove' : ''"
               @click="teams[team][i - 1] && remove(team, teams[team][i - 1])">
            <template v-if="teams[team][i - 1]">
              <img :src="img(store.heroes[teams[team][i - 1]].img)" />
              <div class="text-caption text-truncate">{{ name(teams[team][i - 1]) }}</div>
            </template>
            <v-icon v-else icon="mdi-plus" class="text-medium-emphasis" />
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-progress-linear v-if="loading" indeterminate color="primary" class="my-2" />

  <v-row class="mt-1">
    <v-col v-for="team in ['radiant', 'dire']" :key="team" cols="12" md="6">
      <v-card border flat>
        <v-card-title class="display text-h6">Best picks for <span :class="team === 'radiant' ? 'text-radiant' : 'text-dire'">{{ team === 'radiant' ? 'Radiant' : 'Dire' }}</span></v-card-title>
        <v-card-text v-if="!results[team].length" class="text-medium-emphasis">
          Pick at least one {{ team === 'radiant' ? 'Dire' : 'Radiant' }} hero to see counters.
        </v-card-text>
        <v-table v-else density="comfortable">
          <thead><tr><th>Hero</th><th class="text-end">Win rate</th><th>Versus</th></tr></thead>
          <tbody>
            <tr v-for="r in results[team]" :key="r.hero.id" style="cursor:pointer" @click="add(team, r.hero.id)">
              <td><div class="d-flex align-center ga-3 py-1"><img class="hero-img" :src="img(r.hero.img)" />{{ r.hero.localized_name }}</div></td>
              <td class="text-end num" :class="r.wr >= 52 ? 'text-radiant' : ''" :title="r.games.toLocaleString() + ' games'">{{ r.wr.toFixed(1) }}%</td>
              <td>
                <v-chip v-for="v in r.vs" :key="v.enemy" size="x-small" class="mr-1" variant="tonal">{{ name(v.enemy) }} {{ v.wr.toFixed(0) }}%</v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </v-col>
  </v-row>
  <div class="text-caption text-medium-emphasis mt-2">Win rate is the average of each candidate’s win rate against the enemy picks, from OpenDota’s hero matchup data (matchups under {{ MIN_GAMES }} games ignored). Click a suggestion to add it.</div>

  <v-card border flat class="mt-4">
    <v-card-title class="d-flex align-center">
      <span class="display text-h6">Heroes</span><v-spacer />
      <v-text-field v-model="search" density="compact" hide-details variant="outlined" label="Search" prepend-inner-icon="mdi-magnify" style="max-width:240px" />
    </v-card-title>
    <v-card-text class="d-flex flex-wrap ga-1">
      <img v-for="h in pool" :key="h.id" :src="img(h.img)" :title="h.localized_name" class="pool-hero" :class="{ off: taken.has(h.id) }"
           draggable="true" @dragstart="onDrag($event, h.id)" @click="add(target, h.id)" />
    </v-card-text>
  </v-card>
</template>

<style scoped>
.slot { width: 96px; height: 78px; border: 1px dashed #ffffff33; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; }
.slot img { width: 88px; height: 50px; object-fit: cover; border-radius: 3px; }
.pool-hero { width: 64px; height: 36px; object-fit: cover; border-radius: 3px; cursor: grab; }
.pool-hero.off { opacity: .25; pointer-events: none; }
</style>
