const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ البوت جاهز ويعمل بنجاح باسم: ${client.user.tag}`);
});

// استقبال أمر تجريبي بسيط
client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  if (message.content === '!ping') {
    message.reply('Pong! 🏓 البوت يعمل بنجاح.');
  }
});

// تسجيل الدخول باستخدام التوكن المربوط بالبيئة
client.login(process.env.DISCORD_TOKEN);
