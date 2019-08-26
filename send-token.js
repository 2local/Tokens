var StellarSdk = require('stellar-sdk');
var express = require('express');
var router = express.Router();
StellarSdk.Network.useTestNetwork();
var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

router.post('/sendToken', function (req, res, next) {
    var sourceKey = req.body.source_keys;
    var issuingKeys = StellarSdk.Keypair.fromSecret(req.body.issuing_keys);
    var receivingKeys = req.body.receiving_keys;

    var l2l = new StellarSdk.Asset('L2L', sourceKey);

    server.loadAccount(receivingKeys)
        .then(function (account) {
            var trusted = account.balances.some(function (balance) {
                console.log(balance);
                return balance.asset_code === 'L2L' && balance.asset_issuer === sourceKey;
            });
            if (trusted === true) {
                console.log('trusted')
                server.loadAccount(issuingKeys.publicKey())
                    .then(function (issuer) {
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
                        console.log('Success! Results:', result);
                        res.send(JSON.stringify(result));
                    })
                    .catch(function (error) {
                        console.error('Error!', error);
                    });
            } else {
                console.log('not trusted')
            }
        });
});

module.exports = router;
