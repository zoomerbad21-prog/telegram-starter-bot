import { InlineKeyboard } from "grammy"

const pending = new Map()
const cooldown = new Map()

const menu = new InlineKeyboard()
  .text("🔎 Проверить username", "search_info")
  .row()
  .text("📖 Помощь", "help")

export function registerCommands(bot) {
  bot.command("start", async (ctx) => {
    await ctx.reply(
      `Привет, ${ctx.from.first_name}!

Добро пожаловать в OSINT Bot.

Выбери нужный раздел ниже.`,
      { reply_markup: menu }
    )
  })

  bot.command("help", async (ctx) => {
    await ctx.reply(
      "Команды:\n\n" +
      "/start — главное меню\n" +
      "/help — помощь\n" +
      "/search username — проверка собственного никнейма\n" +
      "/cancel — отмена поиска"
    )
  })

  bot.command("search", async (ctx) => {
    const username = ctx.match.trim().replace(/^@/, "")

    if (!/^[a-zA-Z0-9_.-]{1,30}$/.test(username)) {
      return ctx.reply("Используй: /search username")
    }

    pending.set(ctx.from.id, username)

    const keyboard = new InlineKeyboard()
      .text("✅ Это мой username", "confirm_search")
      .text("❌ Отмена", "cancel_search")

    await ctx.reply(
      `Проверяемый ник: @${username}\n\n` +
      "Подтверди, что это твой собственный публичный никнейм.",
      { reply_markup: keyboard }
    )
  })

  bot.command("cancel", async (ctx) => {
    pending.delete(ctx.from.id)
    await ctx.reply("Запрос отменён.")
  })

  bot.callbackQuery("search_info", async (ctx) => {
    await ctx.answerCallbackQuery()
    await ctx.reply("Введи свой никнейм:\n/search username")
  })

  bot.callbackQuery("help", async (ctx) => {
    await ctx.answerCallbackQuery()
    await ctx.reply("Используй /search username для проверки своего публичного никнейма.")
  })

  bot.callbackQuery("cancel_search", async (ctx) => {
    pending.delete(ctx.from.id)
    await ctx.answerCallbackQuery()
    await ctx.editMessageText("Поиск отменён.")
  })

  bot.callbackQuery("confirm_search", async (ctx) => {
    await ctx.answerCallbackQuery()

    const id = ctx.from.id
    const username = pending.get(id)

    if (!username) {
      return ctx.reply("Запрос устарел. Начни заново.")
    }

    const now = Date.now()
    if (now - (cooldown.get(id) || 0) < 30000) {
      return ctx.reply("Подожди 30 секунд перед следующим запросом.")
    }

    pending.delete(id)
    cooldown.set(id, now)

    const sites = [
      ["GitHub", `https://github.com/${username}`],
      ["Reddit", `https://www.reddit.com/user/${username}/`],
      ["Instagram", `https://www.instagram.com/${username}/`],
      ["TikTok", `https://www.tiktok.com/@${username}`],
      ["X", `https://x.com/${username}`],
      ["Twitch", `https://www.twitch.tv/${username}`],
      ["Pinterest", `https://www.pinterest.com/${username}/`]
    ]

    const result = sites
      .map(([name, url]) => `${name}: ${url}`)
      .join("\n\n")

    await ctx.reply(
      `Публичные страницы для @${username}:\n\n${result}\n\n` +
      "Внимание: это адреса возможных профилей, а не подтверждённые совпадения. " +
      "Проверяй принадлежность аккаунтов самостоятельно."
    )
  })

  bot.command("ping", (ctx) => ctx.reply("Бот работает!"))

  bot.command("id", (ctx) =>
    ctx.reply(`Твой ID: ${ctx.from.id}`)
  )
  }// Your bot's behaviour. Add commands here; grammY's docs (grammy.dev) cover
// keyboards, sessions, files, inline queries and everything else.

