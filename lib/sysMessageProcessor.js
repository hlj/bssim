require('./ext/array');
require('./log');
var net = require('net');
var uuid = require('node-uuid');
var status = require('./status');

var MHEAD = require('./messageHeader');
var CONST = require('./const');
var Session = require('./session').Session;
var User = require('./user').User;
var mstore = require('./messageStore');

 
var h = {};

h[MHEAD.SM_LOGIN] = function(conn){
    //connection must not used
    var cu = this.users.findByConn(conn);
    if (cu) {
        logger.errorToUser(MHEAD.SM_SERVER_ERROR + CONST.ERR_CONN_USED,cu);
        return null;
    }
    
    var u=null;
    var newUser = false;
    //user exists
    cu = this.users.find(this.lastMessage);
    if (cu){
        if (cu.conn instanceof net.Socket) {
            cu.end(MHEAD.SM_DUP_LOGIN);
            cu.conn.destroy();
        }
        cu.conn = conn;
        u = cu;
    } else {
        u = new User(this.lastMessage,conn);
        newUser = true;
    }
    
    var m = MHEAD.SM_LOGIN + this.lastMessage + ':' + u.ip;
    //send new user login message to other users
    var onlineUsers = this.users.getUsers(true);
    onlineUsers.forEach(function(u,i,us){
        u.send(m);        
    });
    
    if (newUser)
        onlineUsers.push(u);
    //send all online user id to new user
    m = MHEAD.SM_CURRENT_USERS + onlineUsers.map(function(u) {return u.id+':'+u.ip;}).join(',');
    u.send(m);
    
    if (newUser)
        this.users.add(u);
        
    return u;
};

h[MHEAD.SM_LOGOUT] = function(conn){
    var cu = this.users.find(this.lastMessage);
    if (cu && cu.conn === conn) {
        cu.conn = null;
    }
    //send logout message to other online users
    this.users.getUsers(true).forEach(function(u,i,us){
        u.send(MHEAD.SM_LOGOUT+cu.id);
    });
    return cu;
};

h[MHEAD.SM_CREATE_SESSION] = function(conn){
    var us = this.lastMessage.split(',');
    var sender = us.shift();
    if (us.length > 1) {
        var s = new Session(uuid());
        var rm = MHEAD.SM_START_SESSION + s.id + ',' + this.lastMessage;
        var self = this;
        us.forEach(function(v,i,a){
            var u = self.users.find(v);
            if (!u){
                u = new User(v);
                self.users.add(u);
            } else {
                if (u.online)
                  u.send(rm);
            }
            s.addUser(u);
        });
        this.sessions.add(s);
        return s;
    } else {
        return null;
    }
};

h[MHEAD.SM_EXIT_SESSION] = function(conn){
    var ms = this.lastMessage.split(',');
    if (ms.length != 2) return null;
        
    var s = this.sessions.find(ms[0]);
    var u = this.users.find(ms[1]);
    if (!u) {
        u = this.users.findByConn(conn);
        logger.errorToUser(MHEAD.SM_SERVER_ERROR+CONST.ERR_USER_NOT_EXISTS,u);
        return null;
    }   
    if (s){
        if (s.hasUser(u.id)) {
            s.removeUser(u);
            var msg = this.lastMessageHeader + this.lastMessage;
            s.users.getUsers(true).forEach(function(u,i,a){
                u.send(msg);
            });
        } else {
            logger.errorToUser(MHEAD.SM_SERVER_ERROR+CONST.ERR_USER_NOT_IN_SESSION,u); 
        } 
        return s;
    } else {
        logger.errorToUser(MHEAD.SM_SERVER_ERROR+CONST.ERR_SESSION_NOT_EXISTS,u);
        return null;
    }
};

h[MHEAD.SM_ADDTO_SESSION] = function(conn){
    var ms = this.lastMessage.split(',');
    if (ms.length < 2) return null;
    var sid = ms.shift(ms);
    var s = this.sessions.find(sid);
    if (!s) {
        var sender = this.users.findByConn(conn);
        logger.errorToUser(MHEAD.SM_SERVER_ERROR + CONST.ERR_SESSION_NOT_EXISTS + ':'+sid,sender);
        return null;
    }
    var self = this;
    var oldUsers = s.users.getUsers(true);
    var newUsers= [];
    
    ms.forEach(function(v,i,a){
        var u = self.users.find(v);
        if (!u){
            u = new User(v); //if user not exists,create a new user;
            self.users.add(u);
        } 
        newUsers.push(u);
        s.addUser(u);
    });
    var rm = this.lastMessageHeader+this.lastMessage;
    oldUsers.forEach(function(v,i,a){
        v.send(rm);
    });
    
    rm = MHEAD.SM_START_SESSION + s.id + ',-1,' + s.users.getUserIds().join(',');
    newUsers.forEach(function(v,i,a){
        if (v.online) v.send(rm);
    });

    return s;
    
};

