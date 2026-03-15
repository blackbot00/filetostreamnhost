const { Telegraf } = require('telegraf');
const axios = require('axios');
const FormData = require('form-data');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply("📤 *Welcome to File2Link Bot!*\n\nJust send me any *Photo, Video or Document*, and I will generate a direct download/stream link for you.", { parse_mode: 'Markdown' });
});

bot.on(['photo', 'document', 'video', 'audio'], async (ctx) => {
  try {
    ctx.reply("⏳ _Processing your file... Please wait._", { parse_mode: 'Markdown' });

    // 1. Get File ID
    let fileId;
    if (ctx.message.photo) fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    else if (ctx.message.document) fileId = ctx.message.document.file_id;
    else if (ctx.message.video) fileId = ctx.message.video.file_id;
    else if (ctx.message.audio) fileId = ctx.message.audio.file_id;

    // 2. Get File Link from Telegram Server
    const fileUrl = await ctx.telegram.getFileLink(fileId);

    // 3. Download from Telegram and Upload to Catbox.moe
    const response = await axios.get(fileUrl.href, { responseType: 'stream' });
    
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', response.data);

    const uploadRes = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders()
    });

    const directLink = uploadRes.data;

    // 4. Send the result
    ctx.reply(`✅ *File Uploaded Successfully!*\n\n🔗 *Link:* ${directLink}\n\n_You can use this link to stream or download anywhere!_`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: "🌐 Open Link", url: directLink }]]
      }
    });

  } catch (error) {
    console.error(error);
    ctx.reply("⚠️ *Error:* Something went wrong during upload. Make sure the file size is under 200MB.");
  }
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (err) {
      res.status(200).send('OK');
    }
  } else {
    res.status(200).send('File2Link Bot is Active!');
  }
};
