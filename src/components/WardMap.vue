<script setup>
import { ref, watch, onMounted } from 'vue'
const props = defineProps({ wards: { type: Array, default: () => [] } })
const cv = ref(null)
const S = 560
function draw() {
  const c = cv.value; if (!c) return
  const g = c.getContext('2d')
  const grad = g.createLinearGradient(0, S, S, 0)
  grad.addColorStop(0, '#1f3a22'); grad.addColorStop(0.45, '#1c2a2e'); grad.addColorStop(0.55, '#1c2a2e'); grad.addColorStop(1, '#3d211d')
  g.fillStyle = grad; g.fillRect(0, 0, S, S)
  g.strokeStyle = '#ffffff10'; g.lineWidth = 1
  for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo((i * S) / 8, 0); g.lineTo((i * S) / 8, S); g.moveTo(0, (i * S) / 8); g.lineTo(S, (i * S) / 8); g.stroke() }
  g.strokeStyle = '#5fa8b855'; g.lineWidth = 26; g.beginPath(); g.moveTo(0, 0); g.lineTo(S, S); g.stroke() // river
  for (const w of props.wards) {
    const x = Math.min(Math.max((w.x - 64) / 128, 0), 1) * S
    const y = (1 - Math.min(Math.max((w.y - 64) / 128, 0), 1)) * S
    g.beginPath(); g.arc(x, y, 14, 0, 7)
    g.fillStyle = (w.type === 'obs' ? '#f2c14e' : '#4fc3f7') + '33'; g.fill()
    g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fillStyle = w.type === 'obs' ? '#f2c14e' : '#4fc3f7'; g.fill()
  }
}
onMounted(draw)
watch(() => props.wards, draw, { deep: true })
</script>
<template><canvas ref="cv" :width="S" :height="S" style="width:100%;max-width:640px;border-radius:6px;border:1px solid #ffffff1a" /></template>
