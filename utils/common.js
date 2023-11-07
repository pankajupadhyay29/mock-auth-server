const _ = require('lodash');
const fs = require('fs');
const crypto = require('crypto');
const pem2jwk = require('pem-jwk').pem2jwk
const jwt = require('jsonwebtoken');

var options = {};

const getOptions = () => options;

const getArgs = args => {
    const myArgs = {};
    for (i = 0; i < args.length; i++) {
        const currentArg = args[i];
        const nextArg = i < args.length - 1 ? args[i + 1] : null;

        if (currentArg.indexOf('-') === 0) {
            const key = _.trimStart(currentArg, '-');
            if (nextArg && nextArg.indexOf('-') !== 0) {
                const value = _getValueFromString(nextArg);
                myArgs[key] = value;
                i++;
            } else {
                myArgs[key] = true;
            }
        }
    }

    return myArgs;
};

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

const getPrintableString = obj => {
    return _(obj)
        .keys()
        .map(key => {
            const item = _.get(obj, key);
            return item
                ? `${key}: ${_.isObjectLike(item) ? getPrintableString(item) : item}`
                : '';
        })
        .compact()
        .join('\r\n')
        .valueOf();
};

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

var options = {};

const populateOptions = async () => {
    const args = getArgs(process.argv.slice(2));
    options = {};
    options.port = args.p || args.port || 3000;
    options.skipLogin = args.sl || args.skipLogin || false;
    options.sslKey = args.sslKey;
    options.sslCert = args.sslCert;
    if (!options.sslKey && !!args.keyFile) {
        options.sslKey = fs.readFileSync(args.keyFile);
        options.sslCert = fs.readFileSync(args.certFile);
    }
    options.keys = await getJWTKeys(args.pvtk || args.privateKey, args.pubk || args.publicKey);
    options.ssl = options.sslKey && options.sslCert;

    return Promise.resolve(options);
}



module.exports = { getOptions, populateOptions, getPrintableString, getKeyPair, generateJWT, pemToJwk };
