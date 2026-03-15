const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// பாட் வேலை செய்கிறதா என பார்க்க ஒரு சின்ன டெஸ்ட்
bot.start((ctx) => ctx.reply("✅ Bot is Alive! Send a small file to test. (Note: 4GB is not possible on Nhost)"));

bot.on(['photo', 'document', 'video', 'audio'], async (ctx) => {
  try {
    // 1. Get File ID
    let fileId;
    if (ctx.message.photo) fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    else if (ctx.message.document) fileId = ctx.message.document.file_id;
    else if (ctx.message.video) fileId = ctx.message.video.file_id;
    else if (ctx.message.audio) fileId = ctx.message.audio.file_id;

    // 2. Generate Link (இது டெலிகிராம் சர்வர் லிங்க்)
    const fileUrl = await ctx.telegram.getFileLink(fileId);
    
    ctx.reply(`🔗 *Your Link:* \n${fileUrl.href}`, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error(error);
    ctx.reply("❌ Error generating link. File might be too large for this server.");
  }
});

// Nhost Handler
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (err) {
      res.status(200).send('OK');
    }
  } else {
    res.status(200).send('Bot is Running!');
  }
};
