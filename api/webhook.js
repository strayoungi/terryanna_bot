const TelegramBot = require("node-telegram-bot-api")
const getRawBody = require("raw-body")
const { createClient } = require("@supabase/supabase-js")

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ADMIN_ID = 8764534391 // ganti dengan telegram ID kamu

module.exports = async (req, res) => {
  if (req.method === "GET") {
    return res.status(200).send("Telegram bot is running");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const rawBody = await getRawBody(req)
    const update = JSON.parse(rawBody.toString())

    if (!update.message) {
      return res.status(200).send("OK");
    }

    const chatId = update.message.chat.id;
    const text = update.message.text || "";
    const username =
      update.message.from.first_name || update.message.from.username || "User";

    if (text === "/start") {
      await bot.sendMessage(
        chatId,
        `Halo ${username}! dengan chat id ${chatId}!👋\nBot berhasil dijalankan.`
      );
    }

    if (text.startsWith("/notes")) {
      // Handle notes command
      const parts = update.message.text.split(" ")
      const message = parts.slice(1).join(" ")
      await bot.sendMessage(
        chatId,
        `Catatan disimpan disimpan ✅\n "${message}"`
      )
    }

    return res.status(200).send("OK");

  } catch (error) {
    console.error("Webhook error:", error);

    return res.status(500).send("Internal Server Error");
  }
};