const Joi = require("joi");
const ethers = require("ethers");
const { createClient } = require("@supabase/supabase-js"); // https://app.supabase.com/project/uzzryxmrshrgtuyrhosr/api
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

const schema = Joi.object().keys({
  message: Joi.string().required(),
  signature: Joi.string().required(),
});

export default async function handler(req, res) {
  try {
    // check response
    if (req.method !== "POST") return res.status(405).send({ error: "Only POST allowed" });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).send({ error: error.message });
    const { message, signature } = value;
    // check signature
    const [address, timestamp] = message.split("-");
    if (Date.now() > timestamp) return res.status(400).send({ error: "Signature expired" });
    if (address !== ethers.utils.verifyMessage(message, signature)) return res.status(400).send({ error: "Invalid signature" });
    // query database
    const { data } = await supabase.from(process.env.SUPABASE_TABLE).select("key").eq("address", address);
    res.status(200).json({ response: data[0].key });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
}
