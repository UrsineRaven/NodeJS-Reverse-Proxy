var packageInfo = require('./package.json');
var https = require('https');
var httpProxy = require('http-proxy');
var express = require('express');
var jsyaml = require('js-yaml');
var fs = require('fs');
var debug = require('debug')(packageInfo.name);

debug("starting %s",packageInfo.name);
var config = jsyaml.safeLoad(fs.readFileSync(__dirname + '/config.yml', 'utf8'));

var proxy = httpProxy.createProxy();

var app = express();
app.set('trust proxy', true);
app.set('subdomain offset', (config && config.subdomainOffset) || 2);
app.use(function(req,res,next){
    try{
        debug("subdomain array: %o",req.subdomains);
        var subdomains = req.subdomains.slice();
        var target = config && config.proxyRules;
        while (subdomains.length > 0 && typeof target !== 'string') {
            var sd = subdomains.shift();
            target = target && target[sd];
        }
        debug("intermediate calculated target: %o",target);
        if (typeof target === 'object') {
            target = target[null];
        }
        debug("final calculated target: %o",target);
        if (typeof target === 'string') {
            debug("proxying %o to %o",req.url,target);
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
http_server.listen(80, function () { console.log(`Listening on port ${httpPort} for redirect to HTTPS.`); });
//===============HTTPS=================
var https = require('https'),
  key = fs.readFileSync(__dirname + '/ssl/key.pem'),
  cert = fs.readFileSync(__dirname + '/ssl/cert.pem');
var mainserver = https.createServer({ key: key, cert: cert }, app).listen(httpsPort, function () { console.log('Listening on ' + httpsPort + '!'); });

