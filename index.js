import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";

const app = express();
app.use(bodyParser.json());

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// 🔥 SAFE MOCK AI (no external API calls)
async function getAIResponse(message) {
  return "Thanks for reaching out! What type of roofing issue are you dealing with?";
}

// In-memory leads
let leads = [];

// Lead intake
app.post("/lead", async (req, res) => {
  try {
    const { phone, name, message } = req.body;
    const leadId = leads.length;

    leads.push({ phone, name, message });

    const aiMessage = await getAIResponse(message);

    await client.messages.create({
      body: aiMessage,
      from: process.env.TWILIO_PHONE,
      to: phone
    });

    res.json({ status: "ok", leadId });
  } catch (err) {
    console.error("Error in /lead:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Incoming SMS webhook
app.post("/sms", async (req, res) => {
  try {
    const from = req.body.From;
    const body = req.body.Body;

    const aiMessage = await getAIResponse(body);

    await client.messages.create({
      body: aiMessage,
      from: process.env.TWILIO_PHONE,
      to: from
    });

    res.send("<Response></Response>");
  } catch (err) {
    console.error("Error in /sms:", err.message);
    res.status(200).send("<Response></Response>");
  }
});

app.listen(process.env.PORT || 10000, () => {
  console.log("🚀 PrimusInsights running");
});
