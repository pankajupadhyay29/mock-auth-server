const utils = require('../utils');
const { getToken, addToken, removeToken } = require('./tokens');
const { getUser, activateUser, deactivateUser } = require('./users');

function validateClientCredentials(client_id, client_secret) {
    const options = utils.getOptions();
    if (!options.clients) return false;
    return (
        Array.isArray(options.clients) &&
        options.clients.some(
            (c) => c.client_id === client_id && c.client_secret === client_secret
        )
    );
}

function getClient(client_id) {
    const options = utils.getOptions();
    if (!options.clients) return null;
    return options.clients.find(c => c.client_id === client_id) || null;
}

async function issueClientCredentialsToken(client_id, scope = "") {
    const options = utils.getOptions();
    const client = getClient(client_id);
    const access_token = utils.generateJWT(client?.data || {}, options.keys.privateKey, client?.aud);
    return {
        access_token,
        token_type: 'Bearer',
        scope,
        expires_in: 86400
    };
}

const authorize = async (req, res) => {
    const options = utils.getOptions();
    const { redirect_uri, response_type, scope, client_id } = req.query;
    const sessionIDInRequest = sessionIDFromRequest(req);
    const connection = req.query[options.connectionKey];
    console.log('Authorize request:', req.query);
    if (options.skipLogin || sessionIDInRequest) {
        const sessionID = !sessionIDInRequest && options.skipLogin
            ? await activateUser('', connection)
            : sessionIDInRequest;
        const user = await getUser(sessionID)
        if (user) {
            redirectAfterLogin(req.query, req, res, user, sessionID);
            return;
        }
    }
    res.redirect(`/login?protocol=oauth2&redirect_uri=${redirect_uri}&response_type=${response_type}&scope=${scope}&client_id=${client_id}&${options.connectionKey}=${connection}`);
};

const token = async (req, res) => {
    // Support for client_credentials grant
    if (req.body.grant_type === 'client_credentials') {
        const { client_id, client_secret, scope = "" } = req.body;
        if (!validateClientCredentials(client_id, client_secret)) {
            res.status(401).json({ error: "invalid_client", error_description: "Client authentication failed" });
            return;
        }
        const token = await issueClientCredentialsToken(client_id, scope);
        res.json(token);
        return;
    }

    // Default: handle authorization_code
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
    const options = utils.getOptions();
    const userName = req.body.username;
    const password = req.body.password;
    const connection = req.query[options.connectionKey] || req.body.connection;
    if (userName === password) {
        const sessionID = await activateUser(userName, connection);
        const user = await getUser(sessionID);
        if(user) redirectAfterLogin(req.body, req, res, user, sessionID);
        else res.status(401).send('User not found');
    } else {
        res.status(401).send('Incorrect credentials');
    }
}

const logout = async (req, res) => {
    const sessionID = sessionIDFromRequest(req);
    await deactivateUser(sessionID);
    await removeToken(sessionID);
    setAuthCookie(req, res, '');
    postLogout(req, res);
}

async function redirectAfterLogin(data, req, res, user, sessionID) {
    const options = utils.getOptions();
    const { client_id, redirect_uri, response_type, scope } = data;
    const connection = data[options.connectionKey];
    console.log(client_id, redirect_uri, response_type, scope);
    await addToken(sessionID, user, scope, client_id, connection);
    setAuthCookie(req, res, sessionID, authCookieName(req, connection));
    res.redirect(`${redirect_uri}&${response_type}=${sessionID}&${options.connectionKey}=${connection}`);
}

async function postLogout(req, res) {
    const redirect_uri = decodeURIComponent(req.query['post_logout_redirect_uri']);
    if (redirect_uri) {
        res.redirect(`${redirect_uri}`);
        return;
    }
    res.send('You are logged out successfully.');
}

function authCookieName(req, connection) {
    const options = utils.getOptions();
    const conn = connection || req.query[options.connectionKey]
    console.log('Connection for auth cookie:', conn, options.connectionKey);
    return `mock_auth_session_${conn}`;
}

function sessionIDFromRequest(req) {
    return req.cookies[authCookieName(req)];
}

function setAuthCookie(req, res, sessionID, cookieName) {
    const cookieFlags = req.secure ? { SameSite: 'lax', httpOnly: true, secure: true } : { SameSite: 'lax' }
    res.cookie(cookieName || authCookieName(req), sessionID, cookieFlags);
}

module.exports = { authorize, token, jwks, login, logout };
