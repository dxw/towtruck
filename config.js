export const Config = {
    gitHub: {
        appId: process.env.APP_ID,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        webhookSecret: process.env.WEBHOOK_SECRET,
    },
    env: {
        isCi: !!process.env.CI
    },
    privateKey: Buffer.from(process.env.PRIVATE_KEY, 'base64').toString('ascii'),
    port: process.env.PORT || 3000,
    redirectUrlBase: process.env.REDIRECT_URL_BASE,
    loginMethods: Object.assign(...(process.env.LOGIN_METHODS || "").split(',').map(k => ({ [k]: true })), {}),
    tokenExpiry: process.env.TOKEN_EXPIRY || '24h'
};
