require('./ext/array');
/*
User list class. Manage all users.
*/

var User = require('./user').User;

function Users(){
    this.list=[];
    this.__defineGetter__('count',function(){
        return this.list.length;
    });
}

Users.prototype.add = function(user){
    this.list.add(user,User,true,'id');
    return this;
};

Users.prototype.find = function(userId){
    return this.list.find('id',userId);
};

Users.prototype.findByConn = function(conn){
    for (var i=this.list.length-1;i>=0;i--) {
        var c = this.list[i].conn;
        if (c && c.id && c.id === conn.id) {
            return this.list[i];
        }
    }
    return null;
};

//get all users,if assign isOnline parameter then return  users based on online state.
Users.prototype.getUsers = function(isOnline){
    if (typeof(isOnline) === "undefined") 
        return this.list;
        
    return this.list.findAll('online',isOnline);
};

//Remove a user, use the user object or user id string
Users.prototype.remove = function(user){
    if (user instanceof User){
        this.list.remove(user);
    } else {
        var u = this.list.find('id',user);
        if (u) this.list.remove(u);
    }
    return this;
};

//return all user's id as an array
Users.prototype.getUserIds = function(){
  return this.list.map(function(v,i,a) {return v.id;});  
};


module.exports = {'Users':Users};