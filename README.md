# Spotify Manager Auth API

A simple API to proxy auth requests for the Spotify API.


# Configuration

The following environment variables need to be set

`SPOTIFY_CLIENT_ID` - The client id of your app from the spotify developer dashboard.
`SPOTIFY_CLIENT_SECRET` - The client secret for your app from the spotify developer dashboard
`SPOTIFY_REDIRECT_URL` - The URL to redirect to after successfully authenticating.
`SERVER_PORT` - The port to run the API on. Defaults to 3420.

Depending on what your app does, you may need to change the scopes in `/src/constants.ts`

# Running

Either build the app using `tsc` and run `node dist/index.js` or install `ts-node` globally and run `ts-node src/index.ts` This will start the api on the provided port, or 3420.

If you want to deploy on a web server, you can use Nginx to configure a [reverse proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/) to access the api. A sample server block could be 

```
server {
    server_name your-api.yourdomain.com;

    location / {
            proxy_pass http://localhost:3420;
            proxy_http_version 1.1;
    }

    listen 80;
}
```

# Routes

The API exposes 2 Routes

1. `GET /login/:stateKey`
2. `POST /auth/token`

## GET /login/:stateKey

The state key param should be a random string/UUID. This is can be used to validate the login request matches the auth validation on the client side.

By sending a GET request to /login/:statekey the spotify OAuth login process will kick off. The user will be redirected to the spotify login screen, once they've logged in and confirmed access, the user will be redirected back to the `SPOTIFY_REDIRECT_URL` you provided, with `code` and `state` query params set. The `state` param should match the `:stateKey` param in the get request you made. The `code` will be required to get a bearer auth token to hit the API.

## POST /auth/token

One you have a `code` from the above response (or from a spotify auth redirect in general). You can use this route to get a bearer auth token. The payload of requests to this route should be

```
{
    "code": "CODE_FROM_QUERY_PARAM_HERE"
}
```

If the code is valid, a 200 response with the following response body will be returned

```
{
    "token": "some_random_token"
}
```

You can then use this token to hit the spotify API directly by adding an `Authorization: Bearer {token}` header to the requests.