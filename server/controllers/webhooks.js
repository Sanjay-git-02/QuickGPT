import Stripe from "stripe";
import Transaction from "../models/transaction.js";
import userModel from "../models/user.js";


export const stripeWebHooks = async(request,response) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const sig = request.headers["stripe-signature"]

    let event;

    try {
        event = stripe.webhooks.constructEvent(request.body,sig,process.env.STRIPE_WEBHOOK_SECRET_KEY)
    } catch (error) {
        return response.json({success:false,message:`Webhook error: ${error.message}`})
    }

    try {
        switch (event.type) {
            case "payment_intent.succeeded":
                const paymentIntent = event.data.object

                const sessionList = stripe.checkout.sessions.list({
                    payment_intent : paymentIntent.id
                })

                const session = sessionList.data[0]
                const {transactionId,appId} = session.metadata

                if(appId === "quickgpt"){
                    const transaction = await Transaction.findOne({_id:transactionId,isPaid:false})

                    await userModel.updateOne({_id:transactionId},{$inc:{credits:transaction.credits}})

                        transaction.isPaid = true;
                        await transaction.save();
                }else{
                    return response.json({received:true,message:"Ignored event:Invalid app"})
                }
                break;
        
            default:
                console.log("Unhandled event type:",event.type)
                break;
        }
        return response.json({received:true})
    } catch (error) {
        console.error("Webhook processsing error:",error)
        return response.status(500).send("Internal Server Error")
    }
}

