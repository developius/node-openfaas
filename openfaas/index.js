const path = require('path')
const got = require('got')

class OpenFaaS {
	constructor(gateway) {
		this.gateway = gateway
	}

	invoke(func, data, { isJson = false, isBinaryResponse = false } = {} ) {
		const funcPath = path.join('/function', func)

		const options = {
			method: 'POST',
			json: isJson,
			encoding: (isBinaryResponse ? null : 'utf8')
		}

		if (data) options.data = data

		return got(this.gateway + funcPath, options)
	}

	inspect(func) {
		const funcsPath = path.join('/system/functions')

		const options = {
			method: 'GET',
			json: true
		}

		return new Promise((resolve, reject) => {
			return got(this.gateway + funcsPath, options)
				.then(res => {
					let funcs = res.body
					for (let i = 0; i < funcs.length; i++) {
						if (funcs[i].name == func) return resolve(funcs[i])
					}
				})
				.catch(reject)
		})
	}

	deploy(func, image, { network = 'func_functions' } = {} ) {
		const deployPath = path.join('/system/functions')

		const options = {
			method: 'POST',
			json: true,
			body: {
				service: func,
				image,
				network
			}
		}

		return got(this.gateway + deployPath, options)
	}

	remove(name) {
		const options = {
			method: 'DELETE',
			json: true,
			body: {
				functionName: name
			}
		}

		return got(this.gateway + '/system/functions', options)
	}

	compose(initial, funcs) {
		const functions = funcs.map(func => {
			return data => {
				const options = {
					method: 'POST',
					body: data
				}

				const funcUrl = this.gateway + path.join('/function', func)
				return got(funcUrl, options)
					.then(res => Promise.resolve(res))
					.catch(err => Promise.reject(err))
			}
		})

		return functions.reduce(
			(current, f) => {
				return current.then(x => f(x.body))
			},
			new Promise(resolve => resolve(initial))
		)
	}
}

module.exports = OpenFaaS

