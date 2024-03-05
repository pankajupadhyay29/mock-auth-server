const utils = require('../utils');
const { getToken, addToken, removeToken } = require('./tokens');
const { getUser, activateUser, deactivateUser } = require('./users');

const authorize = async (req, res) => {
    const options = utils.getOptions();
    const { redirect_uri, response_type, scope, client_id } = req.query;
    if (options.skipLogin || req.cookies.mock_auth_session) {
        const sessionID = !req.cookies.mock_auth_session && options.skipLogin
            ? activateUser('', req.query[options.connectionKey])
            : req.cookies.mock_auth_session;
        const user = await getUser(sessionID)
        if (user) {
            redirectAfterLogin(req.query, req, res, user, sessionID);
            return;
        }
    }
    res.redirect(`/login?protocol=oauth2&redirect_uri=${redirect_uri}&response_type=${response_type}&scope=${scope}&client_id=${client_id}`);
};

const token = async (req, res) => {
    const result = await getToken(req.body.code);
    res.send(result);
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

const login = async (req, res) => {
    const userName = req.body.username;
    const password = req.body.password;
    if (userName === password) {
        const options = utils.getOptions();
        const sessionID = await activateUser(userName, req.query[options.connectionKey]);
        const user = await getUser(sessionID);
        redirectAfterLogin(req.body, req, res, user, sessionID);
    } else {
        res.status(401).send('Incorrect credentials');
    }
}

const logout = async (req, res) => {
    const sessionID = req.cookies.mock_auth_session;
    await deactivateUser(sessionID);
    await removeToken(sessionID);
    setAuthCookie(req, res, '');
    res.send('You are logged out successfully.');
}

async function redirectAfterLogin(data, req, res, user, sessionID) {
    const { client_id, redirect_uri, response_type, scope, connection } = data;
    console.log(client_id, redirect_uri, response_type, scope);
    await addToken(sessionID, user, scope, client_id, connection);
    setAuthCookie(req, res, sessionID);
    res.redirect(`${redirect_uri}&${response_type}=${sessionID}`);
}

function setAuthCookie(req, res, sessionID) {
    const cookieFlags = req.secure ? { SameSite: 'lax', httpOnly: true, secure: true } : { SameSite: 'lax' }
    res.cookie('mock_auth_session', sessionID, cookieFlags);
}

module.exports = { authorize, token, jwks, login, logout };
