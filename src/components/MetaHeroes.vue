<script setup>
import { computed, ref } from 'vue'
import { store } from '../store'
import { img } from '../api'

const search = ref('')
const matches = computed(() => store.heroList.reduce((s, h) => s + (h.pro_pick || 0), 0) / 10)
const rows = computed(() =>
  store.heroList.map((h) => ({
    ...h,
    pickRate: matches.value ? (h.pro_pick / matches.value) * 100 : 0,
    banRate: matches.value ? (h.pro_ban / matches.value) * 100 : 0,
    winRate: h.pro_pick ? (h.pro_win / h.pro_pick) * 100 : 0,
    presence: matches.value ? ((h.pro_pick + h.pro_ban) / matches.value) * 100 : 0
  })).sort((a, b) => b.pro_pick - a.pro_pick)
)
const top = computed(() => rows.value[0])
const metaIds = computed(() => new Set(rows.value.slice().sort((a, b) => b.presence - a.presence).slice(0, 12).map((h) => h.id)))
const mostBanned = computed(() => rows.value.slice().sort((a, b) => b.pro_ban - a.pro_ban)[0])
const bestWin = computed(() => rows.value.filter((h) => h.pro_pick >= 20).sort((a, b) => b.winRate - a.winRate)[0])
const headers = [
  { title: 'Hero', key: 'localized_name' },
  { title: 'Picks', key: 'pro_pick', align: 'end' },
  { title: 'Pick %', key: 'pickRate', align: 'end' },
  { title: 'Bans', key: 'pro_ban', align: 'end' },
  { title: 'Ban %', key: 'banRate', align: 'end' },
  { title: 'Win %', key: 'winRate', align: 'end' },
  { title: 'Status', key: 'presence', align: 'end' }
]
</script>

<template>
  <v-row v-if="top" class="mb-2">
    <v-col v-for="c in [
      { label: 'Most picked', h: top, v: top.pro_pick + ' picks · ' + top.pickRate.toFixed(1) + '% of matches' },
      { label: 'Most banned', h: mostBanned, v: mostBanned.pro_ban + ' bans' },
      { label: 'Highest win rate (20+ picks)', h: bestWin, v: bestWin.winRate.toFixed(1) + '% over ' + bestWin.pro_pick + ' picks' }
    ]" :key="c.label" cols="12" md="4">
      <v-card border flat>
        <v-card-text class="d-flex align-center ga-4">
          <img :src="img(c.h.img)" width="118" height="66" style="border-radius:4px" />
          <div>
            <div class="text-caption text-medium-emphasis">{{ c.label }}</div>
            <div class="display text-h5">{{ c.h.localized_name }}</div>
            <div class="text-body-2 num">{{ c.v }}</div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-card border flat>
    <v-card-title class="d-flex align-center">
      <span class="display">Hero pool across ~{{ Math.round(matches).toLocaleString() }} pro matches</span>
      <v-spacer />
      <v-text-field v-model="search" density="compact" hide-details variant="outlined" label="Filter heroes" prepend-inner-icon="mdi-magnify" style="max-width:260px" />
    </v-card-title>
    <v-data-table :headers="headers" :items="rows" :search="search" :items-per-page="25" density="comfortable" :sort-by="[{ key: 'pro_pick', order: 'desc' }]">
      <template #item.localized_name="{ item }">
        <div class="d-flex align-center ga-3 py-1"><img class="hero-img" :src="img(item.img)" />{{ item.localized_name }}</div>
      </template>
      <template #item.pickRate="{ item }"><span class="num">{{ item.pickRate.toFixed(1) }}%</span></template>
      <template #item.banRate="{ item }"><span class="num">{{ item.banRate.toFixed(1) }}%</span></template>
      <template #item.winRate="{ item }">
        <span class="num" :class="item.winRate >= 52 ? 'text-radiant' : item.winRate < 48 && item.pro_pick ? 'text-dire' : ''">{{ item.winRate.toFixed(1) }}%</span>
      </template>
      <template #item.presence="{ item }">
        <v-chip v-if="metaIds.has(item.id)" size="small" color="primary" variant="flat">Meta</v-chip>
      </template>
    </v-data-table>
  </v-card>
</template>
