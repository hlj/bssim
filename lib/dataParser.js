require('./ext/array');
/*
DataParser class.
Parse incoming data,extract to  real message
*/
var messageHeadPattern = new RegExp('\\[\\[len=(\\d+)\\]\\]');

function DataParser() {
    this.buffer='';
    this.datas=[];
    var _datalen = 0;
    this.needParse = false;
          
    //parse the buffer,extract whole data
    this.extract = function(){
        //reset needParse
        this.needParse = false;
        //if buffer shorter than datalen,return
        if (this.buffer.length === 0) return;
        if (_datalen > 0 && this.buffer.length < _datalen) return;
        // if datalen >0 and buffer > datalen,get a data then set needParse=true
        if (_datalen > 0){
            this.datas.push(this.buffer.slice(0,_datalen));
            this.buffer = this.buffer.slice(_datalen);
            _datalen = 0;
            if (this.buffer.length >0 ) {
                this.needParse = true;
            }
        } else {   //Is new data
            var m = messageHeadPattern.exec(this.buffer);
            if (m) {
                _datalen = parseInt(m[1],0);
                if (isNaN(_datalen)) _datalen = 0;
                //drop the data from 0 to first header position,these are invaild
                this.buffer = this.buffer.slice(m.index+m[0].length);
                this.needParse = true;
            }
        }
    };
  
}

//append a data string and extract new message
DataParser.prototype.append = function(str){

    if (typeof(str) === 'string'){
        this.buffer += str;
        this.needParse = true;
        while (this.needParse) {
            this.extract();
        }
    }
};

DataParser.prototype.nextData = function(){
    if (this.datas.length > 0) {
        return this.datas.shift();
    } else {
        return null;
    }
};



module.exports = {"DataParser":DataParser};