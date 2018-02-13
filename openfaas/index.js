const path = require('path')
const got = require('got')

class OpenFaaS {
  constructor(gateway, options) {
    if (options) {
      // they passed two arguments (url, options)
      this.gateway = gateway
    } else if (typeof gateway === 'string') {
      // they passed a single string
      options = {}
      this.gateway = gateway
    } else {
      // they passed a single object
      options = gateway
      this.gateway = options.gateway
    }

    if (!this.gateway) throw new Error('Missing option `gateway`')

    if (options.user) {
      if (!options.pass) throw new Error('Missing option `pass`')
      options.auth = `${options.user}:${options.pass}`
    }

    // save options for got
    this.gotOptions = options
  }

  invoke(fn, data, options) {
    options = options || {}

    // merge our defaults and their passed options
    const gotOptions = { ...this.gotOptions, ...options, method: 'POST' }

    gotOptions.encoding = options.isBinaryResponse ? null : 'utf8'

    if (data) gotOptions.body = data

    return got(this.buildFunctionPath(fn), gotOptions)
  }

  deploy({ name, network, image }, options) {
    const gotOptions = {
      ...this.gotOptions,
      ...(options || {}),
      body: {
        service: name,
        network: network || 'func_functions',
        image
      },
      json: true
    }

    return got.post(this.gateway + '/system/functions', gotOptions)
  }

  list(options) {
    const gotOptions = { ...this.gotOptions, ...(options || {}), json: true }

    return got.get(this.gateway + '/system/functions', gotOptions)
  }

  compose(data, functions, options) {
    // no initial data
    if (!functions) {
      functions = data
      data = undefined
    }

    // build an array of functions to be called with result from previous function
    // [ function1(data), function2(data), ... ]
    const calls = functions.map(f => data => this.invoke(f, data, options || {}))

    return calls.reduce((chain, current) => {
      return chain.then(res => current(res.body))
    }, Promise.resolve({ body: data }))
  }

  remove(fn, options) {
    const gotOptions = {
      ...this.gotOptions,
      ...(options || {}),
      json: true,
      body: { functionName: fn }
    }

    return got.delete(this.gateway + '/system/functions', gotOptions)
  }

  buildFunctionPath(fn) {
    return this.gateway + path.join('/function', fn)
  }
}

module.exports = OpenFaaS
