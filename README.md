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
  This option can be used to provide private key string or private key file path or name of environment variable for JWT token private key, in absence of this a key pair will be generated on server start 
- `publicKey or -pubk: ` -
  This option can be used to provide public key string or public key file path or name of environment variable for JWT token public key, in absence of public key it will be picked from private key provided
- `idField or id: (default: sub)`-
  This is where you can pass what will be id field for user, the value passed in login or key in users file will use this field
- `connKey or conn: (default: connection)`-
  Which query parameter is used for different connections to differentiate users in the provided json
- `user or u:`-
  File path for user json this is optional. The user JSON can be in two formats
  1 - Single user store
  In this case the user object will have idField value as key and each key will keep the user object, this user object will be directly used in JWT. The sample is 
  ```json
  {
    "users": {
        "653921efa9576db066b69787": {
            "name": "dev",
            "email": "dev@rldatix.com",
            "title": "Developer"
        }
    }
  }
  ```
  2 - Multiple user store (differentiated base on connKey)
  For multiple user store each connection (`connKey`) have its user and will be picked up based on the query parameter `connKey`. The sample is 
  ```json
  {
    "test-aldo-connection": {
        "653921efa9576db066b69787": {
            "name": "dev",
            "email": "dev@rldatix.com",
            "title": "Developer"
        }
    },
    "Username-Password-Authentication": {
        "60dc8f83dfa3f700740da6a9": {
            "name": "dev",
            "email": "dev.demo@rldatix.com",
            "title": "Developer for Demo"
        }
    }
  }
  ```
- `redis or ur or useRedis: (default false)`-
If you want to run multiple server behind load balancer (or multiple pods in Kubernetes) use this option to keep token information in one shared Redis server. Redis information can be provided with environment variables `REDIS_HOST` and `REDIS_PORT`.
# If you want to contribute 
Coming soon
