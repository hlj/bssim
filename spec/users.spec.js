describe('User list',function(){
    var Users = require('../lib/users').Users;
    var User = require('../lib/user').User;
    var ConnMock = require('./mock/connection.mock').Connection; 
    var users = null,ua = null, ub = null;
    
    beforeEach(function(){
        users = new Users();
        ua = new User('a',new ConnMock('1'));
        ub = new User('b');
    });
    
    it('Add a user',function(){
        users.add(ua);
        expect(users.count).toEqual(1);
        users.add(ub);
        expect(users.count).toEqual(2);
        expect(users.find(ua.id)).toEqual(ua);
    });
    
    it('Add reduplicate users',function(){
        users.add(ua).add(ua);
        expect(users.count).toEqual(1);
        var uc = new User('a',new ConnMock('1'));
        users.add(uc);
        expect(users.count).toEqual(1);
    });
    
    it('Add invalid user',function(){
        users.add("aa");
        expect(users.count).toEqual(0);
    });
    
    it('Find user by connection',function(){
        users.add(ua).add(ub);
        var conn = new ConnMock('1');
        ub.conn = conn;
        expect(users.findByConn(conn)).toEqual(ub);
    });
    
    it('Get users',function(){
       users.add(ua).add(ub);
       var us = users.getUsers();
       expect(us.length).toEqual(2);
       us = users.getUsers(true);
       expect(us.length).toEqual(1);
       expect(us[0]).toEqual(ua);
       us = users.getUsers(false);
       expect(us.length).toEqual(1,"offline nums 1");
       expect(us[0]).toEqual(ub);
       ub.conn=new ConnMock('1');
       us = users.getUsers(true);
       expect(us.length).toEqual(2);
       expect(us.exists(ub)).toBeTruthy();
       ua.conn=ub.conn=null;
       expect(users.getUsers(true)).toEqual([]);
       expect(users.getUsers(false).length).toEqual(2);
    });
    
    it('Remove user',function(){
        users.add(ua).add(ub);
        users.remove(ua);
        expect(users.count).toEqual(1);
        users.remove(ub.id);
        expect(users.count).toEqual(0);
    });
    
});