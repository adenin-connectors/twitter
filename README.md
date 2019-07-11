# twitter-connector

## Getting a client ID and client secret

To use the connector will require creating a Twitter integration, to obtain a client ID and secret.

First head to the [Twitter developer hub](https://developer.twitter.com/), and register for an account if you do not already have one. It requires you to fill out an application with information about the purpose of your integration, which may take several days to be approved.

Once you have an account and are logged in, create an app from the developer home page. You will be required to enter some general information about the integration - the only crucial point to remember is that this connector uses a `client_credentials` authentication grant type, so you can omit entering any return URLs.

You should end up with a screen like this showing your integration, click _Details_:

![twitter-developer-lab](/docs/twitter-developer-lab.png)

In the details view, select _Keys and Tokens_. The _Consumer API Keys_ are what we need, where the key labelled _API Key_ is our Client ID, and the key labelled _API Key (secret)_ is our Client Secret.

![twitter-api-keys](/docs/twitter-api-keys.png)

You then simply need to add the Client ID and Client Secret from above, into those respective fields in the Connector configuration.

In v2, you should create an OAuth2Connector entry for Twitter - adding the client ID and secret from above to the OAuth2Connector entity, but also setting the access token endpoint to:

`https://api.twitter.com/oauth2/token`

You should **leave the access code endpoint blank**, this will indicate to platform that it should attempt to use client authentication instead of regular oauth2.
