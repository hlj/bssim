describe('Data parser',function(){
    var DataParser = require('../lib/dataParser').DataParser;
    var parser = null;
    
    beforeEach(function(){
        parser = new DataParser();
    });
    
    it('Parse a whole message',function(){
        var m='[[len=10]]bcdefghijk';
        parser.append(m);
        expect(parser.buffer.length).toEqual(0);
        expect(parser.datas.length).toEqual(1);
        expect(parser.nextData()).toEqual('bcdefghijk');
        expect(parser.datas.length).toEqual(0);
        expect(parser.nextData()).toEqual(null);
    });
    
    it('Parse multi messages',function(){
        var m='[[len=10]]bcdefghijk[[len=5]]12345[[len=7]]2233445';
        parser.append(m);
        expect(parser.buffer.length).toEqual(0);
        expect(parser.datas.length).toEqual(3);
        expect(parser.nextData()).toEqual('bcdefghijk');
        expect(parser.nextData()).toEqual('12345');
        expect(parser.nextData()).toEqual('2233445');
        expect(parser.datas.length).toEqual(0);
        expect(parser.nextData()).toEqual(null);
    });
    
    it('Parse data fragments',function(){
        parser.append('[[len=12]]123456');
        expect(parser.datas.length).toEqual(0);
        parser.append('123456');
        expect(parser.datas.length).toEqual(1);
        expect(parser.nextData()).toEqual('123456123456');
        //header is splitted
        parser.append('[[len=12]');
        parser.append(']123456');
        expect(parser.datas.length).toEqual(0);
        parser.append('123456[[len=7');
        expect(parser.datas.length).toEqual(1);
        parser.append(']]1234567');
        expect(parser.datas.length).toEqual(2);
        expect(parser.nextData()).toEqual('123456123456');
        expect(parser.nextData()).toEqual('1234567');
        expect(parser.datas.length).toEqual(0);
    });
    
    
    it('Parse invalid datas',function(){
         parser.append('[[len=5]]12345678');
         parser.append('[[len=s]]222[[len=4]]1234');
         parser.append('[[len=1]2[[len=2]]18');
         expect(parser.buffer.length).toEqual(0);
         expect(parser.datas.length).toEqual(3);
         expect(parser.nextData()).toEqual('12345');
         expect(parser.nextData()).toEqual('1234');
         expect(parser.nextData()).toEqual('18');
         parser.append('[[len=12]]1[[len=2]]22');
         expect(parser.buffer.length).toEqual(0);
         expect(parser.datas.length).toEqual(1);
         expect(parser.nextData()).toEqual('1[[len=2]]22');
    });
});