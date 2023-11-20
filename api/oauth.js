const utils = require('../utils');
const { getToken, addToken, removeToken } = require('./tokens');
const { getUser, activateUser, deactivateUser } = require('./users');

const authorize = (req, res) => {
    const options = utils.getOptions();
    const { redirect_uri, response_type, scope, client_id } = req.query;
    if (options.skipLogin || req.cookies.mock_auth_session) {
        const sessionID = !req.cookies.mock_auth_session && options.skipLogin
            ? activateUser('', req.query[options.connectionKey])
            : req.cookies.mock_auth_session;
        const user = getUser(sessionID)
        if (user) {
            redirectAfterLogin(req.query, req, res, user, sessionID);
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
        const options = utils.getOptions();
        const sessionID = activateUser(userName, req.query[options.connectionKey]);
        const user = getUser(sessionID);
        redirectAfterLogin(req.body, req, res, user, sessionID);
    } else {
        res.status(401).send('Incorrect credentials');
    }
}

const logout = (req, res) => {
    const sessionID = req.cookies.mock_auth_session;
    deactivateUser(sessionID);
    removeToken(sessionID);
    setAuthCookie(req, res, '');
    res.send('You are logged out successfully.');
}

function redirectAfterLogin(data, req, res, user, sessionID) {
    const { client_id, redirect_uri, response_type, scope, connection } = data;
    console.log(client_id, redirect_uri, response_type, scope);
    console.log(data.client_id, data.redirect_uri, data.response_type, data.scope);
    addToken(sessionID, user, scope, client_id, connection);
    setAuthCookie(req, res, sessionID);
    res.redirect(`${redirect_uri}&${response_type}=${sessionID}`);
}

function setAuthCookie(req, res, sessionID) {
    const cookieFlags = req.secure ? { SameSite: 'lax', httpOnly: true, secure: true } : { SameSite: 'lax' }
    res.cookie('mock_auth_session', sessionID, cookieFlags);
}

module.exports = { authorize, token, jwks, login, logout };
