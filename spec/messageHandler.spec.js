describe("Message Handler",function(){
   var MHEAD = require('../lib/messageHeader');
   var CONST = require('../lib/const');
       
   var MessageHandler = require('../lib/messageHandler').MessageHandler;
   var DataParser = require('../lib/dataParser').DataParser;
   var Sessions = require('../lib/sessions').Sessions;
   var Session = require('../lib/session').Session;
   var Users = require('../lib/users').Users;
   var User = require('../lib/user').User;
   var netHelper = require('../lib/netHelper');
   var ConnMock = require('./mock/connection.mock').Connection;
   var net = require('net');

   var mh,dp,sessions,users,sa,sb,ua,ub,uc;
   
   beforeEach(function(){
       ua = new User('a',new ConnMock('1.1.1.1'));
       ub = new User('b',new ConnMock('1.1.1.2'));
       uc = new User('c');
       users = new Users();
       users.add(ua).add(ub).add(uc);
       sa = new Session('a');
       sb = new Session('b');
       sa.addUser([ua,ub]);
       sb.addUser([ua,ub,uc]);
       sessions = new Sessions();
       sessions.add([sa,sb]);
       dp = new DataParser();
       global.users = users;
       global.sessions = sessions;

       mh = new MessageHandler(users,sessions);
   });
   
   it('should get type and content from message',function(){
       expect(mh.lastMessageType).toEqual(null);
       expect(mh.lastMessage).toEqual(null);

       var m = MHEAD.SM_LOGIN + "xxxx";
       dp.append(netHelper.getNetString(m));
       mh.handle(dp.nextData(),new ConnMock());
       expect(mh.lastMessageType).toEqual('SYS');
       expect(mh.lastMessage).toEqual("xxxx");
       
       m = "yyyy**1111**sssss";
       dp.append(netHelper.getNetString(m));
       mh.handle(dp.nextData(),new ConnMock());
       expect(mh.lastMessageType).toEqual('USER');
       expect(mh.lastMessage).toEqual(m);
       
       m =  "XX:SM:yyyy";
       dp.append(netHelper.getNetString(m));
       mh.handle(dp.nextData(),new ConnMock());
       expect(mh.lastMessageType).toEqual('UNKOWN');
       expect(mh.lastMessage).toEqual("XX:SM:yyyy");
   });
   
   it('should throw error on invaild connection object',function(){
       var m = MHEAD.SM_LOGIN + "user1";
       expect(function(){mh.handle(m,new net.Socket());}).toThrow('Socket is not writable');
       expect(function(){mh.handle(m,{});}).toThrow(CONST.EX_INVALID_CONN);
   });
       
   it('should handle login message',function(){
       var m = MHEAD.SM_LOGIN + "user1";
       spyOn(ua,"send");
       spyOn(ub,"send");
       spyOn(uc,"send");
       var conn = new ConnMock('1.1.1.3');
       spyOn(conn,'write');
       
       mh.handle(m,conn);
       expect(users.count).toEqual(4);
       expect(users.find('user1')).not.toEqual(null);
       expect(mh.lastObject.id).toEqual('user1');
       var expectMessage = m+':1.1.1.3';
       expect(ua.send).toHaveBeenCalledWith(expectMessage);
       expect(ub.send).toHaveBeenCalledWith(expectMessage);
       expect(uc.send).not.toHaveBeenCalledWith(expectMessage);
       expectMessage = MHEAD.SM_CURRENT_USERS + ua.id+':'+ua.ip+','+ ub.id +':' +ub.ip  + ',user1:1.1.1.3' ;
       expect(conn.write).toHaveBeenCalledWith(netHelper.getNetString(expectMessage),'ascii');
       //user login twice
       m= MHEAD.SM_LOGIN + ua.id;
       conn = new ConnMock('1.1.1.4');
       mh.handle(m,conn);
       expect(users.count).toEqual(4);
       expect(ua.conn).toEqual(conn);
       expectMessage = MHEAD.SM_CURRENT_USERS + ua.id+':1.1.1.4'+','+ ub.id +':' +ub.ip  + ',user1:1.1.1.3' ;
       expect(ua.send).toHaveBeenCalledWith(expectMessage);
       expectMessage = m+':1.1.1.4';
       expect(ub.send).toHaveBeenCalledWith(expectMessage);
   });
   
   it('should send error to client when connection exists',function(){
       var conn = new ConnMock('1.1.1.3');
       var m = MHEAD.SM_LOGIN + "user1";
       spyOn(conn,'write');
       mh.handle(m,conn);
       mh.handle(m+'2',conn);
       var em = MHEAD.SM_SERVER_ERROR + CONST.ERR_CONN_USED;
       expect(conn.write).toHaveBeenCalledWith(netHelper.getNetString(em),'ascii');
       
   });
   
   it('should respond with duplicate login to old user when the user id exists',function(){
       var m = MHEAD.SM_LOGIN + "user1";
       var conn = new ConnMock('1.1.1.3');
       mh.handle(m,conn);
       spyOn(conn,'end');
       mh.handle(m,new ConnMock('1.1.1.4'));
       expect(users.find('user1').ip).toEqual('1.1.1.4');
       expect(conn.end).toHaveBeenCalledWith(netHelper.getNetString(MHEAD.SM_DUP_LOGIN),'ascii');
   });
   
   it("should replace the user's connecton when the user has not connection",function() {
       var conn = new ConnMock('1.1.1.3');
       mh.handle(MHEAD.SM_LOGIN+uc.id,conn);
       expect(uc.ip).toEqual('1.1.1.3');
   });
   
   it('should handle logout message',function(){
       var m = MHEAD.SM_LOGOUT + ua.id;
       spyOn(ub,'send');
       mh.handle(m,ua.conn);
       expect(ua.online).toEqual(false);
       expect(ub.send).toHaveBeenCalledWith(m);
   });
   
   it('should handle create session message',function(){
       var uids = ua.id +',' + ua.id + ',' + ub.id + ',new1';
       var m = MHEAD.SM_CREATE_SESSION + uids;
       spyOn(ub,'send');
       spyOn(ua,'send');
       mh.handle(m,ua.conn);
       expect(sessions.count).toEqual(3);
       var session = mh.lastObject;
       expect(users.find('new1').id).toEqual('new1');
       expect(session.users.count).toEqual(3);
       expect(session.hasUser(ua.id)).toEqual(true);
       expect(session.hasUser(ua.id)).toEqual(true);
       expect(session.hasUser('new1')).toEqual(true);
       expect(session.users.find('new1').online).toEqual(false);
       expect(ub.send).toHaveBeenCalledWith(MHEAD.SM_START_SESSION + session.id +',' + uids);
       expect(ua.send).toHaveBeenCalledWith(MHEAD.SM_START_SESSION + session.id +',' + uids);
   });
   
   it('should create unique session id',function(){
       var uids = ua.id + ',' + ua.id + ',' + ub.id + ',new1';
       var m = MHEAD.SM_CREATE_SESSION + uids;
       mh.handle(m,ua.conn);
       var s1 = mh.lastObject;
       mh.handle(m,ua.conn);
       var s2 = mh.lastObject;
       expect(s1.id).not.toEqual(s2.id);
   });
   
   it('should handle exit session message',function(){
       var m = MHEAD.SM_EXIT_SESSION + 'a' +',' + ua.id;
       spyOn(ub,'send');
       mh.handle(m,ua.conn);
       expect(sa.users.count).toEqual(1);
       expect(sa.hasUser(ua.id)).toEqual(false);
       expect(ub.send).toHaveBeenCalledWith(m);
       
   });
   
   it('should respond with error when get invalid exit session message',function(){
       var m = MHEAD.SM_EXIT_SESSION + 'xx' +',' + ua.id;
       spyOn(ua,'send');
       mh.handle(m,ua.conn);
       expect(sa.users.count).toEqual(2);
       expect(ua.send).toHaveBeenCalledWith(MHEAD.SM_SERVER_ERROR+CONST.ERR_SESSION_NOT_EXISTS);
   });
   
   it('should respond with error when  invalid user id for exit session',function(){
         var m = MHEAD.SM_EXIT_SESSION + 'sa' +',' + ua.id+'1';
         spyOn(ua,'send');
         mh.handle(m,ua.conn);
         expect(sa.users.count).toEqual(2);
         expect(ua.send).toHaveBeenCalledWith(MHEAD.SM_SERVER_ERROR+CONST.ERR_USER_NOT_EXISTS);
   });
   
   it('should respond with error when user not in session for exit session',function(){
        var newUser = new User('xxx',new ConnMock('x'));
        mh.users.add(newUser);
        var m = MHEAD.SM_EXIT_SESSION + sa.id +',' + newUser.id;
        spyOn(newUser,'send');
        mh.handle(m,newUser.conn);
        expect(sa.users.count).toEqual(2);
        expect(newUser.send).toHaveBeenCalledWith(MHEAD.SM_SERVER_ERROR+CONST.ERR_USER_NOT_IN_SESSION);
   });
   
   
   it('should handle add to session message',function(){
       var m = MHEAD.SM_ADDTO_SESSION + [sa.id,uc.id,'newUser1'].join(',');
       uc.conn = new ConnMock('x');
       spyOn(ua,'send');
       spyOn(ub,'send');
       spyOn(uc,'send');
       mh.handle(m,ua.conn);
       expect(sa.users.count).toEqual(4);
       expect(users.find('newUser1').id).toEqual('newUser1');
       var em = MHEAD.SM_START_SESSION + sa.id+',-1,'+sa.users.getUserIds().join(',');
       expect(ua.send).toHaveBeenCalledWith(m);
       expect(ub.send).toHaveBeenCalledWith(m);
       expect(uc.send).not.toHaveBeenCalledWith(m);
       expect(uc.send).toHaveBeenCalledWith(em);
   });
   
   it('should respond with error when session not exists for add to session',function(){
       var m = MHEAD.SM_ADDTO_SESSION + ['xxx',uc.id].join(',');
       spyOn(ua,'send');
       spyOn(ub,'send');
       mh.handle(m,ua.conn);
       var em = MHEAD.SM_SERVER_ERROR + CONST.ERR_SESSION_NOT_EXISTS + ':xxx';
       expect(ua.send).toHaveBeenCalledWith(em);
       expect(ub.send).not.toHaveBeenCalled();
   });
   
   it('should handle broadcast message',function(){
       var m = 'SM:xxccdd:123:23';
       var u = new User('tt',new ConnMock('x'));
       users.add(u); //not in any session
       spyOn(ua,'send');
       spyOn(ub,'send');
       spyOn(u,'send');
       mh.handle(MHEAD.SM_BROADCAST_MSG +m,ua.conn);
       expect(ua.send).toHaveBeenCalledWith(m);
       expect(ub.send).toHaveBeenCalledWith(m);
       expect(u.send).toHaveBeenCalledWith(m);
       
   });
   
   it('should handle query session info message',function(){
       var u = new User('tt',new ConnMock('x'));
       users.add(u); //not in any session
       spyOn(u,'send');
       mh.handle(MHEAD.SM_QUERY_SESSION_INFO + sa.id+','+u.id,u.conn);
       expect(u.send).toHaveBeenCalledWith(MHEAD.SM_SESSION_INFO + [sa.id,ua.id,ub.id].join(','));
       mh.handle(MHEAD.SM_QUERY_SESSION_INFO + 'xxx'+','+u.id,u.conn);
       expect(u.send).toHaveBeenCalledWith(MHEAD.SM_SESSION_INFO +'xxx,null');
   });
   
   
   it('should handle user message',function(){
       var m = [sa.id,ua.id,'test message from users'].join('**');
       spyOn(ub,'send');
       spyOn(ua,'send');
       mh.handle(m,ua.conn);
       expect(ub.send).toHaveBeenCalledWith(m);
       expect(ua.send).not.toHaveBeenCalledWith(m);
   });
   
   it('should respond error when session not exists for user message',function(){
       var m =  ['xxx',ua.id,'test message from users'].join('**');
       spyOn(ub,'send');
       spyOn(ua,'send');
       mh.handle(m,ua.conn);
       expect(ua.send).toHaveBeenCalledWith(MHEAD.SM_SERVER_ERROR + CONST.ERR_SESSION_NOT_EXISTS+':xxx');
       expect(ub.send).not.toHaveBeenCalledWith(m);
   });
   
      
   it('should respond error when sender not exists for user message',function(){
       var m =  [sa.id,'xxx','test message from users'].join('**');
       spyOn(ub,'send');
       spyOn(ua,'send');
       mh.handle(m,ua.conn);
       expect(ua.send).toHaveBeenCalledWith(MHEAD.SM_SERVER_ERROR + CONST.ERR_USER_NOT_EXISTS+':xxx');
       expect(ub.send).not.toHaveBeenCalledWith(m);
   });
   
   it('should return server status',function(){
       var m = MHEAD.SM_GET_SERVER_STATUS;
       spyOn(ua,'send');
       mh.handle(m,ua.conn);
       expect(ua.send).toHaveBeenCalled();
       ua.send = function(msg){
           console.log('\nstatus:'+msg);
            msg = msg.slice(MHEAD.SM_GET_SERVER_STATUS.length);
            var re = /^allUsers:\d+;onlineUsers:\d+;allSessions:\d+;activeSessions:\d+;memory:\d+M;vsize:\d+M;heap:\d+M;dataBuffer:\d+$/;
            expect(re.test(msg)).toBeTruthy();
       };
       mh.handle(m,ua.conn);
   });
   
});