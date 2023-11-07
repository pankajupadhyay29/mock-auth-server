const utils = require('../utils');
const { getToken, addToken } = require('./tokens');
const { createUser, getUser } = require('./users');

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
            redirectAfterLogin(req.query, res, user);
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
        redirectAfterLogin(req.body, res, user);
    } else {
        res.status(401).send('Incorrect credentials');
    }
}

function redirectAfterLogin(data, res, user) {
    const { client_id, redirect_uri, response_type, scope } = data;
    console.log(client_id, redirect_uri, response_type, scope);
    console.log(data.client_id, data.redirect_uri, data.response_type, data.scope);
    res.cookie('mock_auth_session', user.sub, { httpOnly: true, secure: true });
    addToken(user, scope, client_id);
    res.redirect(`${redirect_uri}&${response_type}=${user.sub}`);
}

module.exports = { authorize, token, jwks, login };
//response_type=code&scope=openid%20profile%20email&client_id=34R7E2M4bCYq2wo1ttina0LleWRddaVp&redirect_uri=http://allocateui.test.allocate-dev.co.uk:80/signin-oidc?rld_context=DEV~Optima&nonce=38j_tf6ypV7YXUZjZqxNNfx_IY83o56Bk3GVISLnFck&connection=test-aldo-connection&state=0
