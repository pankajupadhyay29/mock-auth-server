const fs = require('fs');
const crypto = require('crypto');
const pem2jwk = require('pem-jwk').pem2jwk
const jwt = require('jsonwebtoken');

const getJWTKeys = async (privateKey, publicKey) => {
    let effectivePrivateKey = privateKey ? getPEMString(privateKey) : null;
    let effectivePublicKey = publicKey ? getPEMString(publicKey) : null;

    if (effectivePrivateKey === null) {
        const { privateKey, publicKey } = await getKeyPair();
        effectivePrivateKey = privateKey;
        effectivePublicKey = publicKey;
    } else if (effectivePublicKey === null) {
        const privateKey = crypto.createPrivateKey(effectivePrivateKey);
        effectivePublicKey = privateKey.export({ type: 'spki', format: 'pem' });
    }

    return { privateKey: effectivePrivateKey, publicKey: effectivePublicKey }
};

const getPEMString = (key) => {
    if (!key || isValidPEM(key)) return key;

    let effectiveKey = key;
    if (process.env[key]) {
        console.log(`Reading ${key} from environment variable`);
        effectiveKey = process.env[key];
    } else if (fs.existsSync(key)) {
        console.log(`Reading ${key} as file content`);
        effectiveKey = fs.readFileSync(key, 'utf8');
    }
    if (key !== effectiveKey && isValidPEM(effectiveKey)) return effectiveKey;
    console.error(`Invalid PEM string for ${key}`);
    return null;
};

function isValidPEM(pemString) {
    const pemRegex = /^-----BEGIN ([A-Z0-9 ]+)-----\r?\n([\s\S]+?)\r?\n-----END \1-----\r?\n?$/;
    return pemRegex.test(pemString);
}

const getKeyPair = () => {
    return new Promise((resolve, reject) => {
        crypto.generateKeyPair('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
            }
        }, (err, publicKey, privateKey) => {
            if (err) reject(err);
            else resolve({ publicKey, privateKey });
        });
    });
}

const generateJWT = (user, privateKey, audience) => {
    return jwt.sign(
        user,
        privateKey,
        {
            audience,
            issuer: 'MockServer',
            expiresIn: '1d',
            algorithm: 'RS256',
        }
    );
}

function pemToJwk(pem) {
    const jwk = {
        ...pem2jwk(pem),
        alg: 'RS256',
    };
    return jwk;
}

module.exports = { getJWTKeys, getKeyPair, generateJWT, pemToJwk }
