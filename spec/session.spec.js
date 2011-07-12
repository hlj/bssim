describe("Session class",function(){
    var Session = require('../lib/session').Session;
    var User = require('../lib/user').User;
    var ConnMock = require('./mock/connection.mock').Connection;
    var s=null,ua=null,ub=null,uc=null;
    
    beforeEach(function(){
        s = new Session("s001");
        ua = new User("a",new ConnMock('1'));
        ub = new User("b",new ConnMock('1'));
        uc = new User("c",new ConnMock('1'));
        s.addUser(ua).addUser([ub,uc]);
    });
    
    it('Create a session with three users',function(){
        expect(s.id).toEqual('s001');
        expect(s.users.count).toEqual(3);
    });
    
    it('Is the user in session',function(){
        expect(s.hasUser(ua.id)).toBeTruthy();
        expect(s.hasUser(ub.id)).toBeTruthy();
        expect(s.hasUser(uc.id)).toBeTruthy();
    });
    
    it('Must add a valid user',function(){
        s.addUser('1');
        s.addUser();
        s.addUser({id:'1',conn:{}});
        expect(s.users.count).toEqual(3);
        s.addUser(new User("x",{}));
        expect(s.users.count).toEqual(4);
    });
    
    it('Remove a user',function(){
        s.removeUser(ua);
        expect(s.users.count).toEqual(2);
        expect(s.hasUser(ua.id)).toBeFalsy();
    });
    
    it('If all users logged off or exitted the session,the session should set to "closed"',function(){
        expect(s.state).toEqual("active");
        ua.conn=null;
        ub.conn=null;
        uc.conn=null;
        expect(s.state).toEqual("closed");
        ua.conn=new ConnMock('1');
        expect(s.state).toEqual('active');
        s.removeUser(ua.id).removeUser(ub.id).removeUser(uc.id);
        expect(s.state).toEqual('closed');
    });
});