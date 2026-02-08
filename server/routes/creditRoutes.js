import express from 'express'
import { getPlans, purchasePlan, simulatePurchase, completePurchase } from '../controllers/creditController.js'
import { protect } from '../middlewares/auth.js'


const creditRouter = express.Router()

creditRouter.get("/plan",getPlans)
creditRouter.post("/purchase",protect,purchasePlan)
creditRouter.get('/complete', protect, completePurchase)
// Dev-only: simulate a purchase and directly credit the user (no Stripe)
creditRouter.post("/simulate", protect, simulatePurchase)

export default creditRouter;