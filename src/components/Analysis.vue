<script setup>
import { ref, computed, watch } from 'vue'
import { getMatch, img, levelAt, fmtTime } from '../api'
import { store } from '../store'
import WardMap from './WardMap.vue'

const input = ref(''), match = ref(null), loading = ref(false), err = ref('')
const view = ref('builds'), showObs = ref(true), showSen = ref(true), picked = ref([])

async function load(id) {
  if (!id) return
  loading.value = true; err.value = ''; match.value = null
  try { match.value = await getMatch(id); picked.value = match.value.players.map((_, i) => i) }
  catch (e) { err.value = e.message } finally { loading.value = false }
}
watch(() => store.matchId, (id) => { input.value = id || ''; load(id) }, { immediate: true })

const heroName = (id) => store.heroes[id]?.localized_name || 'Hero ' + id
const parsed = computed(() => match.value?.players?.some((p) => p.purchase_log?.length))
const isRadiant = (p) => p.player_slot < 128

function buildFor(p) {
  const byLevel = {}
  for (const e of p.purchase_log || []) {
    const it = store.items[e.key]
    if (!it || e.key.startsWith('recipe_') || (it.cost || 0) < 500) continue // hide consumables & components
    const lvl = levelAt(p, e.time) ?? '?'
    ;(byLevel[lvl] ||= []).push({ ...it, time: e.time, key: e.key })
  }
  return Object.entries(byLevel).sort((a, b) => a[0] - b[0])
}
const wards = computed(() => {
  if (!match.value) return []
  const out = []
  match.value.players.forEach((p, i) => {
    if (!picked.value.includes(i)) return
    if (showObs.value) (p.obs_log || []).forEach((w) => out.push({ x: w.x, y: w.y, type: 'obs' }))
    if (showSen.value) (p.sen_log || []).forEach((w) => out.push({ x: w.x, y: w.y, type: 'sen' }))
  })
  return out
})
</script>

<template>
  <v-text-field v-model="input" label="Match ID" variant="outlined" density="compact" hide-details style="max-width:420px" class="mb-4"
    append-inner-icon="mdi-magnify" @click:append-inner="store.matchId = input" @keyup.enter="store.matchId = input" />
  <v-progress-linear v-if="loading" indeterminate color="primary" />
  <v-alert v-if="err" type="error">{{ err }}</v-alert>
  <v-card v-if="!match && !loading" border flat class="pa-4 text-medium-emphasis">Pick a match from “Live &amp; recent”, or paste a match ID.</v-card>

  <template v-if="match">
    <div class="d-flex align-center mb-3 ga-4">
      <h2><span class="text-radiant">{{ match.radiant_name || 'Radiant' }}</span> {{ match.radiant_score }} – {{ match.dire_score }} <span class="text-dire">{{ match.dire_name || 'Dire' }}</span></h2>
      <span class="text-medium-emphasis num">{{ fmtTime(match.duration) }}</span>
      <v-btn-toggle v-model="view" mandatory density="compact" color="primary" class="ml-auto">
        <v-btn value="builds">Item builds</v-btn><v-btn value="wards">Wards</v-btn>
      </v-btn-toggle>
    </div>
    <v-alert v-if="!parsed" type="info" density="compact" class="mb-4">This match hasn’t been parsed by OpenDota yet, so item timings and wards are unavailable. Try again later or pick an older match.</v-alert>

    <v-expansion-panels v-if="view === 'builds'" multiple variant="accordion">
      <v-expansion-panel v-for="p in match.players" :key="p.player_slot">
        <v-expansion-panel-title>
          <div class="d-flex align-center ga-3">
            <img class="hero-img" :src="img(store.heroes[p.hero_id]?.img)" />
            <span :class="isRadiant(p) ? 'text-radiant' : 'text-dire'">{{ p.personaname || p.name || 'Anonymous' }}</span>
            <span class="text-medium-emphasis">{{ heroName(p.hero_id) }} · <span class="num">{{ p.kills }}/{{ p.deaths }}/{{ p.assists }}</span></span>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div v-if="!buildFor(p).length" class="text-medium-emphasis">No purchase data.</div>
          <div v-for="[lvl, items] in buildFor(p)" :key="lvl" class="d-flex align-center ga-3 mb-2">
            <v-chip size="small" color="primary" variant="flat" style="min-width:64px;justify-content:center">Lv {{ lvl }}</v-chip>
            <div v-for="it in items" :key="it.key + it.time" class="text-center">
              <img class="item-img" :src="img(it.img)" :title="it.dname" />
              <div class="text-caption num text-medium-emphasis">{{ fmtTime(it.time) }}</div>
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-row v-else>
      <v-col cols="12" md="7"><WardMap :wards="wards" /></v-col>
      <v-col cols="12" md="5">
        <div class="mb-3"><v-checkbox v-model="showObs" label="Observer wards" color="primary" density="compact" hide-details /><v-checkbox v-model="showSen" label="Sentry wards" color="secondary" density="compact" hide-details /></div>
        <v-chip-group v-model="picked" multiple column>
          <v-chip v-for="(p, i) in match.players" :key="i" :value="i" filter size="small" :color="isRadiant(p) ? 'radiant' : 'dire'">{{ heroName(p.hero_id) }} ({{ (p.obs_log || []).length }}/{{ (p.sen_log || []).length }})</v-chip>
        </v-chip-group>
        <div class="text-caption text-medium-emphasis mt-2">Radiant base is bottom-left, Dire top-right. Counts show observers/sentries placed.</div>
      </v-col>
    </v-row>
  </template>
</template>
