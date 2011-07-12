require('./ext/array');
require('./log');
var CONST = require('./const');
var net = require('net');

/*
Message handler class. the core of the message transfor.
*/

function MessageHandler(users,sessions) {
    var MHEAD = require('./messageHeader');
    var mstore = require('./messageStore');
    //initialize SysMessageProcess
    var sysMessageProcessor = require('./sysMessageProcessor');
    
    this.users = users;
    this.sessions = sessions;
    
    //save last message infomation
    this.lastMessageType = null;
    this.lastMessageHeader = null;
    this.lastMessage = null;
    this.lastObject = null;
    
    //handle the user message
    this.userMessageProcess = function(conn){
        var ms = this.lastMessage.split('**');
        if (ms.length < 3)  {
          this.lastMessageType = 'UNKOWN';
          this.lastMessageHeader = null;
          logger.error('Invalid message:' + this.lastMessage.substr(0,200));
          return null;
        }
        var u = this.users.find(ms[1]);
        if (!u) {
            u = this.users.findByConn(conn);
            logger.errorToUser(MHEAD.SM_SERVER_ERROR + CONST.ERR_USER_NOT_EXISTS + ':' + ms[1],u);
            return null;
        }
        var s = this.sessions.find(ms[0]);
        if (!s) {
            logger.errorToUser(MHEAD.SM_SERVER_ERROR + CONST.ERR_SESSION_NOT_EXISTS + ':' + ms[0],u);
            return null;
        }
        var self = this;
        s.users.getUsers(true).forEach(function(v,i,a){
            if (v.id !== u.id) {
                v.send(self.lastMessage);
            }
        });
        
        //offline message
        var offlineUsers = s.users.getUsers(false);
        if (offlineUsers.length > 0){
            var userIds = offlineUsers.map(function(v,i,a){return v.id;});
            mstore.saveMessage(s.id,s.users.getUserIds().join(','),u.id,ms[2],function(msgId){
                 mstore.addUnread(userIds,msgId);
            });
        }
        return s;
    };
 

    //message handle,get message type and content then call the specific method.
    //this function fill the last* property by message content. but only a few specific message
    //has meaningful value to this.lastObject. just like login,create session etc.
    this.handle = function(msg,fromConnection){
        this.lastMessageType = null;
        this.lastMessageHeader = null;
        this.lastMessage = null;
        this.lastObject = null;
        
       // logger.debug('receive:' + msg.substr(0,200));
        if (!(fromConnection instanceof net.Socket)){
            logger.error(CONST.EX_INVALID_CONN);
            throw CONST.EX_INVALID_CONN;
        }
     
       if (msg.indexOf(MHEAD.SYS_MSG_PREFIX) === 0) {
            var m = MHEAD.SYS_MSG_PATTERN.exec(msg);
            if (m !== null) {
                this.lastMessageType = 'SYS';
                this.lastMessageHeader = m[0];
                this.lastMessage = msg.slice(this.lastMessageHeader.length);
                this.lastObject = sysMessageProcessor[this.lastMessageHeader].call(this,fromConnection);
            } 
        } else  {
            this.lastMessageType = 'USER';
            this.lastMessageHeader = MHEAD.USER_MSG_PREFIX;
            this.lastMessage = msg;
            this.lastObject = this.userMessageProcess(fromConnection);
        } 
        
        msg = null; //maybe release memory
        
    };
    
  
    
}

module.exports = {'MessageHandler':MessageHandler};