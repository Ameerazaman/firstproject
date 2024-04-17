const mongoose = require('mongoose');


const referofferSchema = new mongoose.Schema({
 
   
    amount:{
        type:Number
    },
    userId:{
        type:String
    },
    orderId:{
        type:String
    },
    date: {
        type: String,
        default: function () {
            return new Date().toDateString()
        }
    }, 
    status:{    
        type:String,
        
    },
 

});

const referoffer= mongoose.model('referoffer', referofferSchema);

module.exports = referoffer;