import { createApp } from 'vue'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import App from './App.vue'
import './style.css'

const vuetify = createVuetify({
  components, directives,
  theme: {
    defaultTheme: 'scout',
    themes: { scout: { dark: true, colors: {
      background: '#12151a', surface: '#1a1e25', primary: '#d4a24c',
      radiant: '#7bc74d', dire: '#e0533d', secondary: '#5fa8b8'
    } } }
  }
})
createApp(App).use(vuetify).mount('#app')
