//add element to array.
//element can be a object or an array, "type" is datatype name to restrict the element type. 
//if "unique" is true then only unique element to be add in.
//if "unique" is true,"unique-key" to indicate which the property used to determine whether the element is  repeated
//if "unique_key" not assign,use the whole element object.
Array.prototype.add = function(e,type,unique,unique_key){
    if (!e) return;
    
    if (e.constructor==Array){
        var self=this;
        e.forEach(function(v,i,a){
            if (!type || (v instanceof type)){
                if (!unique) {
                    self.push(v);
                } else if ((!unique_key && !self.exists(v)) || (unique_key && !self.exists(unique_key,v[unique_key]))) {
                    self.push(v);
                }
                   
            }
        });
    } else {
        if (!type || (e instanceof type)){
            if (!unique) {
                this.push(e);
            } else if ((!unique_key && !this.exists(e)) || (unique_key && !this.exists(unique_key,e[unique_key]))){
                this.push(e);
            }
        }
    }
};

//remove element
Array.prototype.remove = function(e){
    var i = this.indexOf(e);
    if (i>-1) {
        this.splice(i,1);
    }
};

//find first matched element
//params: 
//  property : elements's property name,if value is not assigned,the property will treat as whole element
//  value : value of the  property
Array.prototype.find = function(property,value){
    if (!property) return null;
    
    var r = null;
     if (typeof(value) == "undefined") {
        this.some(function(val,idx,array){
            if (val === property) {
                r = val;
                return true;
            }
        });
     } else {
        this.some(function(val,idx,array){
            if (typeof(val[property]) != 'undefined' && val[property]===value){ 
                r = val;
                return true;
            }
        });
     }
     
    return r;
};

//find all matched element
//params: 
//  property :  elements's property name,if value is not assigned,the property will treat as whole element
//  value : value of the  property
Array.prototype.findAll = function(property,value){
    if (!property) return [];

    return this.filter(function(val,idx,array){
        return (typeof(val[property]) != 'undefined' && val[property]===value);
        
    });
    
};


//element if exists in the array
//params: 
//  property : elements's property name
//  value : value of the  property
Array.prototype.exists = function(property,value){
    return !!this.find(property,value);
};

//clear array
Array.prototype.clear = function(){
    this.length=0;
};



