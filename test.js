const test = require('tape')
const nock = require('nock')
const OpenFaaS = require('./openfaas')

const GATEWAY = 'http://localhost:8080'

test('Test typeofs', t => {
  t.plan(7)

  t.equals(typeof OpenFaaS, 'function')

  const openfaas = new OpenFaaS(GATEWAY)

  t.is(typeof openfaas, 'object')
  t.is(typeof openfaas.gotOptions, 'object')
  t.is(typeof openfaas.deploy, 'function')
  t.is(typeof openfaas.invoke, 'function')
  t.is(typeof openfaas.compose, 'function')
  t.is(typeof openfaas.remove, 'function')
})

test('Test arguments', t => {
  t.plan(4)

  let openfaas = new OpenFaaS(GATEWAY)
  t.is(openfaas.gateway, GATEWAY)

  openfaas = new OpenFaaS(GATEWAY, {})
  t.is(openfaas.gateway, GATEWAY)

  openfaas = new OpenFaaS({ gateway: GATEWAY })
  t.is(openfaas.gateway, GATEWAY)

  openfaas = new OpenFaaS(GATEWAY, {
    user: 'user',
    pass: 'pass'
  })
  t.is(openfaas.gotOptions.auth, 'user:pass')
})

test('Test buildFunctionPath()', t => {
  const openfaas = new OpenFaaS(GATEWAY)

  const fnPath = openfaas.buildFunctionPath('test-function')

  t.plan(1)

  t.is(fnPath, `${GATEWAY}/function/test-function`)
})

test('Test invoke()', t => {
  nock(GATEWAY)
    .post('/function/test-func').reply(200, { status: 'hello' })

  t.plan(2)
  const openfaas = new OpenFaaS(GATEWAY)

  openfaas.invoke('test-func', JSON.stringify({ data: 'thing' })).then(res => {
    t.is(res.body, '{"status":"hello"}')
    t.is(res.statusCode, 200)
  }).catch(err => {
    throw err
  })
})

test('Test invoke() with binary response', t => {
  nock(GATEWAY)
    .post('/function/test-func', JSON.stringify({ data: 'thing' })).reply(200, { status: 'hello' })

  const openfaas = new OpenFaaS(GATEWAY)

  t.plan(3)

  return openfaas.invoke('test-func', JSON.stringify({ data: 'thing' }), { isBinaryResponse: true }).then(res => {
    t.is(Buffer.isBuffer(res.body), true)
    t.is(res.body.toString(), '{"status":"hello"}')
    t.is(res.statusCode, 200)
  })
})

test('Test list()', t => {
  nock(GATEWAY)
    .get('/system/functions').reply(200, [{
      "name": "func_echoit",
      "image": "functions/alpine:latest@sha256:4145602d726a93ed2b393159bb834342a60dcef775729db14bef631c2e90606f",
      "invocationCount": 0,
      "replicas": 1,
      "envProcess": "cat",
      "labels": {
        "com.docker.stack.image": "functions/alpine:latest",
        "com.docker.stack.namespace": "func"
      }
    }, {
      "name": "func_wordcount",
      "image": "functions/alpine:latest@sha256:4145602d726a93ed2b393159bb834342a60dcef775729db14bef631c2e90606f",
      "invocationCount": 0,
      "replicas": 1,
      "envProcess": "wc",
      "labels": {
        "com.docker.stack.image": "functions/alpine:latest",
        "com.docker.stack.namespace": "func"
      }
    }])

  const openfaas = new OpenFaaS(GATEWAY)

  t.plan(2)

  return openfaas.list().then(res => {
    t.is(res.body.length, 2)
    t.is(res.statusCode, 200)
  })
})

test('Test remove()', t => {
  nock(GATEWAY)
    .delete('/system/functions', { functionName: 'test-func' }).reply(200)

  const openfaas = new OpenFaaS(GATEWAY)

  t.plan(1)

  return openfaas.remove('test-func').then(res => {
    t.is(res.statusCode, 200)
  })
})

test('Test deploy()', t => {
  nock(GATEWAY)
    .post('/system/functions', JSON.stringify({
      service: 'test-func',
      network: 'func_functions',
      image: 'hello-serverless'
    })).reply(200)

  t.plan(1)

  const openfaas = new OpenFaaS(GATEWAY)

  return openfaas.deploy({
    name: 'test-func', network: 'func_functions', image: 'hello-serverless'
  }).then(res => {
    t.is(res.statusCode, 200)
  })
})

test('Test compose()', t => {
  nock(GATEWAY)
    .post('/function/test-func', 'base input').reply(200, 'first response')
    .post('/function/test-func2', 'first response').reply(200, 'second response')
    .post('/function/test-func3', 'second response').reply(200, 'third response')

  t.plan(2)

  const openfaas = new OpenFaaS(GATEWAY)

  openfaas.compose('base input', [ 'test-func', 'test-func2', 'test-func3' ]).then(res => {
    t.is(res.body, 'third response')
    t.is(res.statusCode, 200)
  })
})

test('Test compose() with no input', t => {
  nock(GATEWAY)
    .post('/function/test-func').reply(200, 'first response')
    .post('/function/test-func2', 'first response').reply(200, 'second response')
    .post('/function/test-func3', 'second response').reply(200, 'third response')

  t.plan(2)

  const openfaas = new OpenFaaS(GATEWAY)

  openfaas.compose([ 'test-func', 'test-func2', 'test-func3' ]).then(res => {
    t.is(res.body, 'third response')
    t.is(res.statusCode, 200)
  })
})

test('Test invoke() with basic auth', t => {
  nock(GATEWAY)
    .post('/function/test-func', 'test input')
    .basicAuth({
      user: 'user',
      pass: 'pass'
    })
    .reply(200, 'hi there from basic auth')

  t.plan(2)

  const openfaas = new OpenFaaS(GATEWAY, {
    user: 'user',
    pass: 'pass'
  })

  openfaas.invoke('test-func', 'test input').then(res => {
    t.is(res.body, 'hi there from basic auth')
    t.is(res.statusCode, 200)
  })
})
