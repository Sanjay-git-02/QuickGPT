import mongoose from 'mongoose'

const chatSchema = new mongoose.Schema({
    userId : {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    userName:{type:String,required:true},
    name:{type:String,required:true},
    messages:[
        {
            isImage:{type:Boolean,required:true},
            isPublished:{type:Boolean,required:true,default:false},
            role:{type:String,required:true},
            content:{type:String,required:true},
            timestamp:{type:Number,required:true}
        }
    ]
},{timestamps:true})

const chatModel = mongoose.model('Chat',chatSchema)

export default chatModel;