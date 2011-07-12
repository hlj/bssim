
if (!global.logger) {
    var logger = require('node-logger').createLogger('./logs/server.log'); 
    logger.stackTraceFilter = 'bssim';
    logger.errorToUser = function(errMsg,user) {
        this.error(errMsg);
        if (user && user.send){
            user.send(errMsg);
        }
    };
    global.logger = logger;
}