#!/usr/bin/env node
'use strict';
const _ = require('lodash');
const http = require('http');
const https = require('https');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const packageJson = require('./package.json');

const app = express();
const utils = require('./utils');
const { authorize, token, jwks, login, logout } = require('./api/oauth');

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

utils.populateOptions().then(() => {
  const options = utils.getOptions();

  const sslOptions = options.ssl
    ? {
      key: options.sslKey,
      cert: options.sslCert
    }
    : {};

  const createServer = options.ssl
    ? _.curry(https.createServer)(sslOptions)
    : http.createServer;

  const server = createServer(app);

  app.route('/version').get((req, res) =>  {
    res.send(packageJson.version);
  });

  app.route('/authorize').get(authorize);
  app.route('/oauth/token').post(token);
  app.route('/.well-known/jwks.json').get(jwks)
  app.route('/login')
    .get((req, res) => {
      res.sendFile(path.join(__dirname, 'html/Login.html'));
    }).post(login);
  app.route('/oidc/logout').get(logout);

  server.listen(options.port, () => {
    console.info(
      `\n\nServer listen at http://localhost:${options.port
      }\nwith Options\n${utils.getPrintableString(options)}`
    );
  });
})

