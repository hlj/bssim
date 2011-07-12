//pads left
String.prototype.lpad = function(padString, length) {
    var str = this;
    while (str.length < length)
        str = padString + str;
    return str;
};
 
//pads right
String.prototype.rpad = function(padString, length) {
	var str = this;
    while (str.length < length)
        str = str + padString;
    return str;
};

Date.prototype.shortDateString = function(){
    return this.getFullYear().toString() +'-' +(this.getMonth()+1).toString().lpad('0',2) + '-' + this.getDate().toString().lpad('0',2);
};

Date.prototype.shortTimeString = function(){
    var s= this.getHours().toString().lpad('0',2)+':'+this.getMinutes().toString().lpad('0',2)+':'+this.getSeconds().toString().lpad('0',2);
    return this.shortDateString()+' '+s;
};