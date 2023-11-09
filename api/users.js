const { faker } = require('@faker-js/faker');
const users = {};

const createUser = (sub) => {
    const user = {
        name: faker.person.name,
        email: faker.internet.email,
        sub: sub || faker.string.uuid(10)
    };

    users[user.sub] = user;
    return user;
}

const getUser = (id) => {
    return users[id];
}

const removeUser = (id) => {
    delete users[id];
}

module.exports = { createUser, getUser, removeUser };
