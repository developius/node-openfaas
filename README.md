[![XO code
style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
![OpenFaaS](https://img.shields.io/badge/openfaas-serverless-blue.svg)

# Installation

Add `openfaas` via `npm`

```
$ npm i openfaas
```

# Example usage

```javascript
const OpenFaaS = require('openfaas')

const openfaas = new OpenFaaS('http://localhost:8080')
```

## Invoking functions

```js
openfaas
  .invoke('function name', 'input')
  .then(res => console.log(res.body))
  .catch(err => console.log(err))
```

## Deploying functions

```js
openfaas
  .deploy({
    name: 'my-function', // name your function
    network: 'func_functions', // choose your network (default func_functions)
    image: 'hello-serverless' // choose the Docker image
  })
  .then(res => console.log(res))
  .catch(err => console.log(err))
```

## Listing functions

```js
openfaas.list()
  .then(res => console.log(res.body)) // an array of the deployed functions
  .catch(err => console.log(err))
```

## Removing functions

```js
openfaas.remove('my-function')
  .then(res => console.log(res))
  .catch(err => console.log(err))
```

## Composing functions

You have the ability to chain functions which rely on the previous execution's output by using `openfaas.compose()`, like this:

```js
// the input for the first function
const markdown = `
# OpenFaaS chained functions example

[Find out more](https://github.com/openfaas-incubator/node-openfaas)
`

openfaas.compose(markdown, ['func_markdown', 'func_base64']).then(res => {
  console.log(res.body)
})
```

```
PGgxPk9wZW5GYWFTIGNoYWluZWQgZnVuY3Rpb25zIGV4YW1wbGU8L2gxPgoKPHA+PGEgaHJlZj0i
aHR0cHM6Ly9naXRodWIuY29tL29wZW5mYWFzLWluY3ViYXRvci9ub2RlLW9wZW5mYWFzIiByZWw9
Im5vZm9sbG93Ij5GaW5kIG91dCBtb3JlPC9hPjwvcD4KCg==
```

This passes the output from the markdown renderer to the base64 function, and returns the output.

# Configuration

The OpenFaaS class constructor method accepts options in any of the following formats:
```js
const openfaas = new OpenFaaS('http://gateway:8080')
const openfaas = new OpenFaaS('http://gateway:8080', options)
const openfaas = new OpenFaaS(options)
```

`options` is an object with the following properties:
```js
{
  gateway: 'gateway url', // (optional if passed as first parameter to the constructor)
  user: 'basic auth username', // (optional)
  pass: 'basic auth password' // (optional)
}
```

You can also add any of the options `got` supports since we just proxy them through. This includes all the options available through [`http.request`](https://nodejs.org/api/http.html#http_http_request_options_callback). One example of this could be HTTP basic authentication (to set this up on your OpenFaaS cluster check out [the official guides](https://github.com/openfaas/faas/tree/master/guide#a-foreword-on-security)).

```js
const openfaas = new OpenFaaS('http://localhost:8080', {
  user: 'user',
  pass: 'pass'
})
```

All the main methods (`invoke`, `deploy`, `list`, `remove` and `compose`) accept the same extra options parameter as above too.

In addition to this, `invoke` accepts a extra boolean option called `isBinaryResponse`. Setting this parameter to `true` in the options will mark the response as being binary content and will cause `invoke` to resolve to a response object who's body is a buffer.

##### ToDo
* Complete tests
* support additional request options for `got` (**done** - see [!6](https://github.com/openfaas-incubator/node-openfaas/pull/6))
