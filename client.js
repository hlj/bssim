var net=require('net');
var netHelper = require('./lib/netHelper');
var MHEAD = require('./lib/messageHeader');

var client = net.createConnection(6676,'127.0.0.0');
client.on('connect',function(){
    //console.log(MHEAD);
    client.write(netHelper.getNetString(MHEAD.SM_LOGIN+'t'));
    setTimeout(function(){
    client.write(netHelper.getNetString(MHEAD.SM_GET_SERVER_STATUS),'ascii');},1000);
});
client.on('data',function(data){
    console.log('get data:');
    console.log(data.toString());
});
client.on('error',function(){
    console.log('error');
});