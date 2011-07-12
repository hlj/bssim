require('./lib/ext/array');

var flag = process.argv[2];
if (flag && flag === '-d') {
    global.database = '132.239.10.18:27017/bssim_dev';
} else {
    global.database = '132.239.10.18:27017/bssim';
}

var status = require('./lib/status');
var net=require('net');
var MessageHandler = require('./lib/messageHandler').MessageHandler;
var DataParser = require('./lib/dataParser').DataParser;
var Sessions = require('./lib/sessions').Sessions;
var Session = require('./lib/session').Session;
var Users = require('./lib/users').Users;
var User = require('./lib/user').User;
var netHelper = require('./lib/netHelper');

//global object
global.users= new Users();
global.sessions= new Sessions();
global.mh = new MessageHandler(global.users,global.sessions);
//global.logger.setLevel('debug');


var server = net.createServer(function(c){
    c.dataParser = new DataParser();
  //  global.logger.info('new connection:' + c.remoteAddress);
    
    c.on("data",function(data){
        c.pause();
        try {
            c.dataParser.append(data.toString('ascii'));
            var d = c.dataParser.nextData();
            while (d) {
               global.mh.handle(d,c);
               if (c && c.dataParser) {
                  d = c.dataParser.nextData();
               } else {d = null;}
            }
        } catch (err){
            global.logger.error('SYS_ERR:' + err);
        } finally {
            try {
                c.resume();
            } catch(err1){
                global.logger.error("SYS_ERR:" + err1);
            }
        }

  });
  
  c.on('error',function(ex){
      try {
         var u = global.users.findByConn(c);
         if (u) {
             u.conn = null;
         }
         c.end();
         c.destroy();
      } catch (err) {
          global.logger.error('SYS_ERROR_ERROR:' + err);
      }
      global.logger.error('Socket Error:' + ex);
  });
  
  c.on('close',function(){
      try {
         var u = global.users.findByConn(c);
         if (u) {
             u.conn = null;
         }
         c.end();
         c.destroy();
      } catch (err) {
         global.logger.error('SYS_ERR_CLOSE:' +err); 
      }
  });
  
  c.on('end',function(){
      try {
         var u = global.users.findByConn(c);
         if (u) {
             u.conn = null;
         }
         c.end();
         c.destroy();
      } catch (err) {
         global.logger.error('SYS_ERR_END:' +err); 
      }
  });
  
});

process.on('SIGINT', function () {
    if (server) {
        console.log('closing socket...');
        server.close();
        server = null;
    }
    process.exit(0);
});

process.on('SIGTERM', function () {
    if (server) {
        console.log('closing socket...');
        server.close();
        server = null;
    }
    process.exit(0);
});

process.on('exit',function(){
   if (server) {
        console.log('closing socket...');
        server.close();
        server = null;
    }
});

process.on('uncaughtException',function(err){
    console.log('uncaughtException:'+err);
    global.logger.error('uncaughtException:'+err);
    try {
        if (global.messageStore)
         global.messageStore.open();
    } catch(e) {}
});

function printStatus(){
    console.log(status.getStatus());
    setTimeout(arguments.callee,10000);
}


setTimeout(printStatus,10000);

console.log('start services.\n');
server.listen("6676");