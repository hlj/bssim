var mongo = require('mongoskin');
require('./ext/date');
//var uuid = require('node-uuid');

    
if (!global.messageStore){
   var PK = function(){
       var pk_num = (new Date()).getTime();
       this.getPK = function(){
           return pk_num++;
       };
   };
    
  //  console.log('new messageStore');
    var messageStore = function(){
        var db = null;
        
        var pkGen = new PK();
        
        this.open = function(){
            if (db) db.close();
            console.log('\nopen database...');
            db = mongo.db(global.database+'?auto_reconnect');
        };
        
        this.close = function(){
            if (db) {
                console.log('\nclose database...');
                db.close();
                db = null;
            }
        };
        
        this.__defineGetter__('db',function(){return db;});
        this.__defineGetter__('pkGen',function(){return pkGen;});
               
                
        //save a message and this session,if sucess,call the callback with sessionId
        this.saveMessage = function(sessionId,userIds,senderId,message,callback){ 
            var c = db.collection('messages');
            c.ensureIndex({"sessionId":1},function(){});
            c.ensureIndex({"users":1},function(){});
           // c.ensureindex({"time":1});
            c.insert({'_id':pkGen.getPK(),'sessionId':sessionId,'userIds':userIds,'senderId':senderId,'text':message,'time':new Date(),'users':[]},
                {'safe':true},function(err,recs) {
                    if (err) throw "Save offline message error:" + err;
                    var msgId = recs[0]._id;
                    if (msgId.toNumber) msgId = msgId.toNumber();
                    if (callback) callback(msgId);
                });                        
        };
        
        //add unread user and message,userIds is an array of offline user id.
        this.addUnread = function(userIds,msgId,callback){
            var c = db.collection('messages');
            c.update({'_id':msgId},{'$addToSet': {'users' : {'$each':userIds}}},{'safe':true},function(err){
                if (err)  throw "Add unread message error:" + err;
                if (callback) callback();
            });  
        };
        
        
         //messsage count
        this.messageCount=function(callback){
            var c = db.collection('messages');
            c.count(function(err,n){
                if (err) throw "Get messages count error:" + err;      
                if (callback) callback(n);
            });
        };
        
        //session count
        this.sessionCount=function(callback){
            var c = db.collection('messages');
            c.distinct('sessionId',function(err,docs){
                if (err) throw "Get sessions count error:" + err;      
                if (callback) callback(docs.length);
            });
        };
        
        //unread count
        this.unreadCount=function(callback){
              var c = db.collection('messages');
              var count = 0;
              c.find({'sessionId':{'$ne':null}},{'users':1}).each(function(err,doc){
                  if (err) throw "Get sessions count error:" + err;
                  if (!doc) {
                      if (callback) callback(count);
                  } else  {
                      count += doc.users.length;
                  }
              });
        };
 
        
        //get unread messages,group by session. call callback with messages.
        this.getUnreadMessages = function(userId,callback){
            var c = db.collection('messages');
            c.group(['sessionId'],{'users':userId,'sessionId':{$ne:null}},{'msgs':{}},function(doc,prev){
                if (!prev.msgs.time) {
                    prev.msgs ={'id':doc._id,'text':doc.text,'time':doc.time,'userIds':doc.userIds,'msgCount':1};
                } else {
                    prev.msgs.msgCount++;                            
                    if (doc._id > prev.msgs.id) {
                        prev.msgs.text = doc.text;
                        prev.msgs.time = doc.time;
                        prev.msgs.id = doc._id
                    }
                }
            },function(err,results){
                 if (err) throw "Get unread messages error2:" + err;
                 var messages=[];
                 results.sort(function(a,b){return a.msgs._id-b.msgs._id;});
                 results.forEach(function(v){
                  //  if (v.sessionId !== null) {
                        var m = {
                            'sessionId' : v.sessionId,
                            'msgCount': v.msgs.msgCount,
                            'text' : v.msgs.text,
                            'userId' : userId,
                            'userIds': v.msgs.userIds
                        };
                        messages.push(m);
                   // }
                 });
                 if(callback) callback(messages);
            });
        };
        
        //get unread message detail based on specific session and user. call callback with message details.
        this.getMessageDetails = function(userId,sessionId,callback){
            var c = db.collection('messages');
            var messages=[];
            c.find({'sessionId':sessionId,'users':userId}).sort({'_id':1}).each(function(err,doc){
                 if (err) throw "Get unread message detail error:" + err;
                 if (!doc) {
                       //delete messages
                       c.update({'sessionId':sessionId,'users':userId},{'$pull':{'users':userId}},
                            {'multi':true,'safe':true},function(err){
                                if (err) throw "Get unread message detail error2:" + err;
                                c.remove({'sessionId':{$ne:null},'users':{$size: 0}},{'safe':true},function(err) {
                                    if (err) throw "Get unread message detail error3:" + err;
                                    if (callback) callback(messages);
                                });
                            });
                 } else {
                     var msgId = doc._id;
                     if (msgId.toNumber) msgId = msgId.toNumber();
                     
                     var ms = {
                        'sessionId' : doc.sessionId,
                        'oriSessionId' : doc.sessionId,
                        'time' : doc.time.shortTimeString(),
                        'text' : doc.text,
                        'senderId' : doc.senderId,
                        'msgId' : msgId
                     };
                     messages.push(ms);
                };
            });
        }
        
        this.deleteAll = function(userId,callback){
            var c = db.collection('messages');
            c.update({'sessionId':{$ne:null},'users':userId},{'$pull':{'users':userId}},
                {'multi':true,'safe':true},function(err){
                    if (err) throw "Get unread message detail error2:" + err;
                    c.remove({'sessionId':{$ne:null},'users':{$size: 0}},{'safe':true},function(err) {
                        if (err) throw "Get unread message detail error3:" + err;
                        if (callback) callback();
                    });
                });
        };      
        
        //get unread system message for a user,limited 30. 
        this.getSystemMessages = function(userId,callback){
            var c = db.collection('messages');
            var messages=[];
            c.find({'sessionId':null,'users':{'$nin':[userId]}}).sort({'_id':-1}).limit(30).each(function(err,doc){
                if (err) throw "Get system message  error:" + err;
                if (!doc) {
                    c.update({'sessionId':null,'users':{'$nin':[userId]}},{$push:{'users':userId}},{'multi':true,'safe':true},
                        function(err,doc){
                            if (err) throw "Get system message  error2:" + err;
                            if (callback) callback(messages);
                        });
                } else {
                    var msgId = doc._id;
                    if (msgId.toNumber) msgId = msgId.toNumber();
                    var ms = {
                        'msgId' : msgId,
                        'text' : doc.text,
                        'senderId' : doc.senderId,
                        'time' : doc.time.shortTimeString()
                    };
                    messages.push(ms);
                }
            });            
        };
        
        
        //set user max message id
        this.setUserMaxMsgId = function(userIds,msgId,callback){
           if (!(userIds instanceof Array)) userIds = [userIds];
           var c = db.collection('messages');
           c.update({'_id':msgId},{$addToSet:{'users':{$each:userIds}}},{'safe':true},function(err){
               if (err) throw "set user max message id  error:" + err;
                if (callback) callback();
           });
        };
        
        //get user max message is,call callback with max id
        this.getUserMaxMsgId = function(userId,callback){
            var c = db.collection('messages');
            c.find({'sessionId':null,'users':userId},{'_id':1}).sort({'_id':-1}).limit(1).toArray(function(err,docs){
                if (err) throw "Get user max message id  error:" + err;
                var maxId = -1;
                if (docs.length>0) maxId = docs[0]._id;
                if (maxId.toNumber) maxId = maxId.toNumber();
                if (callback) callback(maxId);
            });          
        };
        
    };//function end
    
     ms = new messageStore();
     ms.open();
    
     process.on('SIGINT', function () {
        ms.close();
     });

     process.on('exit',function(){
        ms.close();
     });

     global.messageStore = ms;
              
}


module.exports = global.messageStore;