h[MHEAD.SM_BROADCAST_MSG] = function(conn){
    var self = this;
    this.users.getUsers(true).forEach(function(v,i,a){
        v.send(self.lastMessage);
    });
    return null;
};


h[MHEAD.SM_QUERY_SESSION_INFO] = function(conn){
    var ms = this.lastMessage.split(',');
    if (ms.length !== 2) return null;

    var u = this.users.find(ms[1]);
    if (!u) {
        u = this.users.findByConn(conn);
        if (!u) {
            logger.error(CONST.ERR_USER_NOT_EXISTS + ':' + ms[1]);
            return null;
        }
    }
    
    var s = this.sessions.find(ms[0]);
    if (!s) {
        logger.error(CONST.ERR_SESSION_NOT_EXISTS + ':' + ms[0]);
        u.send(MHEAD.SM_SESSION_INFO + ms[0] + ',null');
    } else {
        u.send(MHEAD.SM_SESSION_INFO + s.id + ',' + s.users.getUserIds().join(','));
    }
    
    return null;
};

h[MHEAD.SM_GET_UNREAD_MSG] = function(conn){
    var u = this.users.find(this.lastMessage);
    if (!u) return null;
    mstore.getUnreadMessages(u.id,function(msgs){
        var msg = [];
        msgs.forEach(function(v,i,a){
            msg.push(v.sessionId + '**' + v.userIds +'**'+v.userId+'**'+v.msgCount+'**'+v.text);
        });
        if (msg.length > 0){
            u.send(MHEAD.SM_UNREAD_MSG + msg.join('@@'));
        }
    });
    return null;
};

h[MHEAD.SM_GET_MSG_DETAIL] = function(conn){
    var ms = this.lastMessage.split(',');
    if (ms.length !== 2) return null;
    var u = this.users.find(ms[0]);
    if (!u) return null;
    mstore.getMessageDetails(u.id,ms[1],function(msgs){
        var msg = [];
        msgs.forEach(function(v,i,a){
            msg.push(v.sessionId+'**'+v.oriSessionId+'**'+v.msgId+'**'+v.senderId+'**'+v.time+'**'+v.text);
        });
        if (msg.length >0) {
            u.send(MHEAD.SM_MSG_DETAIL+msg.join('@@'));
        }
    });
    return null;
};

h[MHEAD.SM_SEND_SYS_MSG] = function(conn){
    var ms = this.lastMessage.split('**');
    if (ms.length !==2) return null;
    var u = this.users.find(ms[0]);
    if (!u) return null;
    var onlines = this.users.getUsers(true);
    mstore.saveMessage(null,null,u.id,ms[1],function(msgId){
        var msg = MHEAD.SM_SEND_SYS_MSG + u.id+'**now**'+msgId+'**'+ms[1];
        onlines.forEach(function(v,i,a){
            v.send(msg);
        });
        mstore.setUserMaxMsgId(onlines.map(function(v,i,a){return v.id;}),msgId);
    });
};


h[MHEAD.SM_GET_SYS_MSG] = function(conn){
    var u = this.users.find(this.lastMessage);
    if (!u) return null;
    mstore.getSystemMessages(u.id,function(msgs){
        var msg = [];
        msgs.forEach(function(v,i,a){
            msg.push(v.senderId+'**'+v.time+'**'+v.msgId+'**'+v.text);
        });
        if (msg.length>0){
            u.send(MHEAD.SM_SEND_SYS_MSG+msg.join('@@'));
        }
    });
};

h[MHEAD.SM_DELETE_ALL_MSG] = function(conn){
    var u = this.users.find(this.lastMessage);
    if (!u) return null;
    mstore.deleteAll(u.id);
};

h[MHEAD.SM_GET_SERVER_STATUS] = function(conn){
    var u = this.users.findByConn(conn);
    if (!u) return null;
    var  m = MHEAD.SM_GET_SERVER_STATUS + status.getStatus();
    u.send(m);
};


module.exports = h;