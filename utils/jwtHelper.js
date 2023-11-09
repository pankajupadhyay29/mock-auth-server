const fs = require('fs');
const crypto = require('crypto');
const pem2jwk = require('pem-jwk').pem2jwk
const jwt = require('jsonwebtoken');

const getJWTKeys = async (privateKey, publicKey) => {
    let effectivePrivateKey = getPEMString(privateKey);
    let effectivePublicKey = getPEMString(publicKey);

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
    if (isValidPEM(key)) return key;
    if (fs.existsSync(key)) {
        const fileContent = fs.readFileSync(key, 'utf8');
        if (isValidPEM(fileContent)) return fileContent;
    }
    return null;
};

function isValidPEM(pemString) {
    const pemRegex = /^-----BEGIN [A-Z\s]+-----\r?\n[\/+=a-zA-Z0-9\r\n]*\r?\n-----END [A-Z\s]+-----\r?\n$/;
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
