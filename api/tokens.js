const _ = require('lodash');
const utils = require('../utils');
const { setData, getData } = require('../utils/redis');

const tokens = {};

const getToken = async (code) => {
    let token = tokens[code];
    if (!token && utils.getOptions().useRedis) {
        console.log('getting token from redis', code);
        const tokenData = await getData('token', code);
        if (tokenData) {
            token = tokenData;
            _.set(tokens, code, token);
        }
    }
    return token;
};

const addToken = async (key, user, scope, audience) => {
    const options = utils.getOptions();
    const access_token = utils.generateJWT({}, options.keys.privateKey, audience);
    const id_token = utils.generateJWT(user, options.keys.privateKey, audience);
    const token = {
        access_token,
        id_token,
        scope,
        expires_in: 86400,
        token_type: 'Bearer',
    };
    await setToken(key, token);
};

const setToken = async (key, token) => {
    _.set(tokens, key, token);
    if (utils.getOptions().useRedis) {
        console.log('setting token in redis', key, token);
        await setData('token', key, JSON.stringify(token));
    }
};

const removeToken = (key) => {
    delete _.unset(tokens, key);
    if (utils.getOptions().useRedis) {
        deleteKey('token', key);
    }
};

module.exports = { getToken, addToken, removeToken };
