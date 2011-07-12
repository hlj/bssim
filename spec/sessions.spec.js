describe('Session list',function(){
    var Sessions = require('../lib/sessions').Sessions;
    var User = require('../lib/user').User;
    var Session = require('../lib/session').Session;
    var ConnMock = require('./mock/connection.mock').Connection;
    var sessions=null,ua=null,ub=null,uc=null,sa=null,sb=null;
    
    beforeEach(function(){
        sessions = new Sessions();
        ua = new User('a',new ConnMock('1'));
        ub = new User('b',new ConnMock('1'));
        uc = new User('c');
        sa = new Session('sa');
        sb = new Session('sb');
        sa.addUser([ua,ub]);
        sb.addUser([ua,ub,uc]);
    });
    
    
    it('Add  session',function(){
        sessions.add(sa);
        expect(sessions.count).toEqual(1);
        sessions.add(sb);
        expect(sessions.count).toEqual(2);
    });
    
    it('Add invalid session',function(){
        sessions.add("a invalid session");
        expect(sessions.count).toEqual(0);
    });
    
    it('Add reduplicate session',function(){
        sessions.add(sa).add(sa);
        expect(sessions.count).toEqual(1);
        var sc = new Session('sa');
        sessions.add(sc);
        expect(sessions.count).toEqual(1);
    });
    
    
    it('Find session',function(){
        sessions.add(sa).add(sb);
        expect(sessions.find(sa.id)).toEqual(sa);
        var ss = sessions.findByUserId(ua.id);
        expect(ss.length).toEqual(2);
        ss = sessions.findByUserId(uc.id);
        expect(ss.length).toEqual(1);
        expect(ss[0]).toEqual(sb);
    });
    
    
    it('remove session',function(){
        sessions.add([sa,sb]);
        expect(sessions.count).toEqual(2);
        sessions.remove(sa);
        expect(sessions.count).toEqual(1);
        sessions.remove(sb.id);
        expect(sessions.count).toEqual(0);
    });
    
    
    it('clean up closed session',function(){
        runs(function(){
            sessions.add([sa,sb]); 
            sessions.sweepCycle = 500;
            ua.conn=ub.conn=null;
            uc.conn=new ConnMock('1');
        });
        waits(600);
        runs(function(){
            expect(sessions.count).toEqual(1);
            expect(sessions.find(sa.id)).toEqual(null);
            sessions.sweepCycle=300;
            sessions.add(sa);
        });
        waits(200);
        runs(function(){
            expect(sessions.count).toEqual(2);
            expect(sessions.find(sa.id)).toEqual(sa);
            uc.conn=null;
        });
        waits(200);
        runs(function(){
            expect(sessions.count).toEqual(0);
        });
        
        
    });
    
    
    
});