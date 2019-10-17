var https = require('https');
var httpProxy = require('http-proxy');
var express = require('express');
var HttpProxyRules = require('http-proxy-rules'); // TODO: just do this manually instead of using this package (since it doesn't support matching sub-domains). Maybe look for different package that does support sub-domain matching (subdomain-router is close, but doesn't support different hosts and maybe not modifying response headers)

var proxyRules = new HttpProxyRules({
    rules: {
        '.*/minecraft.*': 'https://localhost:3052',
        '.*/lexie.*': 'https://localhost:3050',
        '.*/react-practice.*': 'https://localhost:3055'
    },
    default: 'https://localhost:8080'
});
var proxy = httpProxy.createProxy();

var bodyParser = require('body-parser');
var app = express();
app.set('trust proxy', true);
app.use(function(req,res,next){
    try{
        var target = proxyRules.match(req);
        if (target) {
            console.log("TARGET", target, req.url);
            return proxy.web(req, res, {
                target: target
            }, function(e) {
                console.log('PROXY ERR', e, req.ip, '=>', req.hostname, req.originalUrl);
            });
        } else {
            res.sendStatus(404);
        }
    } catch(e) {
        res.sendStatus(500);
    }
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//===============PORT=================
var httpPort = 80;
var httpsPort = process.env.PORT || 443;
//===============SSL=================
var http_server = require('http').createServer();
http_server.on('request', require('redirect-https')({ port: httpsPort }));
http_server.listen(80, function () { console.log(`Listening on port ${httpPort} for http`); });

var fs = require('fs'),
  https = require('https'),
  key = fs.readFileSync(__dirname + '/ssl/key.pem'),
  cert = fs.readFileSync(__dirname + '/ssl/cert.pem');
var mainserver = https.createServer({ key: key, cert: cert }, app).listen(httpsPort);
console.log('Listening on ' + httpsPort + '!');
//mainserver.on('listening', onListening);
mainserver.on('error', function (error, req, res) {
    var json;
    console.log('proxy error', error);
    if (!res.headersSent) {
        res.writeHead(500, { 'content-type': 'application/json' });
    }

    json = { error: 'proxy_error', reason: error.message };
    res.end(JSON.stringify(json));
});
