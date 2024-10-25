require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

app.post("/pay", async (req, res) => {
  try {
    const amount = 1000; // lowest denomination
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "inr",
      payment_method_types: ["card"],
      metadata: {
        name: "value",
      },
    });
    const clientSecret = paymentIntent.client_secret;
    res.json({ clientSecret, message: "Payment Initiated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/subscribe", async (req, res) => {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: "stripe_customer_id",
      items: [
        {
          price: "stripe_subscription_price_id",
        },
      ],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    });

    res.send({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err });
  }
});

app.post("/stripe", (req, res) => {
  if (req.body.type === "payment_intent.created") {
    console.log(`${req.body.data.object.metadata.name} initated payment!`);
  }
  if (req.body.type === "payment_intent.succeeded") {
    console.log(`${req.body.data.object.metadata.name} succeeded payment!`);
  }
});

app.listen(4000, () => console.log(`Server running on port 4000`));
