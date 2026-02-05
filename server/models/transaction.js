import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    userId:{type:mongoose.SchemaTypes.ObjectId,ref:"User",required:true},
    planId:{type:String,required:true},
    amount:{type:Number,required:true},
    credits:{type:Number,required:true},
    isPaid:{type:Boolean,default:false}
},{timestamps:true})

const Transaction = mongoose.model('Transaction',transactionSchema)

export default Transaction;