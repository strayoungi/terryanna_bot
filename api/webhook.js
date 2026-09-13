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

    if (update.callback_query) {
      const callbackQuery = update.callback_query
      const chatId = callbackQuery.message?.chat?.id
      const data = callbackQuery.data

      if (chatId && data === "gift1") {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Yeay, hadiahnya datang! 🎁"
        })

        const giftUrl = "https://puzzel.org/en/jigsaw/play?p=-P1QEuefMOmv0mT4gSBx"

        await bot.sendMessage(
          chatId,
          `Sweet surprise dari Aleyna💌\n\nKlik link ini ya:\n${giftUrl}`
        )
      }

      return res.status(200).send("OK");
    }

    if (!update.message) {
      return res.status(200).send("OK");
    }

    const chatId = update.message.chat.id;
    const text = update.message.text || "";
    const username =
      update.message.from.first_name || update.message.from.username || "User";

    if (text === "/start") {
        await supabase.from("users").upsert({
            chat_id: chatId,
            username: username || null
        });

      await bot.sendMessage(
        chatId,
        `Halo ${username}!👋\nCari apa nih disini?`,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "Gift dari Aleyna", callback_data: "gift1" }
                    ]
                ]
            }
        }
      );
    }

    if (text.startsWith("/notes")) {
      // Handle notes command
      const parts = update.message.text.split(" ")
      const message = parts.slice(1).join(" ")

      await supabase.from("notes").insert({
        chat_id: chatId,
        notes: message
      })

      await bot.sendMessage(
        chatId,
        `Catatan disimpan disimpan ✅\n "${message}"`
      )
    }

    if (text.startsWith("/counter")) {
        const parts = text.split(" ");
        const dateInput = parts[1];

        if (!dateInput) {
            await bot.sendMessage(
                chatId,
                "Format: /counter YYYY-MM-DD"
            );
            return;
        }

        const startDate = new Date(`${dateInput}T00:00:00+07:00`);
        const now = new Date();

        if (isNaN(startDate.getTime())) {
            await bot.sendMessage(chatId, "Tanggal tidak valid.");
            return;
        }

        const diffMs = now.getTime() - startDate.getTime();

        const diffDays = Math.floor(
            diffMs / (1000 * 60 * 60 * 24)
        );

        await bot.sendMessage(
            chatId,
            `Sudah ${diffDays} hari sejak ${dateInput}.`
        );
    }

    if (text.startsWith("/remind")) {
        const parts = text.split(" ");

        const duration = parts[1]; // 7d
        const dateInput = parts[2]; // 2026-09-09

        if (!duration || !dateInput) {
            await bot.sendMessage(
                chatId,
                "Format: /remind 7d YYYY-MM-DD"
            );
            return;
        }

        const match = duration.match(/^(\d+)d$/);

        if (!match) {
            await bot.sendMessage(
                chatId,
                "Format durasi harus seperti 7d, 14d, 30d."
            );
            return;
        }

        const days = parseInt(match[1]);

        const baseDate = new Date(`${dateInput}T19:00:00+07:00`);

        if (isNaN(baseDate.getTime())) {
            await bot.sendMessage(
                chatId,
                "Tanggal tidak valid."
            );
            return;
        }

        const remindDate = new Date(baseDate);

        remindDate.setDate(
            remindDate.getDate() + days
        );

        const { error } = await supabase
            .from("reminders")
            .insert({
                chat_id: chatId,
                message: `${days} hari sudah berlalu sejak ${dateInput}!`,
                remind_at: remindDate.toISOString(),
                sent: false
            });

        if (error) {
            console.error(error);

            await bot.sendMessage(
                chatId,
                "Gagal membuat reminder."
            );

            return;
        }

        await bot.sendMessage(
                chatId,
                `Reminder dibuat ✅\n\n${days} hari dari ${dateInput} jatuh pada ${remindDate.toLocaleDateString("id-ID", {
                timeZone: "Asia/Jakarta"
            })}.`
        );
    }

    if (text === "/mynotes") {
        const { data: notes, error } = await supabase
            .from("notes")
            .select("notes, created_at")
            .eq("chat_id", chatId)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Supabase mynotes error:", error)

            await bot.sendMessage(
            chatId,
            `Gagal mengambil catatan ❌\n${error.message}`
            )
            return
        }

        if (!notes || notes.length === 0) {
            await bot.sendMessage(
            chatId,
            "Kamu belum punya catatan."
            )
            return
        }

        const notesText = notes
            .map((note, index) => {
            return `${index + 1}. ${note.notes}`
            })
            .join("\n")

        await bot.sendMessage(
            chatId,
            `📝 Catatan kamu:\n\n${notesText}`
        )
    }

    return res.status(200).send("OK");

  } catch (error) {
    console.error("Webhook error:", error);

    return res.status(500).send("Internal Server Error");
  }
};