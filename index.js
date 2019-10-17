var https = require('https');
var httpProxy = require('http-proxy');
var express = require('express');
var jsyaml = require('js-yaml');
var fs = require('fs');

var config = jsyaml.safeLoad(fs.readFileSync(__dirname + '/config.yml', 'utf8'));

var proxy = httpProxy.createProxy();

var app = express();
app.set('trust proxy', true);
app.set('subdomain offset', (config && config.subdomainOffset) || 2);
app.use(function(req,res,next){
    try{
        console.dir(req.subdomains);
        var subdomains = req.subdomains.slice();
        var target = config && config.proxyRules;
        while (subdomains.length > 0 && typeof target !== 'string') {
            var sd = subdomains.shift();
            target = target && target[sd];
        }
        console.dir(target);
        if (typeof target === 'object') {
            target = target[null];
        }
        console.dir(target);
        if (typeof target === 'string') {
            //console.log("TARGET", target, req.url);
            return proxy.web(req, res, {
                target: target
            }, function(e) {
                //console.log('PROXY ERR', e, req.ip, '=>', req.hostname, req.originalUrl);
            });
        } else {
            res.sendStatus(404);
        }
    } catch(e) {
        res.sendStatus(500);
    }
});

//===============PORTS=================
var httpPort = 80;
var httpsPort = 443;
//===============HTTP=================
var http_server = require('http').createServer();
http_server.on('request', require('redirect-https')({ port: httpsPort }));
http_server.listen(80, function () { console.log(`Listening on port ${httpPort} for redirect to HTTPS.`); });
//===============HTTPS=================
var https = require('https'),
  key = fs.readFileSync(__dirname + '/ssl/key.pem'),
  cert = fs.readFileSync(__dirname + '/ssl/cert.pem');
var mainserver = https.createServer({ key: key, cert: cert }, app).listen(httpsPort, function () { console.log('Listening on ' + httpsPort + '!'); });

