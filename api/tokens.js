const _ = require('lodash');
const utils = require('../utils');

const tokens = {};

const getToken = (code) => {
    return tokens[code];
};

const addToken = (key, user, scope, audience) => {
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
    _.set(tokens, key, token);
    return token;
}

const removeToken = (key) => {
    return tokens[key];
};

module.exports = { getToken, addToken, removeToken };
