'use strict';

const {Contract} = require('fabric-contract-api');

class RegistrarContract extends Contract {
	
	constructor() {
		super('regnet.registrar');
	}
	
	// a. Instantiate
	async instantiate(ctx) {
		console.log('Registrar smart contract was successfully deployed.');
	}
	
	// 1. Approve existing user request
	async approveNewUser(ctx, name, ssn) {
		const requestKey = ctx.stub.createCompositeKey('regnet.request', [name, ssn]);
		const userKey = ctx.stub.createCompositeKey('regnet.user', [name, ssn]);
		const requestBuffer = await ctx.stub.getState(requestKey);
		if (requestBuffer) {
			const requestObject = JSON.parse(requestBuffer.toString());
			const userObject = {
				docType: 'user',
				name: name,
				email: requestObject.email,
				phone: requestObject.phone,
				ssn: requestObject.ssn,
				upgradCoins: 0,
				createdAt: ctx.stub.getTxTimestamp()
			}
			const userBuffer = Buffer.from(JSON.stringify(userObject));
			// putState
			await ctx.stub.putState(userKey, userBuffer);
			return userObject;
		} else {
			return 'Invalid query. No matching request found.';
		}
	}
	
	// 2. Get User Asset Details
	async viewUser(ctx, name, ssn) {
		const userKey = ctx.stub.createCompositeKey('regnet.user', [name, ssn]);
		const userBuffer = await ctx.stub.getState(userKey);
		if (userBuffer) {
			return JSON.parse(userBuffer.toString());
		} else {
			return 'Invalid query. No matching user found.';
		}
	}
	
	// 3. Approve existing property registration request
	async approvePropertyRegistration(ctx, propId) {
		const requestKey = ctx.stub.createCompositeKey('regnet.request', [propId]);
		const propertyKey = ctx.stub.createCompositeKey('regnet.property', [propId]);
		const requestBuffer = await ctx.stub.getState(requestKey);
		if (requestBuffer) {
			const requestObject = JSON.parse(requestBuffer.toString());
			const propertyObject = {
				docType: 'property',
				propId: requestObject.propId,
				price: requestObject.price,
				status: requestObject.status,
				owner: requestObject.owner,
				createdAt: ctx.stub.getTxTimestamp()
			}
			const propertyBuffer = Buffer.from(JSON.stringify(propertyObject));
			// putState
			await ctx.stub.putState(propertyKey, propertyBuffer);
			return propertyObject;
		} else {
			return 'Invalid query. No matching request found.';
		}
	}
	
	// 4. Get property asset details from network
	async viewProperty(ctx, propId) {
		const propertyKey = ctx.stub.createCompositeKey('regnet.property', [propId]);
		const propertyBuffer = await ctx.stub.getState(propertyKey);
		if (propertyBuffer) {
			return JSON.parse(propertyBuffer.toString());
		} else {
			return 'Invalid query. No matching property found.';
		}
	}
}

module.exports = RegistrarContract;
