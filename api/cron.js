// api/cron.js

const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

module.exports = async (req, res) => {
  try {
    await bot.sendMessage(
      process.env.CHAT_ID,
      "Good morning ☀️"
    );

    return res.status(200).json({
      success: true,
      message: "Morning message sent"
    });
  } catch (error) {
    console.error("Cron error:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};