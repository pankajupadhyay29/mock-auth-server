# Mock Authentication Server 
This is a mock server implementation for Open ID Connect base authentication. This can be used for testing without impacting the actual IDP server limits and bill.

# How to use
- install the package

  `npm install -g mock-auth-server`

- now you can run the mock server 

  `mock-auth-server`

  Now the mock sever is available on this machine at port 3000 by default you can change the port using `-p` argument, check Available Option section for details.

### Available endpoint
- /login 
- /authorize
- /oauth/token
- /.well-known/jwks.json


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

