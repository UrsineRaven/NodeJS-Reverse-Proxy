# NodeJS-Reverse-Proxy

A reverse proxy written in NodeJS. Currently only supports proxying based on subdomains, but supports multiple levels of subdomains. I plan to eventually make an add-on for Hass.io based on this.

## Installation

1. Install nodejs and npm (or at least have the binaries somewhere)
1. Clone this repository
1. Switch to the folder where this was cloned
1. Run `npm install` (if you only downloaded the binaries, you'll need to add them to your path, at least temporarily)
1. This currently expects that you have SSL certificates for HTTPS (you can do this for free from LetsEncrypt. Be sure that they're wildcard certificates.)
    - Create a folder named `ssl`
    - You need to copy the generated certificates (Windows) or create a symbolic link (preferred so you don't have to re-copy when the certificates are updated, Linux) to the ssl subfolder.
    - The fullchain certificate needs to be named `cert.pem` and the key needs to be named `key.pem`.
1. Modify config.yml to add proxy rules relevant to your setup

## Usage

1. Run `node index.js`
    - This needs to be run with administrator permissions since it's using ports 80 and 443
    - If you're behind a router, you need to port-forward 80 and 443 to the device running this (and add a DHCP reservation for the device, so it always gets the same IP address)
        + At least some routers require port-forwarding to enable NAT-Loopback, so if you're in a situation where you have a router behind another router which is implicitly sending all traffic to the inner router, then you still need to add an explicit port-forward to the inner router from the outer router for this to work when using a dynamic DNS from within the network. Maybe I'm the only one who would run into something so obscure, but maybe I end up helping someone out by mentioning it here. :smile:

## Issues/Suggestions

Report issues or suggestions to the *Issues* tab on the [GitHub page](https://github.com/UrsineRaven/NodeJS-Reverse-Proxy).

## License

I haven't picked one yet, but I provide no warranty, and I'm not liable if you choose to use this and something goes awry. Also, if you use this code for anything, give me credit; Don't just steal it and claim it as your own work.
