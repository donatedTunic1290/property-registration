'use strict';

const {Contract} = require('fabric-contract-api');

class UserContract extends Contract {
	
	constructor() {
		super('regnet.user');
	}
	
	// a. Instantiate
	async instantiate(ctx) {
		console.log('User smart contract was successfully deployed.');
	}
	// 1. Request New User Account
	async requestNewUser(ctx, name, email, phone, ssn) {
		const requestKey = ctx.stub.createCompositeKey('regnet.request', [name, ssn]);
		const newRequestObject = {
			docType: 'request',
			requestType: 'user',
			name: name,
			email: email,
			phone: phone,
			ssn: ssn,
			createdAt: ctx.stub.getTxTimestamp()
		}
		const requestBuffer = Buffer.from(JSON.stringify(newRequestObject));
		// putState
		await ctx.stub.putState(requestKey, requestBuffer);
		return newRequestObject;
	}
	
	// 2. Recharge a user account with upgradCoins balance
	async rechargeAccount(ctx, name, ssn, bankTxId) {
		const userKey = ctx.stub.createCompositeKey('regnet.user', [name, ssn]);
		let rechargeAmount = 0;
		switch (bankTxId) {
			case 'upg100':
				rechargeAmount = 100;
				break;
			case 'upg500':
				rechargeAmount = 500;
				break;
			case 'upg1000':
				rechargeAmount = 1000;
				break;
			default:
				return 'Invalid Bank Transaction ID';
		}
		try {
			let userBuffer = await ctx.stub.getState(userKey);
			const userObject = JSON.parse(userBuffer.toString());
			userObject.upgradCoins = rechargeAmount;
			userBuffer = Buffer.from(JSON.stringify(userObject));
			// putState
			await ctx.stub.putState(userKey, userBuffer);
			return userObject;
		} catch (e) {
			console.log(e);
			return 'Error processing request. Error: ' + e;
		}
	}
	
	// 3. Get User Asset Details
	async viewUser(ctx, name, ssn) {
		const userKey = ctx.stub.createCompositeKey('regnet.user', [name, ssn]);
		const userBuffer = await ctx.stub.getState(userKey);
		if (userBuffer) {
			return JSON.parse(userBuffer.toString());
		} else {
			return 'Invalid query. No matching user found.';
		}
	}
	
	// 4. Create new property registration request
	async propertyRegistrationRequest(ctx, propId, price, ownerName, ownerSSN) {
		const userKey = ctx.stub.createCompositeKey('regnet.user', [ownerName, ownerSSN]);
		const userBuffer = await ctx.stub.getState(userKey);
		if (userBuffer) {
			const requestKey = ctx.stub.createCompositeKey('regnet.request', [propId]);
			const newRequestObject = {
				docType: 'request',
				requestType: 'property',
				propId: propId,
				owner: userKey,
				price: price,
				status: 'registered',
				createdAt: ctx.stub.getTxTimestamp()
			}
			const requestBuffer = Buffer.from(JSON.stringify(newRequestObject));
			// putState
			await ctx.stub.putState(requestKey, requestBuffer);
			return newRequestObject;
		} else {
			return 'Invalid owner details. No matching user found.';
		}
		
		
	}
	
	// 5. Get property asset details from network
	async viewProperty(ctx, propId) {
		const propertyKey = ctx.stub.createCompositeKey('regnet.property', [propId]);
		const propertyBuffer = await ctx.stub.getState(propertyKey);
		if (propertyBuffer) {
			return JSON.parse(propertyBuffer.toString());
		} else {
			return 'Invalid query. No matching property found.';
		}
	}
	
	// 6. Update property details
	async updateProperty(ctx, propId, status, ownerName, ownerSSN) {
		// Get owner key
		const ownerKey = ctx.stub.createCompositeKey('regnet.user', [ownerName, ownerSSN]);
		// Get property details
		const propertyKey = ctx.stub.createCompositeKey('regnet.property', [propId]);
		const propertyBuffer = await ctx.stub.getState(propertyKey);
		const propertyObject = JSON.parse(propertyBuffer.toString());
		if (ownerKey === propertyObject.owner) {
			propertyObject.status = status;
			const propertyBuffer = Buffer.from(JSON.stringify(propertyObject));
			// putState
			await ctx.stub.putState(propertyKey, propertyBuffer);
			return propertyObject;
		} else {
			return 'Invalid access. Only owners can update property details.';
		}
	}
	
	// 7. Purchase a property from existing buyer
	async purchaseProperty(ctx, propId, name, ssn) {
		let msgSender = ctx.clientIdentity.getID();
		// Get Property details
		const propertyKey = ctx.stub.createCompositeKey('regnet.property', [propId]);
		const propertyBuffer = await ctx.stub.getState(propertyKey);
		const propertyObject = JSON.parse(propertyBuffer.toString());
		// Get Buyer details
		const buyerKey = ctx.stub.createCompositeKey('regnet.user', [name, ssn]);
		const buyerBuffer = await ctx.stub.getState(buyerKey);
		const buyerObject = JSON.parse(buyerBuffer.toString());
		// Get Seller Details
		const sellerKey = ctx.stub.createCompositeKey('regnet.user', [name, ssn]);
		const sellerBuffer = await ctx.stub.getState(buyerKey);
		const sellerObject = JSON.parse(buyerBuffer.toString());
		
		if (propertyObject.status === 'onSale' && buyerObject.upgradCoins >= propertyObject.price) {
			// Make required changes
			buyerObject.upgradCoins -= propertyObject.price;
			sellerObject.upgradCoins += propertyObject.price;
			propertyObject.owner = buyerKey;
			propertyObject.status = 'registered';
			// Commit changes on network
			const buyerBuffer = Buffer.from(JSON.stringify(buyerObject));
			await ctx.stub.putState(buyerKey, buyerBuffer);
			const sellerBuffer = Buffer.from(JSON.stringify(sellerObject));
			await ctx.stub.putState(sellerKey, sellerBuffer);
			const propertyBuffer = Buffer.from(JSON.stringify(propertyObject));
			await ctx.stub.putState(propertyKey, propertyBuffer);
			return propertyObject;
		} else {
			return 'Cannot purchase property. Either property not for sale or balance not enough.';
		}
	}
	
}

module.exports = UserContract;
