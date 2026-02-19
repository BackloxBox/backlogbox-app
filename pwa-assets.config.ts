import { defineConfig } from '@vite-pwa/assets-generator/config';

export default defineConfig({
	headLinkOptions: { preset: '2023' },
	preset: {
		transparent: {
			sizes: [64, 192, 512],
			favicons: [[48, 'favicon.ico']],
			padding: 0.05,
			resizeOptions: { background: '#09090b', fit: 'contain' }
		},
		maskable: {
			sizes: [512],
			padding: 0.3,
			resizeOptions: { background: '#09090b', fit: 'contain' }
		},
		apple: {
			sizes: [180],
			padding: 0.3,
			resizeOptions: { background: '#09090b', fit: 'contain' }
		}
	},
	images: ['static/backlogbox-logo-pwa.svg']
});
