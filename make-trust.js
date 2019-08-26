var StellarSdk = require('stellar-sdk');
var express = require('express');
var router = express.Router();
StellarSdk.Network.useTestNetwork();
var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

router.post('/makeTrust',function(request,response,next){

  var sourceKey = "#";

  var investorkey = request.body.investor_key;
  var receivingKeys = StellarSdk.Keypair.fromSecret(investorkey);

  var mkj = new StellarSdk.Asset('L2L', sourceKey);

  server.loadAccount(receivingKeys.publicKey())
    .then(function(receiver) {
      var transaction = new StellarSdk.TransactionBuilder(receiver)
        .addOperation(StellarSdk.Operation.changeTrust({
          asset: mkj,
          //limit: '1000'
        }))
        .build();
      transaction.sign(receivingKeys);
      return server.submitTransaction(transaction);
    })
    .then(function(result) {
      console.log('Success! Results:', result);
      response.contentType('application/json');
      response.end(JSON.stringify("Trust Generated"));
    })
    .catch(function(error) {
      console.error('Error!', error);
      response.contentType('application/json');
      response.end(JSON.stringify("Trust Not Generated"));
    });

});

module.exports = router;
