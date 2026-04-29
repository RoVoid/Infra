import { defineConfig } from 'vitepress';

export default defineConfig({
    title: '@rovoid/infra',
    description: 'Server infrastructure library: WebSocket, accounts, sessions, config, storage and logging',
    base: '/Infra',

    themeConfig: {
        nav: [
            { text: 'Guide', link: '/guide/getting-started' },
            { text: 'API', link: '/api/web' },
            { text: 'npm', link: 'https://www.npmjs.com/package/@rovoid/infra' },
        ],

        sidebar: [
            {
                text: 'Guide',
                items: [{ text: 'Getting Started', link: '/guide/getting-started' }],
            },
            {
                text: 'API',
                items: [
                    { text: 'Web (WebSocket)', link: '/api/web' },
                    { text: 'Accounts & Sessions', link: '/api/accounts' },
                    { text: 'Config', link: '/api/config' },
                    { text: 'Storage', link: '/api/storage' },
                    { text: 'Logger', link: '/api/logger' },
                ],
            },
        ],

        socialLinks: [{ icon: 'github', link: 'https://github.com/RoVoid/Infra' }],

        search: {
            provider: 'local',
        },

        footer: {
            message: 'Released under the MIT License.',
        },
    },
});
