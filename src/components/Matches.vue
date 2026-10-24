<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { getLive, getProMatches, fmtTime } from '../api'
import { store, openMatch } from '../store'

const live = ref([]), recent = ref([]), updated = ref(''), err = ref('')
let t1, t2
async function loadLive() {
  try { live.value = (await getLive()).filter((g) => g.league_id > 0).sort((a, b) => (b.spectators || 0) - (a.spectators || 0)); updated.value = new Date().toLocaleTimeString() } catch (e) { err.value = e.message }
}
async function loadRecent() {
  try { recent.value = (await getProMatches()).slice(0, 40) } catch (e) { err.value = e.message }
}
onMounted(() => { loadLive(); loadRecent(); t1 = setInterval(loadLive, 20000); t2 = setInterval(loadRecent, 60000) })
onBeforeUnmount(() => { clearInterval(t1); clearInterval(t2) })
const heroName = (id) => store.heroes[id]?.localized_name || '?'
const ago = (ts) => { const m = Math.round((Date.now() / 1000 - ts) / 60); return m < 60 ? m + 'm ago' : Math.round(m / 60) + 'h ago' }
</script>

<template>
  <v-alert v-if="err" type="warning" class="mb-4" density="compact">{{ err }}</v-alert>
  <h2 class="mb-2">Live pro games <span class="text-caption text-medium-emphasis">refreshes every 20s · last {{ updated }}</span></h2>
  <v-row class="mb-4">
    <v-col v-if="!live.length" cols="12"><v-card border flat class="pa-4 text-medium-emphasis">No league games live right now.</v-card></v-col>
    <v-col v-for="g in live" :key="g.match_id" cols="12" md="6" lg="4">
      <v-card border flat @click="openMatch(g.match_id)" hover>
        <v-card-text>
          <div class="d-flex align-center">
            <span class="text-radiant display text-h6">{{ g.team_name_radiant || 'Radiant' }}</span>
            <v-spacer /><span class="num display text-h5">{{ g.radiant_score ?? 0 }} : {{ g.dire_score ?? 0 }}</span><v-spacer />
            <span class="text-dire display text-h6">{{ g.team_name_dire || 'Dire' }}</span>
          </div>
          <div class="text-caption text-medium-emphasis mt-1 num">{{ fmtTime(g.game_time || 0) }} · {{ g.spectators ?? 0 }} watching</div>
          <div class="d-flex flex-wrap ga-1 mt-2">
            <v-chip v-for="(p, i) in (g.players || [])" :key="i" size="x-small" :color="p.team === 0 ? 'radiant' : 'dire'" variant="tonal">{{ heroName(p.hero_id) }}</v-chip>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <h2 class="mb-2">Recent pro matches</h2>
  <v-card border flat>
    <v-list lines="one" density="comfortable">
      <v-list-item v-for="m in recent" :key="m.match_id" @click="openMatch(m.match_id)">
        <div class="d-flex align-center ga-3">
          <span :class="m.radiant_win ? 'text-radiant font-weight-bold' : ''" style="min-width:150px">{{ m.radiant_name || 'Radiant' }}</span>
          <span class="num text-medium-emphasis">{{ m.radiant_score }} – {{ m.dire_score }}</span>
          <span :class="!m.radiant_win ? 'text-dire font-weight-bold' : ''" style="min-width:150px">{{ m.dire_name || 'Dire' }}</span>
          <v-spacer />
          <span class="text-caption text-medium-emphasis d-none d-md-inline">{{ m.league_name }}</span>
          <span class="text-caption num">{{ fmtTime(m.duration) }} · {{ ago(m.start_time + m.duration) }}</span>
        </div>
      </v-list-item>
    </v-list>
  </v-card>
</template>
