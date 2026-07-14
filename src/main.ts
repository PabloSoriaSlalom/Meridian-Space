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
					background: '#10182c',
					surface: '#18213a',
					'primary': '#485696',
					'secondary': '#E7E7E7',
					'success': '#F9C784',
					'warning': '#FC7A1E',
					'error': '#F24C00',
					'info': '#FC7A1E',
					'on-background': '#E7E7E7',
					'on-surface': '#E7E7E7',
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
