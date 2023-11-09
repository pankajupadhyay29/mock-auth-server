# Mock Authentication Server 
This is a mock server implementation for Open ID Connect base authentication. This can be used for testing without impacting the actual IDP server limits and bill.

# How to use
- install the package

  `npm install -g mock-auth-server`

- now you can run the mock server 

  `mock-auth-server`

  Now the mock sever is available on this machine at port 3000 by default you can change the port using `-p` argument, check Available Option section for details.

### Available endpoint
- /authorize
  Authentication dance would start with a request to /authorize endpoint which will check for existing session if `skipLogin` option is not enabled. The already authenticated user will be redirected to value provided in `redirect_uri` with a code (`response_type` field) which can be used to get id token. In case user is not authenticated it will be redirected to login page.
  In case of `skipLogin` enabled a random user will be created and returned the respective code for all unauthenticated requests. 
- /login
  For any get request for login page (redirected via `/authorize`) a html page will be displayed to provide username and password. The user subject can be provided in both username and password (login will fail if both are not matching) and after verification user will be redirected to value provided in `redirect_uri`` with a code (`response_type` field) which can be used to get id token 
- /oauth/token
  This will return a object containing `access_token, id_token, scope, expires_in, token_type` for the user id provided (code in the request body)
- /.well-known/jwks.json
  This is to get public key in JSON Web Key Set format, so that it can be used to verify tokens
- /oidc/logout
  The endpoint to be called on logout for clearing the cookie and existing token, user


# Available Options
- `port or -p: (default:3000)` -
  To specify the port to which mock server will listen
- `skipLogin or -sl (default: false)`
  By default the login page will be shown if no user is authorized yet and you can provide user subject in both username and password (login will fail if both are not matching) but if you want to skip that process and just return a random authorized user use this option
- `sslKey` -
  provide a string to be used as Key for https server, https server will be created only if both key and certificates are provided
- `sslCert` -
  provide a string to be used as Certificate for https server
- `keyFile` -
  provide pat for the Key file to be used for https server
- `certFile` -
  provide pat for Certificate file to be used for https server
- `privateKey or -pvtk: ` -
  This option can be used to provide private key string or private key file path for JWT token private key, in absence of this a key pair will be generated on server start 
- `publicKey or -pubk: ` -
  This option can be used to provide public key string or private key file path for JWT token private key

# If you want to contribute 
Coming soon
