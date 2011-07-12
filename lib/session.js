require('./ext/array');
/*
Session Class. Indicate a chat session for multi users.
*/
var User=require('./user').User;
var Users = require('./users').Users;

function Session(id){
    this.id = id;
    this.users=new Users();
    
    //Get state based on user's state
    this.__defineGetter__("state",function(){
        var state='active';
        if (this.users.count===0 || !this.users.list.find('online',true)){ 
            state = 'closed';
        } 
        return state;
    });  
}

//Add a user
Session.prototype.addUser = function(user){
    this.users.add(user);
    return this;
};

//Remove a user, use the user object or user id string
Session.prototype.removeUser = function(user){
    this.users.remove(user);
    return this;
};

//If the user id in the session users list
Session.prototype.hasUser = function(userId){
    return !!this.users.find(userId);
};
 
module.exports = {"Session": Session};
