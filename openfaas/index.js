'use strict';

const deploy = require('./deploy');
const remove = require('./remove');
const invoke = require('./invoke');
const compose = require('./compose');

const OpenFaaS = url => ({
	deploy: deploy(url),
	remove: remove(url),
	invoke: invoke(url),
	compose: compose(url)
});

module.exports = OpenFaaS;

