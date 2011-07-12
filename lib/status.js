function getStatus() {
   var m ='';
   var onlineUsers = global.users.getUsers(true);
   m += 'allUsers:'+global.users.count + ';onlineUsers:'+onlineUsers.length + 
      ';allSessions:'+global.sessions.count +';activeSessions:'+global.sessions.list.filter(function(v,i,a){return v.state==='active';}).length + ';';
   var mem = process.memoryUsage();
   m += 'memory:'+Math.floor(mem.rss/1024/1024) +'M;' + 'vsize:'+Math.floor(mem.vsize/1024/1024) +'M;heap:' + Math.floor(mem.heapTotal/1024/1024)+'M';
   var datalen = 0;
   onlineUsers.forEach(function(v,i,a){
       if (v.conn) datalen += v.conn.dataParser.buffer.length;
   });
   m += ';dataBuffer:'+datalen;
   return m;
}

module.exports={'getStatus':getStatus};