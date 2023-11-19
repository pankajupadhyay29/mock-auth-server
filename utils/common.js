const _ = require('lodash');
const fs = require('fs');
const { getJWTKeys } = require('./jwtHelper');
const path = require('path');

var options = {};

const getOptions = () => options;

const _getValueFromString = strVal => {
    try {
        return JSON.parse(strVal);
    } catch {
        return strVal;
    }
};

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

const populateOptions = async () => {
    const args = getArgs(process.argv.slice(2));
    options = {};
    options.port = args.p || args.port || 3000;
    options.skipLogin = args.sl || args.skipLogin || false;
    options.idField = args.id || args.idField || 'sub';
    options.connectionKey = args.conn || args.connKey || 'connection';
    const userFilePath = args.user || args.u;
    if (userFilePath) options.users = path.resolve(userFilePath);
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



module.exports = { getOptions, populateOptions, getPrintableString };
