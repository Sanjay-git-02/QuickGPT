import chatModel from "../models/chat.js"

export const createChat = async(req,res)=>{
    try {
       const userId = req.user._id 
       const chatData = {
        userId,
        messages:[],
        name:"New Chat",
        userName:req.user.name,
        
       }
        await chatModel.create(chatData)
        res.json({success:true,message:"Chat Created"})
    } catch (error) {
        return res.json({success:false,message:error.message})
    }
}

export const getChats = async(req,res)=>{
    try {
        const userId = req.user._id
        const chats = await chatModel.find({userId}).sort({updatedAt:-1})
        res.json({success:true,chats})
    } catch (error) {
        return res.json({success:false,message:error.message})
    }
}

export const deleteChat = async(req,res)=>{
    try{
        const userId = req.user._id
        const {chatId} = req.body

        await chatModel.deleteOne({_id:chatId,userId})
        res.json({success:true,message:"Chat Deleted"})
    }catch (error) {
        return res.json({success:false,message:error.message})
    }
}