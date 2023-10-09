import dotenv from 'dotenv'
dotenv.config();
import stripePackage from 'stripe';

const stripe = stripePackage(process.env.STRIPE_SECRET_KEY);

export default stripe;