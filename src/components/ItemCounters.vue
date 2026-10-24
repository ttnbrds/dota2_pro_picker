<script setup>
import { ref, computed } from 'vue'
import { getProMatches, getMatch, img } from '../api'
import { store } from '../store'

const count = ref(10), loading = ref(false), done = ref(0), err = ref(''), tally = ref({}), used = ref(0)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function run() {
  loading.value = true; err.value = ''; done.value = 0; tally.value = {}; used.value = 0
  try {
    const list = (await getProMatches()).slice(0, count.value)
    const t = {}
    for (const m of list) {                      // sequential: stays within OpenDota's free rate limit
      try {
        const d = await getMatch(m.match_id)
        if (d.players?.some((p) => p.purchase_log?.length)) {
          used.value++
          for (const p of d.players) {
            const win = (p.player_slot < 128) === d.radiant_win
            const seen = new Set()
            for (const e of p.purchase_log || []) {
              const it = store.items[e.key]
              if (!it || e.key.startsWith('recipe_') || (it.cost || 0) < 1000 || seen.has(e.key)) continue
              seen.add(e.key)
              const row = (t[e.key] ||= { key: e.key, name: it.dname, img: it.img, cost: it.cost, n: 0, wins: 0 })
              row.n++; if (win) row.wins++
            }
          }
        }
      } catch (e) { err.value = e.message }
      done.value++
      tally.value = { ...t }
      await sleep(1200)
    }
  } catch (e) { err.value = e.message } finally { loading.value = false }
}
const rows = computed(() => Object.values(tally.value).sort((a, b) => b.n - a.n).slice(0, 40))
const headers = [
  { title: 'Item', key: 'name' }, { title: 'Cost', key: 'cost', align: 'end' },
  { title: 'Bought by', key: 'n', align: 'end' }, { title: 'Win %', key: 'wr', align: 'end' }
]
</script>

<template>
  <v-card border flat class="pa-4 mb-4">
    <div class="d-flex align-center ga-4 flex-wrap">
      <v-select v-model="count" :items="[5, 10, 20, 30]" label="Recent pro matches" density="compact" variant="outlined" hide-details style="max-width:200px" />
      <v-btn color="primary" :loading="loading" @click="run">Count items</v-btn>
      <span v-if="done" class="text-medium-emphasis num">{{ done }}/{{ count }} fetched · {{ used }} parsed</span>
    </div>
    <v-progress-linear v-if="loading" :model-value="(done / count) * 100" color="primary" class="mt-3" />
    <div class="text-caption text-medium-emphasis mt-2">Counts players who bought an item costing 1000+ at least once. Only parsed matches are included.</div>
  </v-card>
  <v-alert v-if="err" type="warning" density="compact" class="mb-3">{{ err }}</v-alert>
  <v-card v-if="rows.length" border flat>
    <v-data-table :headers="headers" :items="rows.map((r) => ({ ...r, wr: r.wins / r.n * 100 }))" :items-per-page="20" :sort-by="[{ key: 'n', order: 'desc' }]">
      <template #item.name="{ item }"><div class="d-flex align-center ga-3 py-1"><img class="item-img" :src="img(item.img)" />{{ item.name }}</div></template>
      <template #item.wr="{ item }"><span class="num" :class="item.wr >= 55 ? 'text-radiant' : item.wr < 45 ? 'text-dire' : ''">{{ item.wr.toFixed(0) }}%</span></template>
    </v-data-table>
  </v-card>
</template>
