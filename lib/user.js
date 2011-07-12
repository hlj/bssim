require('./ext/array');
var uuid = require('node-uuid');
var netHelper = require('./netHelper');
var net = require('net');
/*
 User Class. Indicate a remote user with the id and connection.
*/
function User (id,connection){
    var _id=id;
    var _conn=!!connection ? connection : null;
    if (_conn) {
        _conn.id = uuid();
    }
    
    //Get the online state based on the "conn" value
    this.__defineGetter__("online",function(){
        return !!_conn;
    });
    
    //ID is readonly
    this.__defineGetter__("id",function(){return _id;});
    this.__defineSetter__("id",function(val){throw "Err: can't change user's id ("+_id+"->"+val+")";});
    
    //IP
    this.__defineGetter__("ip",function(){return (!!_conn ? _conn.remoteAddress : null);});
    this.__defineSetter__("ip",function(val){throw "Err: can't change user's ip to " +val;});
    
    //connecton
    this.__defineGetter__("conn",function(){return _conn;});
    this.__defineSetter__("conn",function(val){
        var oldc = _conn;
        if (_conn) {
            _conn.dataParser.buffer='';
            _conn.dataParser.datas=[];
            _conn.dataParser = null;
        }
        if (!val) {
            _conn = null;
        } else {
            _conn = val;
        }
        
        if (_conn && !_conn.id) {
           _conn.id=uuid();
        } else if (_conn === null && oldc !==null) {
            //global.logger.info('disconnection:' + oldc.remoteAddress);
        }
    });
}

//sender a message to remote user.
User.prototype.send = function(message){
    if (this.conn !== null) {
      //  global.logger.debug('send:'+this.id+','+message.substr(0,200));
        this.conn.write(netHelper.getNetString(message),'ascii');
    }
};

//sender a message to remote user and close the connection
User.prototype.end = function(message){
    if (this.conn !== null) {
      //  global.logger.debug('end:'+this.id+','+message.substr(0,200));
        this.conn.end(netHelper.getNetString(message),'ascii');
    }
};


module.exports = {"User" : User};