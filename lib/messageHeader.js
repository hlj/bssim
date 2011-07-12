var p = new RegExp("^SM:[A-Z_0-9]+::");

var MessageHeader =
    {
        /// <summary>
        /// 系统消息前缀
        /// </summary>
        SYS_MSG_PREFIX : "SM:",
        /// <summary>
        /// 系统消息前缀
        /// </summary>
        SYS_MSG_PATTERN : p,
        /// <summary>
        /// 登录消息 客户端发送时只需提供staff_id,接收到的消息会带ip_addr,staffid[:ipaddress]
        /// </summary>
         SM_LOGIN : "SM:LOGIN::", //staff_id
        /// <summary>
        /// 注销消息 staff_id
        /// </summary>
         SM_LOGOUT : "SM:LOGOUT::", //staff_id
        /// <summary>
        /// 重复登录
        /// </summary>
         SM_DUP_LOGIN : "SM:DUP_LOGIN::",
        /// <summary>
        /// 当前在线用户 staffId1:ipaddress,staffid2:ipaddress...
        /// </summary>
         SM_CURRENT_USERS : "SM:CURRENT_USERS::", //staff_id1,staff_id2,staff_id3...staff_idn
        /// <summary>
        /// 登录失败 message
        /// </summary>
         SM_LOGIN_FAILED : "SM:LOGIN_FAIL::", //message
        /// <summary>
        /// 登录成功
        /// </summary>
         SM_LOGIN_SUCCESS : "SM:LOGIN_SUCC::",
        /// <summary>
        /// 创建会话 staff_id1,staff_id2,staff_id3....staff_idn 
        /// </summary>
         SM_CREATE_SESSION : "SM:CREATE_SESSION::", //senderId,staff_id1,staff_id2,staff_id3....staff_idn 
        /// <summary>
        /// 开始会话 session_id,staff_id1,staff_id2,staff_id3....staff_idn
        /// </summary>
         SM_START_SESSION : "SM:START_SESSION::", //session_id,senderId,staff_id1,staff_id2,staff_id3....staff_idn
        /// <summary>
        /// 退出会话 /staff_id,session_id
        /// </summary>
         SM_EXIT_SESSION : "SM:EXIT_SESSION::", //staff_id,session_id
        /// <summary>
        /// 加入会话 staff_id,session_id
        /// </summary>
         SM_ADDTO_SESSION : "SM:ADDTO_SESSION::", //staff_id,session_id
        /// <summary>
        /// 更新本地JS
        /// </summary>
         SM_UPDATE_JS : "SM:UPDATE_JS::",
        /// <summary>
        /// 更新软件
        /// </summary>
         SM_UPDATE_SOFT : "SM:UPDATE_SOFT::",
        /// <summary>
        /// 广播消息,每送到每一个用户 msg
        /// </summary>
         SM_BROADCAST_MSG : "SM:BROADCAST_MSG::", //msg
        /// <summary>
        /// 服务器发送到客户端的错误信息 msg
        /// </summary>
         SM_SERVER_ERROR : "SM:SERVER_ERROR::", //msg
        /// <summary>
        /// 更新用户信息
        /// </summary>
         SM_UPDATE_USER : "SM:UPDATE_USER::",
        /// <summary>
        /// 发送会话信息
        /// </summary>
         SM_SESSION_INFO : "SM:SESSION_INFO::", //sessionId,staff_id1,staff_id2, or sessionId,null
        /// <summary>
        /// 查询会话信息
        /// </summary>
         SM_QUERY_SESSION_INFO : "SM:QUERY_SESSION_INFO::", //sessionId,request_user_staffid
        /// <summary>
        /// 心跳信号
        /// </summary>
         SM_TICK : "SM:TICK::",
         //获取未读消息
         SM_GET_UNREAD_MSG : "SM:GET_UNREAD_MSG::", // user_id
         //未读消息列表
         SM_UNREAD_MSG: "SM:UNREAD_MSG::",
         //获取消息详情
         SM_GET_MSG_DETAIL: "SM:GET_MESSAGE_DETAIL::", //user_id,session_id
         //消息详情
         SM_MSG_DETAIL: "SM:MESSAGE_DETAIL::",
         //获取系统消息
         SM_GET_SYS_MSG : "SM:GET_SYS_MSG::", //msg_id
         //发送系统消息
         SM_SEND_SYS_MSG : "SM:SEND_SYS_MSG::", //msg
         //删除所有未读消息
         SM_DELETE_ALL_MSG : "SM:DELETE_ALL_MSG::", //user_id
         //获取服务器状态
         SM_GET_SERVER_STATUS : "SM:GET_SERVER_STATUS::",
        /// <summary>
        /// 用户消息头
        /// </summary>
         USER_MSG_PREFIX : "USER_MSG::"
    };
    
module.exports = MessageHeader;