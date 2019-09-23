var StellarSdk = require('stellar-sdk');
var express = require('express');
var router = express.Router();
StellarSdk.Network.usePublicNetwork();
var server = new StellarSdk.Server('https://horizon.stellar.org');

router.post('/sendToken', async function (req, res, next) {
	
	var ResponseCode = 200;
	var ResponseMessage = ``;
	var ResponseData = null;
	try {
		if(req.body) {
			var ValidationCheck = true;
			if (!req.body.source_keys) {
				ResponseMessage = "Source key is missing \n";
				ValidationCheck = false;
			}
			if (!req.body.issuing_keys) {
				ResponseMessage += "Issuing Key is missing \n";
				ValidationCheck = false;
			}
			if (!req.body.receiving_keys) {
				ResponseMessage += "Receiving Key is missing \n";
				ValidationCheck = false;
			}
			if (!req.body.amount) {
				ResponseMessage += "Amount is missing \n";
				ValidationCheck = false;
			}
			
			if(ValidationCheck == true) {
				
				var sourceKey = req.body.source_keys; //owner public key
				var issuingKeys = StellarSdk.Keypair.fromSecret(req.body.issuing_keys); //distributor private key
				var receivingKeys = req.body.receiving_keys; //investor public key

				var l2l = new StellarSdk.Asset('L2L', sourceKey);

				await server.loadAccount(receivingKeys)
					.then(function(account) {
						var trusted = account.balances.some(function (balance) {
							return balance.asset_code === 'L2L' && balance.asset_issuer === sourceKey;
						});
						if (trusted === true) {
							return server.loadAccount(issuingKeys.publicKey())
								.then(function (issuer) {
									console.log(issuer);
									var transaction = new StellarSdk.TransactionBuilder(issuer)
										.addOperation(StellarSdk.Operation.payment({
											destination: receivingKeys,
											asset: l2l,
											amount: req.body.amount
										}))
										.build();
									transaction.sign(issuingKeys);
									return server.submitTransaction(transaction);
								})
								.then(function (result) {
									ResponseMessage = "Completed";
									ResponseCode = 200;
									ResponseData = result;
								})
								.catch(function (error) {
									ResponseMessage = `Transaction stops with the error ${error}`;
									ResponseCode = 400;
								});
						} else {
							ResponseCode = 205;
							ResponseMessage = 'Not Trusted';
						}
					});

			} else {
				ResponseCode = 206
			}
		} else {
			ResponseMessage = "Transaction cannot proceeds as request body is empty";
			ResponseCode = 204
		}
	} catch (error) {
		ResponseMessage = `Transaction stops with the error ${error}`;
		ResponseCode = 400
	} finally {
		return res.status(200).json({
			code : ResponseCode,
			data : ResponseData,
			msg : ResponseMessage
		});
	}
	
    
});

module.exports = router;
