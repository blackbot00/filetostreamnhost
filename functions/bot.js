const { Telegraf } = require('telegraf');
const axios = require('axios');
const FormData = require('form-data');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply("🚀 *Fast File Downloader Bot*\n\nSend any file, and I will give you a direct download link.", { parse_mode: 'Markdown' });
});

bot.on(['photo', 'document', 'video', 'audio'], async (ctx) => {
  let statusMsg;
  try {
    statusMsg = await ctx.reply("📥 *Getting file info...*", { parse_mode: 'Markdown' });

    // 1. Get File ID
    let fileId, fileName = "file";
    if (ctx.message.photo) {
      fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      fileName = "image.jpg";
    } else if (ctx.message.document) {
      fileId = ctx.message.document.file_id;
      fileName = ctx.message.document.file_name;
    } else if (ctx.message.video) {
      fileId = ctx.message.video.file_id;
      fileName = "video.mp4";
    } else if (ctx.message.audio) {
      fileId = ctx.message.audio.file_id;
      fileName = "audio.mp3";
    }

    // 2. Get Telegram Direct Link
    const fileUrl = await ctx.telegram.getFileLink(fileId);

    await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, "⚡ *Generating Download Link...*");

    // 3. Upload to Catbox (Optimized)
    const fileStream = await axios.get(fileUrl.href, { responseType: 'stream' });
    
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', fileStream.data, { filename: fileName });

    const uploadRes = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders(),
      timeout: 300000 // 5 mins timeout
    });

    const finalLink = uploadRes.data;

    // 4. Send Result
    await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, 
      `✅ *File Ready to Download!*\n\n📁 *Name:* \`${fileName}\` \n🔗 *Link:* ${finalLink}\n\n_Click the link to save it directly to your mobile._`, 
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: "📥 Download File", url: finalLink }]]
        }
      }
    );

  } catch (error) {
    console.error("Error Detail:", error.message);
    if (statusMsg) {
      ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, "❌ *Upload Failed!* \nMaybe the file is too large or server is slow.");
    }
  }
});

// Nhost Export
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (err) {
      res.status(200).send('OK');
    }
  } else {
    res.status(200).send('Downloader Bot Active!');
  }
};
