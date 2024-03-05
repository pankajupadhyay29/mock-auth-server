const redis = require('redis');

let client = null;



async function ensureConnection() {
    if (!client) {
        if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
            client = redis.createClient({
                socket: {
                    host: process.env.REDIS_HOST,
                    port: process.env.REDIS_PORT
                },
            });
            await openConnection();
        }
    } else if (!client.isReady) {
        await openConnection();
    }
}

async function openConnection() {
    if (!client.isOpen) await client.connect().catch(console.error);
    await client.ping().then(console.log).catch(console.error);
}

async function setData(store, key, value) {
    await ensureConnection();
    const data = typeof value === 'object' ? JSON.stringify(value) : value;

    await client.set(`${store}_${key}`, data);
    return true;
}

async function getData(store, key) {
    await ensureConnection();
    return client.get(`${store}_${key}`)
        .then((reply) => {
            console.log(`Data retrieved successfully: ${reply}`);
            try {
                return JSON.parse(reply);
            } catch(e) {
                console.error('Error parsing data: ', e.message);
                throw e;
            }
        });
}

async function deleteKey(store, key) {
    await ensureConnection();
    return client.del(`${store}_${key}`);
}

module.exports = {
    setData,
    getData,
    deleteKey,
};
