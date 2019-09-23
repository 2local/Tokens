var StellarSdk = require('stellar-sdk');
var express = require('express');
var router = express.Router();
StellarSdk.Network.usePublicNetwork();
var server = new StellarSdk.Server('https://horizon.stellar.org');

router.post('/makeTrust',async function(req,res,next){

  var sourceKey = "x"; //owner public key
  
	var ResponseCode = 200;
	var ResponseMessage = ``;
	var ResponseData = null;
	try {
		if(req.body) {
			var ValidationCheck = true;
			if (!req.body.investor_key) {
				ResponseMessage = "Investor key is missing \n";
				ValidationCheck = false;
			}
			
			if(ValidationCheck == true) {
				// account which is making trust with the token
				var investorkey = req.body.investor_key;//investor private key
				var receivingKeys = StellarSdk.Keypair.fromSecret(investorkey);

				var mkj = new StellarSdk.Asset('L2L', sourceKey);

				  // change trust and submit transaction
				await server.loadAccount(receivingKeys.publicKey())
					.then(function(receiver) {
						
					  var transaction = new StellarSdk.TransactionBuilder(receiver)
						.addOperation(StellarSdk.Operation.changeTrust({
						  asset: mkj,
						}))
						.build();
					  transaction.sign(receivingKeys);
					  return server.submitTransaction(transaction);
					})
					.then(function(result) {
						ResponseMessage = "Completed";
						ResponseCode = 200;
						ResponseData = "Trust Generated";
						//console.log('Success! Results:', result);
					})
					.catch(function(error) {
						ResponseMessage = `Trust Not Generated with the error ${error}`;
						ResponseCode = 400;
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
