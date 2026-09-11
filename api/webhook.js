const TelegramBot = require("node-telegram-bot-api")
const getRawBody = require("raw-body")

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)

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
        `Halo ${username}! 👋\nBot berhasil dijalankan.`
      );
    }

    return res.status(200).send("OK");

  } catch (error) {
    console.error("Webhook error:", error);

    return res.status(500).send("Internal Server Error");
  }
};