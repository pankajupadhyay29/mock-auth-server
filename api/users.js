const _ = require('lodash');
const { faker } = require('@faker-js/faker');
const { getOptions } = require('../utils');
const { getData, setData, deleteKey } = require('../utils/redis');
const activeUsers = {};

var userStore = null;

const ensureUserDB = () => {
    if (!userStore) {
        const options = getOptions();
        if (options.users) userStore = require(options.users);
    }
}

const getRandomUser = (users, options) => {
    const keys = Object.keys(users);
    const id = keys[_.random(keys.length - 1)];

    return { ...users[id], [options.idField]: id };
}

const getUserFromStore = (id, connection, options) => {
    const users = userStore.users || userStore[connection]
    const user = users[id];
    return !user && options.skipLogin
        ? getRandomUser(users, options)
        : { ...user, [options.idField]: id };
}

const activateUser = async (id, connection = '') => {
    ensureUserDB();
    const options = getOptions();
    const user = options.users
        ? getUserFromStore(id, connection, options)
        : {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            sub: faker.string.uuid(10),
            [options.idField]: id
        };
    const sessionID = faker.string.uuid(10);
    console.log(options.users, user, sessionID);
    await addActiveUser(sessionID, user, options);
    return sessionID;
}

const addActiveUser = async (key, user, options) => {
    _.set(activeUsers, key, user);
    if (options.useRedis) {
        console.log('setting user in redis', key, user);
        await setData('user', key, user);
    }
}

const getUser = async (key) => {
    let user = _.get(activeUsers, key);
    if (!user && getOptions().useRedis) {
        console.log('getting user from redis', key);
        user = await getData('user', key);
        if (user) {
            _.set(activeUsers, key, user);
        }
    }
    return user;
};

const deactivateUser = (key) => {
    delete _.unset(activeUsers, key);
    if (getOptions().useRedis) {
        deleteKey('user', key);
    }
}

module.exports = { activateUser, getUser, deactivateUser };
