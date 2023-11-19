const _ = require('lodash');
const { faker } = require('@faker-js/faker');
const { getOptions } = require('../utils');
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


const activateUser = (id, connection) => {
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
    const key = userStore && userStore.users ? user[options.idField] : `${connection}_${user[options.idField]}`;
    console.log(options.users, user, key);
    _.set(activeUsers, key, user);
    return key;
}

const getUser = (key) => {
    return _.get(activeUsers, key);
}

const deactivateUser = (key) => {
    delete _.unset(activeUsers, key);
}

module.exports = { activateUser, getUser, deactivateUser };
