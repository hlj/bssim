//test offline and system message send & receive
describe('Offline and system message',function(){
   global.database = '132.239.10.18:27017/bssim_test';
   var MHEAD = require('../lib/messageHeader');
   var mstore = require('../lib/messageStore');
   var MessageHandler = require('../lib/messageHandler').MessageHandler;
   var DataParser = require('../lib/dataParser').DataParser;
   var Sessions = require('../lib/sessions').Sessions;
   var Session = require('../lib/session').Session;
   var Users = require('../lib/users').Users;
   var User = require('../lib/user').User;
   var netHelper = require('../lib/netHelper');
   var ConnMock = require('./mock/connection.mock').Connection;
   var net = require('net');


   var mh,dp,sessions,users,sa,sb,ua,ub,uc,ud;
   
   beforeEach(function(){
       mstore.open();
       //console.log('new test....');
       var deleted = false;
       runs(function(){
              mstore.db.collection('messages').drop(function(err,result){
                      deleted= true;
          });          
       });
       waitsFor(function(){return deleted;});
       runs(function() {
       ua = new User('a',new ConnMock('1.1.1.1'));
       ub = new User('b',new ConnMock('1.1.1.2'));
       uc = new User('c');
       ud = new User('d');
       sa = new Session('a');
       sb = new Session('b');
       sa.addUser([ua,uc,ud]);
       sb.addUser([ua,ub,uc]);
       sessions = new Sessions();
       sessions.add([sa,sb]);
       users = new Users();
       users.add([ua,ub,uc,ud]);
       mh = new MessageHandler(users,sessions);
       dp = new DataParser();
       }); //runs
   });
   
   it('should save and get offline user messages',function(){
       var fin = false;
       runs(function(){
          var m = [sa.id,ua.id,'test1'].join('**');
          mh.handle(m,ua.conn);
       });
       waits(200);
       runs(function(){
          var m = [sa.id,ua.id,'::SP::REQUEST_LOGIN'].join('**');
          mh.handle(m,ua.conn);
       });
       waits(200);
       var i = 0;
       runs(function(){
         m =  [sb.id,ua.id,'test2'].join('**');
         mh.handle(m,ua.conn);
         var getCount = function(c) {
           if (c !== 3) {
               mstore.unreadCount(arguments.callee);
           } else {
               i= c;
           }
         };
         mstore.unreadCount(getCount);
       });
       
       waitsFor(function(){return i===3;},'messages less than 2',1000);
       var messages = [];
       runs(function(){
           expect(i).toEqual(3);
           uc.conn = new ConnMock('1.1.1.3');
           uc.send = function(msg){
               console.log('\nGet unread messages:'+msg);
               msg = msg.slice(MHEAD.SM_UNREAD_MSG.length);
               var msgs = msg.split('@@');
               expect(msgs.length).toEqual(2);
               var m1 = msgs[0].split('**');
               expect(isNaN(m1[0])).toBeTruthy();
               expect(m1[1]).toEqual(sa.users.getUserIds().join(','));
               expect(m1[2]).toEqual(uc.id);
               expect(m1[3]).toEqual('1');
               expect(m1[4]).toEqual('test1');
               var m2 = msgs[1].split('**');
               expect(m2.length).toEqual(5);
               messages.push(m1,m2);
           };
           mh.handle(MHEAD.SM_GET_UNREAD_MSG +  uc.id,uc.conn);
       });      
       waitsFor(function(){return messages.length===2;});
       
       runs(function(){
            uc.send = function(msg){
                console.log('\nGet messaged detail:'+msg);
                msg = msg.slice(MHEAD.SM_MSG_DETAIL.length);
                var msgs = msg.split('@@');
                expect(msgs.length).toEqual(1);
                var m = msgs[0].split('**');
                expect(m[0]).toEqual(messages[0][0]);
                expect(m[1]).toEqual(sa.id);
                expect(isNaN(m[2])).toBeFalsy();
                expect(m[3]).toEqual(ua.id);
                expect(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(m[4])).toBeTruthy();
                expect(m[5]).toEqual('test1');
                fin = true;
            };
            mh.handle(MHEAD.SM_GET_MSG_DETAIL + uc.id + ',' + messages[0][0],uc.conn);
       });
       waitsFor(function(){return fin;});
   });
   
   it('should save and get system message',function(){
       var i = 0,msgId = 0;
       var m = "this is test system message";
       runs(function(){
           i = 0;
           spyOn(ub,'send');
           spyOn(ud,'send');
           mh.handle(MHEAD.SM_SEND_SYS_MSG + ua.id+'**'+m,ua.conn);
           waits(300);
           runs(function() {
               mstore.messageCount(function(c){
                   expect(c).toEqual(1);
                   i++;
               });
               mstore.getUserMaxMsgId(ub.id,function(maxId){
                   msgId = maxId;
                   expect(maxId).not.toEqual(-1);
                   i++;
               });
                   mstore.getUserMaxMsgId(ud.id,function(maxId){
                   expect(maxId).toEqual(-1);
                   i++;
               });
           });
       });
       waitsFor(function(){return i===3;});
       runs(function(){
           i=0;
           expect(ub.send).toHaveBeenCalledWith(MHEAD.SM_SEND_SYS_MSG + ua.id+'**now**'+msgId+'**'+m);
           expect(ud.send).not.toHaveBeenCalled();
           ub.send = function(msg){
               expect(function(){throw 'should never run this.';}).not.toThrow();
           };
           mh.handle(MHEAD.SM_GET_SYS_MSG+ub.id,ub.conn);
           ud.conn = new ConnMock('1.1.1.5');
           ud.send = function(msg) {
               console.log('\nGet system message:'+msg);
                msg = msg.slice(MHEAD.SM_SEND_SYS_MSG.length);
                var msgs = msg.split('@@');
                expect(msgs.length).toEqual(1);
                var m1 = msgs[0].split('**');
                expect(m1[0]).toEqual(ua.id);
                expect(m1[2]).toEqual(msgId.toString());
                expect(m1[3]).toEqual(m);
                expect(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(m1[1])).toBeTruthy();
                i++;
           };
           mh.handle(MHEAD.SM_GET_SYS_MSG+ud.id,ud.conn);
       });
        waitsFor(function(){return i===1;}); 
        runs(function(){});
   });
   
   it('should clear all unread message',function(){
       var fin = false;
        runs(function(){
          var m = [sa.id,ua.id,'test1'].join('**');
          mh.handle(m,ua.conn);
       });
       waits(200);
       var i = 0;
       runs(function(){
         m =  [sb.id,ua.id,'test2'].join('**');
         mh.handle(m,ua.conn);
         var getCount = function(c) {
           if (c !== 3) {
               mstore.unreadCount(arguments.callee);
           } else {
               i= c;
           }
         };
         mstore.unreadCount(getCount);
       });
 
       waitsFor(function(){return i===3;},'messages less than 2',1000);
       runs(function(){
           uc.conn = new ConnMock('xxx');
           m = MHEAD.SM_DELETE_ALL_MSG + uc.id;
           mh.handle(m,uc.conn);
       });
       waits(300);
       runs(function(){
          uc.send = function(msg){
             expect(function(){throw 'should never run this.';}).not.toThrow();
           };
           mh.handle(MHEAD.SM_GET_UNREAD_MSG +  uc.id,uc.conn);
       });
       waits(300);

   });
 
});