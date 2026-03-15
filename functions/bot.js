const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.on(['photo', 'document', 'video', 'audio'], async (ctx) => {
  try {
    const statusMsg = await ctx.reply("📥 *Generating Direct Link...*", { parse_mode: 'Markdown' });

    let fileId;
    if (ctx.message.photo) fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    else if (ctx.message.document) fileId = ctx.message.document.file_id;
    else if (ctx.message.video) fileId = ctx.message.video.file_id;
    else if (ctx.message.audio) fileId = ctx.message.audio.file_id;

    // டெலிகிராம் பாட் ஏபிஐ-ல் இருந்து டைரக்ட் லிங்க் எடுக்கிறோம்
    const fileUrl = await ctx.telegram.getFileLink(fileId);
    
    // இந்த லிங்க் 1 மணிநேரம் மட்டும் தான் வேலை செய்யும்
    const directLink = fileUrl.href;

    await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, 
      `✅ *Download Link Ready!*\n\n⚠️ *Note:* This link expires in 1 hour.\n\n🔗 ${directLink}`, 
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: "📥 Download Now", url: directLink }]]
        }
      }
    );

  } catch (error) {
    ctx.reply("❌ Error generating link.");
  }
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } else {
    res.status(200).send('Bot Active!');
  }
};
