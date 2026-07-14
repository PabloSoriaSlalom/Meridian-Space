import './assets/main.css'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import App from './App.vue'
import router from './router'

const vuetify = createVuetify({
	theme: {
		defaultTheme: 'operationsDark',
		themes: {
			operationsDark: {
				dark: true,
				colors: {
					background: '#070f1f',
					surface: '#111c31',
					'primary': '#5f87ff',
					'secondary': '#2e3f62',
					'success': '#37b57f',
					'warning': '#f1b05a',
					'error': '#db5f6b',
					'info': '#67a7ff',
				},
			},
		},
	},
	icons: {
		defaultSet: 'mdi',
		aliases,
		sets: {
			mdi,
		},
	},
})

const app = createApp(App)

app.use(router)
app.use(vuetify)

app.mount('#app')
