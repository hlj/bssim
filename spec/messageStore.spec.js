describe('Message Store',function() {
   global.database = '132.239.10.18:27017/bssim_test';
   console.log('Database file:'+global.database);
   var mstore = require('../lib/messageStore');
   var Session = require('../lib/session').Session;
   var User = require('../lib/user').User;
   var ConnMock = require('./mock/connection.mock').Connection;

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
       //add two message
       var saIds = sa.users.getUserIds().join(',');
       var sbIds = sb.users.getUserIds().join(',');
 
       var count = function(){i++;};
       runs(function() {
          mstore.saveMessage(sa.id,saIds,ua.id,'test',function(msgId){
           //  console.log('m1:'+msgId);
             mstore.addUnread([uc.id,ud.id],msgId,count);
          });
       });
       waitsFor(function(){return i===1;});
       runs(function() {
          mstore.saveMessage(sb.id,sbIds,ua.id,'test2',function(msgId){
           // console.log('m2:'+msgId);
            mstore.addUnread([uc.id],msgId,count);
          });
       });
       waitsFor(function(){return i===2;});
       runs(function() {
          mstore.saveMessage(sb.id,sbIds,ua.id,'test3',function(msgId){
           // console.log('m3:'+msgId);
             mstore.addUnread([uc.id],msgId,count);
          });
       }); 
        waitsFor(function(){return i===3;}); //ensure data created 
       runs(function(){});
       }); //runs  
   });
   

   it('should save and read offline user message',function(){    
       var fin = false;
       var i = 0;
       runs(function(){
       mstore.messageCount(function(c){
           i++;
           expect(c).toEqual(3);
       });
       mstore.sessionCount(function(c){
           i++;
           expect(c).toEqual(2);
       });
       mstore.unreadCount(function(c){
           i++;
           expect(c).toEqual(4);
       }); 
       });
       waitsFor(function(){return i===3;});
       var unreadMsgs=null;
              
       runs(function(){
       //get message's breif
       mstore.getUnreadMessages(ub.id,function(msgs){
          expect(msgs.length).toEqual(0);
       }); 
    
       mstore.getUnreadMessages(uc.id,function(msgs){
         expect(msgs.length).toEqual(2);
          expect(msgs[0].userIds).toEqual(sa.users.getUserIds().join(','));
          expect(msgs[0].text).toEqual('test');
          expect(msgs[1].userIds).toEqual(sb.users.getUserIds().join(','));
          expect(msgs[1].text).toEqual('test3');
          expect(msgs[0].msgCount).toEqual(1);
          expect(msgs[1].msgCount).toEqual(2); 
          unreadMsgs = msgs;
       }); 
       }); //runs 
       waitsFor(function(){return !!unreadMsgs;});
       runs(function(){
       i = 0;
       //get messages by session id
       mstore.getMessageDetails(unreadMsgs[0].userId,unreadMsgs[0].sessionId,function(msgs){
          expect(msgs.length).toEqual(1);
          expect(msgs[0].text).toEqual('test');
          expect(msgs[0].oriSessionId).toEqual(sa.id);
          expect(msgs[0].sessionId).toEqual(unreadMsgs[0].sessionId);
          expect(msgs[0].time).not.toBeNull();
          expect(msgs[0].senderId).toEqual(ua.id);
          //deleted after got
          mstore.getMessageDetails(unreadMsgs[0].userId,unreadMsgs[0].sessionId,function(msgs){
            i++;
            expect(msgs.length).toEqual(0);
          });
       });
       }); //runs
       waitsFor(function(){return i===1;});

       runs(function(){
       i = 0;
       mstore.getMessageDetails(unreadMsgs[1].userId,unreadMsgs[1].sessionId,function(msgs){
          // console.log('1:'+new Date().getTime());
          //console.log(msgs);
          expect(msgs.length).toEqual(2);
          expect(msgs[0].text).toEqual('test2');
          expect(msgs[0].oriSessionId).toEqual(sb.id);
          expect(msgs[0].senderId).toEqual(ua.id);
          expect(msgs[1].text).toEqual('test3');
          expect(msgs[1].oriSessionId).toEqual(sb.id);
          expect(msgs[1].senderId).toEqual(ua.id);
          //deleted after got
          mstore.getMessageDetails(unreadMsgs[1].userId,unreadMsgs[1].sessionId,function(msgs1){
            expect(msgs1.length).toEqual(0);
            i++;
          });
       });      
       }); //runs
       waitsFor(function(){return i===1;});
       var unreadMsgs2 = null;
       runs(function(){
       mstore.getUnreadMessages(ud.id,function(msgs){
          expect(msgs.length).toEqual(1);
          expect(msgs[0].userIds).toEqual(sa.users.getUserIds().join(','));
          expect(msgs[0].text).toEqual('test');
          unreadMsgs2 = msgs;
       }); 
       }); //runs
       waitsFor(function(){return !!unreadMsgs2;}); 
     
       runs(function(){
       //get messages by session id
       mstore.getMessageDetails(unreadMsgs2[0].userId,unreadMsgs2[0].sessionId,function(msgs){
          expect(msgs.length).toEqual(1);
          expect(msgs[0].text).toEqual('test');
          expect(msgs[0].senderId).toEqual(ua.id);
          //deleted after got
          mstore.getMessageDetails(unreadMsgs2[0].userId,unreadMsgs2[0].sessionId,function(msgs){
            expect(msgs.length).toEqual(0);
            //mstore.messageCount(function(c){
            //    expect(c).toEqual(0);
                fin = true;
            //});
          });
       });
       }); //runs
       waitsFor(function(){return fin;}); 
       runs(function(){});
   });
   
   it('should save and get system message',function(){
       var i = 0;
       var fc = function(){i++;};
       mstore.saveMessage(null,null,ua.id,'systest1',fc);
       waitsFor(function(){return i===1;});
       runs(function(){
       mstore.saveMessage(null,null,ub.id,'systest2',fc);
       });
       waitsFor(function(){return i===2;});
       runs(function(){
          i= 0;
          mstore.getUserMaxMsgId(ua.id,function(maxId){
              expect(maxId).toEqual(-1);
              i++;
          }); 
       });
       waitsFor(function(){return i===1;});
       runs(function(){
           i = 0;
           mstore.getSystemMessages(ua.id,function(msgs){
               expect(msgs.length).toEqual(2);
               expect(msgs[1].text).toEqual('systest1');
               expect(msgs[1].senderId).toEqual(ua.id);
               expect(msgs[1].time).not.toBeNull();
               expect(msgs[0].text).toEqual('systest2');
               expect(msgs[0].senderId).toEqual(ub.id);
               expect(msgs[0].time).not.toBeNull();
               mstore.getSystemMessages(ua.id,function(msgs){
                   expect(msgs.length).toEqual(0);
                   i++;
               });
           });
           mstore.getSystemMessages(uc.id,function(msgs){
               expect(msgs.length).toEqual(2);
               mstore.getSystemMessages(uc.id,function(msgs){
                   expect(msgs.length).toEqual(0);
                   i++;
                  
               });
           });
       });
       waitsFor(function(){return i===2;});
       runs(function(){
            i = 0;
            mstore.saveMessage(null,null,ub.id,'systest1',function(){
                mstore.getSystemMessages(ua.id,function(msgs){
                    expect(msgs.length).toEqual(1);
                    expect(msgs[0].text).toEqual('systest1');
                    expect(msgs[0].senderId).toEqual(ub.id);
                    i++;
                });
                mstore.getSystemMessages(ud.id,function(msgs){
                    expect(msgs.length).toEqual(3);
                    expect(msgs[0].text).toEqual('systest1');
                    expect(msgs[0].senderId).toEqual(ub.id);
                    mstore.getUserMaxMsgId(ud.id,function(maxId){
                        expect(maxId).toEqual(msgs[0].msgId);
                        i++;
                    });
                });
            });
       });
       waitsFor(function(){return i===2;});
   });
   
   it('should delete all unread message for user',function(){
       var fin = false;
       runs(function(){
           mstore.getUnreadMessages(uc.id,function(msgs){
              expect(msgs.length).toEqual(2);
              fin = true;
            });
       });
       waitsFor(function(){return fin;});      
       runs(function(){
           mstore.deleteAll(uc.id,function(){
               mstore.getUnreadMessages(uc.id,function(msgs){
                   expect(msgs.length).toEqual(0);
                   fin = true;
               });
           });
       });
       waitsFor(function(){return fin;});
   });
   
   it('should update user_max_msg_id when get system message',function(){
       var i=0;
       var newMsgId  = -1;
       var fc = function(msgId){newMsgId = msgId;i++;};
       mstore.saveMessage(null,null,ua.id,'systest1',fc);
       mstore.saveMessage(null,null,ua.id,'systest2',fc);
       waitsFor(function(){return i===2;});
       runs(function(){
           //console.log(newMsgId);
           mstore.setUserMaxMsgId(ua.id,newMsgId,function(){
                mstore.getUserMaxMsgId(ua.id,function(maxId){
                    expect(maxId).toEqual(newMsgId);
                });
           });
           mstore.getUserMaxMsgId(uc.id,function(maxId){
               expect(maxId).toEqual(-1);
           });
           mstore.getSystemMessages(uc.id,function(message){
               mstore.getUserMaxMsgId(uc.id,function(maxId){
                  expect(maxId).toEqual(newMsgId);
               });
           });
       });
       waits(300);
       runs(function(){
           i=0;
           newMsgId  = -1;
           mstore.saveMessage(null,null,ua.id,'systest1',fc);
           mstore.saveMessage(null,null,ua.id,'systest2',fc);
           waitsFor(function(){return i===2;});
           runs(function(){
              mstore.setUserMaxMsgId(ua.id,newMsgId,function(){
                mstore.getUserMaxMsgId(ua.id,function(maxId){
                    expect(maxId).not.toEqual(-1);
                });
              });
              mstore.getSystemMessages(uc.id,function(message){
               expect(message.length).toEqual(2);
               mstore.getUserMaxMsgId(uc.id,function(maxId){
                  expect(maxId).toEqual(newMsgId);
               });
              });
          });
       });
       waits(300);
       
   });
   
   it('getUnreadMessages should exclued system message',function(){
       var i=0;
       var fc = function(msgId){newMsgId = msgId;i++;};
       mstore.saveMessage(null,null,ua.id,'systest1',fc);
       mstore.saveMessage(null,null,ua.id,'systest2',fc);
       waitsFor(function(){return i===2;});
       var fin = false;
       runs(function(){
           mstore.getSystemMessages(uc.id,function(sms){
              mstore.getUnreadMessages(uc.id,function(msgs){
                 console.log(msgs);
                 expect(msgs.length).toEqual(2);
                 fin = true;
               });
          });
       });
       waitsFor(function(){return fin;});
   });
   
   
}); //describ

