describe("User class",function(){
    var User = require('../lib/user').User;
    var ConnMock = require('./mock/connection.mock').Connection;
    var conn=null,ua = null;
    
    beforeEach(function(){
        conn = new ConnMock("1.1.1.1");
        ua = new User("1",conn);
    });
    
    it("Create a user with id and connection",function(){
        expect(ua.id).toEqual("1");
        expect(ua.conn).toEqual(conn);
        expect(ua.ip).toEqual("1.1.1.1");
        expect(ua.conn.id.length).toBeGreaterThan(0);
    });
    
    it("switch on online/offline state",function(){
        expect(ua.online).toBeTruthy();
        ua.conn=null;
        expect(ua.online).toBeFalsy();
    });
    
    it("Can't change user's id",function(){
        expect(function(){ua.id="2";}).toThrow("Err: can't change user's id (1->2)");
    });
    
    it("Can't change user's ip",function(){
        expect(function(){ua.ip="x";}).toThrow("Err: can't change user's ip to x");
    });
    
    it('should ignore at send message to offline user',function(){
        ua.conn=null;
        ua.send('xxx');
    });
    
});