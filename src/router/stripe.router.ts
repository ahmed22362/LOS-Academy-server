import { Router } from "express"
import { webhook } from "../controller/stripeWebhook.controller"
import bodyParser from "body-parser"
import express from "express"
import Stripe from "stripe"
import { stripe } from "../service/stripe.service"
import dotenv from "dotenv"
dotenv.config()
const stripeRouter = Router()

stripeRouter.post("/webhook", webhook)
export default stripeRouter
