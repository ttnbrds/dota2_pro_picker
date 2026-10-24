<script setup>
import { onMounted } from 'vue'
import { store, init } from './store'
import MetaHeroes from './components/MetaHeroes.vue'
import Matches from './components/Matches.vue'
import Analysis from './components/Analysis.vue'
import ItemCounters from './components/ItemCounters.vue'
import CounterPicker from './components/CounterPicker.vue'
onMounted(init)
</script>

<template>
  <v-app>
    <v-app-bar flat color="surface" border="b">
      <v-app-bar-title><span class="display text-h5">Pro Scout</span></v-app-bar-title>
      <template #extension>
        <v-tabs v-model="store.tab" color="primary" align-tabs="start">
          <v-tab value="meta">Meta heroes</v-tab>
          <v-tab value="matches">Live &amp; recent</v-tab>
          <v-tab value="analysis">Match analysis</v-tab>
          <v-tab value="items">Item counters</v-tab>
          <v-tab value="counter">Counter picker</v-tab>
        </v-tabs>
      </template>
    </v-app-bar>
    <v-main>
      <v-container fluid class="pa-4" style="max-width:1400px">
        <v-alert v-if="store.error" type="error" class="mb-4">{{ store.error }} — OpenDota may be rate limiting; wait a minute and reload.</v-alert>
        <v-progress-linear v-if="!store.ready && !store.error" indeterminate color="primary" />
        <v-window v-if="store.ready" v-model="store.tab" :touch="false">
          <v-window-item value="meta"><MetaHeroes /></v-window-item>
          <v-window-item value="matches"><Matches /></v-window-item>
          <v-window-item value="analysis"><Analysis /></v-window-item>
          <v-window-item value="items"><ItemCounters /></v-window-item>
          <v-window-item value="counter"><CounterPicker /></v-window-item>
        </v-window>
      </v-container>
    </v-main>
  </v-app>
</template>
