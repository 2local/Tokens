var StellarSdk = require('stellar-sdk');
var express = require('express');
var router = express.Router();
StellarSdk.Network.useTestNetwork();
var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

router.post('/createToken',function(req,res,next){
  console.log("i call",req.body)

   var issuingSecret = req.body.issuingkey;
   var distributingSecret = req.body.distributingkey;
   var totolSupply = req.body.supply;

   var issuingKeys = StellarSdk.Keypair.fromSecret(issuingSecret);
   console.log("issuing secret",issuingSecret);
   var receivingKeys = StellarSdk.Keypair.fromSecret(distributingSecret);
   console.log("distributor secret",receivingKeys);

   var mkj = new StellarSdk.Asset('L2L', issuingKeys.publicKey());
   console.log("owner public",issuingKeys.publicKey())

   server.loadAccount(receivingKeys.publicKey())
     .then(function(receiver) {
       console.log("distributor public key",receivingKeys.publicKey())
       var transaction = new StellarSdk.TransactionBuilder(receiver)
         .addOperation(StellarSdk.Operation.changeTrust({
           asset: mkj,
         }))
         .build();
       transaction.sign(receivingKeys);
       return server.submitTransaction(transaction);
     })

     .then(function() {
       return server.loadAccount(issuingKeys.publicKey())
     })
     .then(function(issuer) {
       var transaction = new StellarSdk.TransactionBuilder(issuer)
         .addOperation(StellarSdk.Operation.payment({
           destination: receivingKeys.publicKey(),
           asset: mkj,
           amount: totolSupply
         }))
         .build();
       transaction.sign(issuingKeys);
       return server.submitTransaction(transaction);
     })
     .then(function(result) {
       console.log('Success! Results:', result);

       res.send({"Result":result});
     })
     .catch(function(error) {
       console.error('Error!', error);
       res.send({"Error":"Try again please"});

     });

});

module.exports = router;
