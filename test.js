const test = require('tape')
const nock = require('nock')
const OpenFaaS = require('./openfaas')

test('Test typeofs', t => {
	t.plan(7)

	t.equals(typeof OpenFaaS, 'function')

	const openfaas = new OpenFaaS('http://localhost:8080')

	t.equals(typeof openfaas, 'object')
	t.equals(typeof openfaas.deploy, 'function')
	t.equals(typeof openfaas.invoke, 'function')
	t.equals(typeof openfaas.compose, 'function')
	t.equals(typeof openfaas.remove, 'function')
	t.equals(typeof openfaas.inspect, 'function')
})

test('Test full API', t => {

	nock('http://localhost:8080')
		.post('/system/functions', {
			service: 'test-func',
			network: 'func_functions',
			image: 'hello-serverless'
		}).reply(200)
		.post('/function/test-func').reply(200, { status: 'done' })
		.post('/function/func_nodeinfo').reply(200, 'hello cruel world')
		.post('/function/func_echoit', 'hello cruel world').reply(200, 'hello cruel world')
		.post('/function/func_wordcount', 'hello cruel world').reply(200, 3)
		.get('/system/functions').reply(200)
		.delete('/system/functions', { functionName: 'test-func' }).reply(200)

	t.plan(4)
	const openfaas = new OpenFaaS('http://localhost:8080')

	openfaas.deploy(
		'test-func',
		'hello-serverless'
	)
		.then(x => t.equals(x.statusCode, 200))
		.then(() => openfaas.invoke('test-func', null, true))
		.then(x => t.equals(x.body, JSON.stringify({ status: 'done' })))
		.then(() => openfaas.compose('', [
			'func_nodeinfo',
			'func_echoit',
			'func_wordcount'
		]))
		.then(x => {
			t.equals(x.statusCode, 200)
			t.equals(x.body, '3')
		})
		.then(() => openfaas.inspect('test-func'))
		.then(x => {
			t.equals(x.statusCode, 200)
			t.equals(x.body, JSON.stringify({
				name: 'test-func',
				image: 'hello-serverless',
				invocationCount: 0,
				replicas: 1,
				envProcess: ''
			}))
		})
		.then(() => openfaas.remove('test-func'))
		.then(x => t.equals(x.statusCode, 200))
		.catch(console.log)
})

