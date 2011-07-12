xdescribe("Exception Test",function(){
    global.dbfile = __dirname + '/../db/bssim.test.db';
   console.log('Database file:'+global.dbfile);
   var mstore = require('../lib/messageStore');
   
   it('many database operates',function(){
       var n = 0;
       var cb = function(msgs){n++;};
       var c = 2000;
       mstore.saveMessage('a',null,'testst');
       waits(100);
       runs(function(){
       for(var i=0;i<c;i++){
        //  mstore.getSystemMessages('a');
          mstore.getSystemMessages('a',cb);
          // mstore.getUnreadMessages('a',cb);
        
       } 
       });
       waitsFor(function(){return n===c;},1000000);
       runs(function(){
           mstore.db.exec("delete from messages;delete from user_sys_msgs");
       });
       waits(100);
       runs(function(){});


   });
});