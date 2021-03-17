var packageInfo = require('./package.json');
var debug = require('debug')(packageInfo.name);
var express = require('express');
var fs = require('fs');
var httpProxy = require('http-proxy');
var jsyaml = require('js-yaml');

debug("starting %s",packageInfo.name);
var config = jsyaml.load(fs.readFileSync(__dirname + '/config.yml', 'utf8'));

var proxy = httpProxy.createProxy();

var app = express();
app.set('trust proxy', true);
app.set('subdomain offset', (config && config.subdomainOffset) || 2);
app.use(function(req,res,next){
    try{
        debug("subdomain array: %o",req.subdomains);
        var subdomains = req.subdomains.slice();

        // Prune proxyRules according to the subdomain(s)
        var target = config && config.proxyRules;
        while (subdomains.length > 0 && typeof target !== 'string') {
            var sd = subdomains.shift();
            target = target && target[sd];
        }
        debug("intermediate calculated target: %o",target);

        // If left with an object, then target the empty key ('~' in the config) 
        if (typeof target === 'object') {
            target = target[null];
        }
        debug("final calculated target: %o",target);

        // Proxy the request
        if (typeof target === 'string') {
            debug("proxying %o to %o",req.hostname+req.url,target);
            return proxy.web(req, res, {
                target: target,
                xfwd: true
            }, function(e) {
                console.error('PROXY ERR', e, req.ip, '=>', req.hostname, req.originalUrl);
            });
        } else {
            debug("No target found for %o", req.hostname);
            res.sendStatus(404);
        }
    } catch(e) {
        console.error('APP ERR', e);
        res.sendStatus(500);
    }
});

//===============PORTS=================
var httpPort = 80;
var httpsPort = 443;
//===============HTTP=================
var http_server = require('http').createServer();
http_server.on('request', require('redirect-https')({ port: httpsPort }));
http_server.listen(httpPort, function () { console.log(`Listening on port ${httpPort} for redirect to HTTPS.`); });
//===============HTTPS=================
var https = require('https'),
  key = fs.readFileSync(__dirname + '/ssl/key.pem'),
  cert = fs.readFileSync(__dirname + '/ssl/cert.pem');
var mainserver = https.createServer({ key: key, cert: cert }, app).listen(httpsPort, function () { console.log('Listening on ' + httpsPort + '!'); });
