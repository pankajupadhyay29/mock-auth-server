const utils = require('../utils');
const { getToken, addToken, removeToken } = require('./tokens');
const { createUser, getUser, removeUser } = require('./users');

const authorize = (req, res) => {
    const options = utils.getOptions();
    const { redirect_uri, response_type, scope, client_id } = req.query;
    if (options.skipLogin || req.cookies.mock_auth_session) {
        const userID = req.cookies.mock_auth_session;
        const user = userID
            ? getUser(userID)
            : options.skipLogin 
                ? createUser()
                : null;
        if (user) {
            redirectAfterLogin(req.query, req, res, user);
            return;
        }
    }
    res.redirect(`/login?protocol=oauth2&redirect_uri=${redirect_uri}&response_type=${response_type}&scope=${scope}&client_id=${client_id}`);
};

const token = (req, res) => {
    res.send(getToken(req.body.code))
}

const jwks = (req, res) => {
    const options = utils.getOptions();
    res.send(
        {
            'keys': [
                utils.pemToJwk(options.keys.publicKey)
            ]
        }
    );
}

const login = (req, res) => {
    const userName =  req.body.username;
    const password =  req.body.password;
    if (userName === password) {
        const user= createUser(userName);
        console.log(JSON.stringify(req.body));
        redirectAfterLogin(req.body, req, res, user);
    } else {
        res.status(401).send('Incorrect credentials');
    }
}

const logout = (req, res) => {
    const userID = req.cookies.mock_auth_session;
    removeUser(userID);
    removeToken(userID);
    setAuthCookie(req, res, '');
    res.send('You are logged out successfully.');
}

function redirectAfterLogin(data, req, res, user) {
    const { client_id, redirect_uri, response_type, scope } = data;
    console.log(client_id, redirect_uri, response_type, scope);
    console.log(data.client_id, data.redirect_uri, data.response_type, data.scope);
    setAuthCookie(req, res, user.sub);
    addToken(user, scope, client_id);
    res.redirect(`${redirect_uri}&${response_type}=${user.sub}`);
}

module.exports = { authorize, token, jwks, login, logout };

function setAuthCookie(req, res, sessionID) {
    const cookieFlags = req.secure ? { SameSite: 'lax', httpOnly: true, secure: true } : { SameSite: 'lax' }
    res.cookie('mock_auth_session', sessionID, cookieFlags);
}
