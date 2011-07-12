var net = require('net');
var DataParser = require('../../lib/dataParser').DataParser;

function Connection(ip){
    var s = new net.Socket();
    if (!ip) ip = null;
    this.remoteAddress = ip;
    this.dataParser = new DataParser();
    this.dataParser.buffer = 'aaa';
}

Connection.prototype = new net.Socket();

Connection.prototype.write = function(str){};

Connection.prototype.end = function(str) {};
     
module.exports = {'Connection':Connection};