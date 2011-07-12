/*
Session list class. Manage all sessions.
*/
require('./ext/array');

var Session = require('./session').Session;

function Sessions(){
    var _sweepCycle = 300000;
    var _sweepId = null;
    this.list=[];
    this.__defineGetter__('count',function(){
        return this.list.length;
    });
    
    this.__defineGetter__('sweepCycle',function(){
        return _sweepCycle;
    });
    this.__defineSetter__('sweepCycle',function(val){
        if(typeof(val) != 'number') return;
        
        _sweepCycle = val;
        if (_sweepId) {
            clearTimeout(_sweepId);
            setTimeout(this.sweep,_sweepCycle,this);
        }
    });
    
    this.sweep = function(self){
        self.list = self.list.filter(function(v,i,a){
            return v.state==='active';
        });
  
        _sweepId = setTimeout(self.sweep,_sweepCycle,self);
    };
    
   _sweepId = setTimeout(this.sweep,_sweepCycle,this);
}

Sessions.prototype.add = function(session){
    this.list.add(session,Session,true,'id');
    return this;
};

Sessions.prototype.find = function(sessionId){
    return this.list.find('id',sessionId);
};

Sessions.prototype.findByUserId = function(userId){
    return this.list.filter(function(v,i,a){
        return v.hasUser(userId);
    });
};

//Remove a session, use the session object or session id 
Sessions.prototype.remove = function(session){
    if (session instanceof Session){
        this.list.remove(session);
    } else {
        var s = this.list.find('id',session);
        if (s) this.list.remove(s);
    }
    return this;
};


module.exports = {'Sessions':Sessions};