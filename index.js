const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
const express = require('express');

// 1. خادم إبقاء البوت شغال
const app = express();
app.get('/', (req, res) => res.send('Bot is Alive! 🚀'));
app.listen(3000, () => console.log('🌐 Web server running on port 3000'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
const express = require('express');

// 1. خادم إبقاء البوت شغال
const app = express();
app.get('/', (req, res) => res.send('Bot is Alive! 🚀'));
app.listen(3000, () => console.log('🌐 Web server running on port 3000'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const PREFIX = '!';

// تخزين البيانات
const warnings = new Map();
const messageCounts = new Map();

function generateWarnID() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function parseDuration(str) {
  if (!str) return null;
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return null;
  const num = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's': return num * 1000;
    case 'm': return num * 60 * 1000;
    case 'h': return num * 60 * 60 * 1000;
    case 'd': return num * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

function hasRole(member, roleIds) {
  if (!member) return false;
  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
  return member.roles.cache.some(role => roleIds.includes(role.id));
}

client.once('ready', () => {
  console.log(`✅ البوت شغال وجاهز باسم: ${client.user.tag}`);
});

// 🔴 هنا حدث messageCreate المسؤول عن قراءة كل الأوامر
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  // 1. تسجيل التفاعل
  const currentCount = messageCounts.get(message.author.id) || 0;
  messageCounts.set(message.author.id, currentCount + 1);

  // 2. الرد على السلام
  const salamPhrases = ['السلام عليكم', 'السلام عليكم ورحمة الله وبركاته', 'سلام عليكم', 'سلام عليكم ورحمة الله وبركاته'];
  if (salamPhrases.includes(message.content.trim())) {
    return message.reply('وعليكم السلام ورحمة الله وبركاته').catch(() => {});
  }

  // 3. التحقق من البريفكس !
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ⛔ أمر الباند: !حظر / !لف / !باند
  if (['حظر', 'لف', 'باند'].includes(command)) {
    const allowedRoles = ['1538588305715888230', '1538587308415000606', '1538587305277784084', '1538587298575425536', '1533615308424609893'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('❌ يرجى تحديد العضو أو المعرف.');

    const duration = parseDuration(args[1]);
    const reason = duration ? args.slice(2).join(' ') || 'بدون سبب' : args.slice(1).join(' ') || 'بدون سبب';

    try {
      await target.ban({ reason });
      message.reply(`✅ تم حظر ${target.user.tag} | السبب: ${reason}`);
      if (duration) {
        setTimeout(async () => {
          await message.guild.members.unban(target.id, 'انتهت مدة الباند المؤقت').catch(() => {});
        }, duration);
      }
    } catch (err) {
      message.reply('❌ تعذر الحظر، تأكد من أن رتبة البوت أعلى من رتبة العضو.');
    }
    return;
  }

  // 🔓 أمر فك الباند: !ارجع / !ازالة_حظر
  if (['ارجع', 'ازالة_حظر'].includes(command)) {
    const allowedRoles = ['1538588305715888230', '1538587308415000606', '1538587305277784084', '1538587298575425536', '1533615308424609893'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له.');

    const userId = args[0];
    if (!userId) return message.reply('❌ يرجى كتابة ID العضو.');

    await message.guild.members.unban(userId).then(() => {
      message.reply(`✅ تم فك الحظر عن ID: ${userId}`);
    }).catch(() => message.reply('❌ لم يتم العثور على حظر لهذا العضو.'));
    return;
  }

  // 👞 أمر الطرد: !طرد
  if (command === 'طرد') {
    const allowedRoles = ['1538588305715888230', '1538587308415000606', '1538587305277784084', '1538587298575425536', '1533615308424609893'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('❌ يرجى تحديد العضو.');
    const reason = args.slice(1).join(' ') || 'بدون سبب';

    try {
      await target.kick(reason);
      message.reply(`✅ تم طرد ${target.user.tag} | السبب: ${reason}`);
    } catch (err) {
      message.reply('❌ فشل الطرد، تحقق من صلاحيات البوت.');
    }
    return;
  }

  // ⏱️ أمر اسكات: !اسكات / !تايم / !لاتتكلم
  if (['اسكات', 'تايم', 'لاتتكلم'].includes(command)) {
    const allowedRoles = ['1538588030338867220', '1538588197095743599', '1533618177358037033', '1533617852484161618', '1533616666011762748', '1538588250246090772', '1533616291754016839', '1533616119296823447', '1533615854132924686', '1538588305715888230', '1538587308415000606', '1538587305277784084', '1538587298575425536', '1533615308424609893'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const duration = parseDuration(args[1]);
    if (!target || !duration) return message.reply('❌ الاستخدام الصحيح: !اسكات [العضو] [المدة مثل 10m] [السبب]');

    const reason = args.slice(2).join(' ') || 'بدون سبب';
    try {
      await target.timeout(duration, reason);
      message.reply(`✅ تم تطبيق تايم أوت على ${target.user.tag} لمدة ${args[1]}`);
    } catch (err) {
      message.reply('❌ تعذر تطبيق التايم أوت.');
    }
    return;
  }

  // 🔊 أمر فك الاسكات: !سولف / !تكلم
  if (['سولف', 'تكلم'].includes(command)) {
    const allowedRoles = ['1538588030338867220', '1538588197095743599', '1533618177358037033', '1533617852484161618', '1533616666011762748', '1538588250246090772', '1533616291754016839', '1533616119296823447', '1533615854132924686', '1538588305715888230', '1538587308415000606', '1538587305277784084', '1538587298575425536', '1533615308424609893'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('❌ يرجى تحديد العضو.');

    try {
      await target.timeout(null);
      message.reply(`✅ تم إزالة التايم أوت عن ${target.user.tag}`);
    } catch (err) {
      message.reply('❌ فشل إلغاء التايم أوت.');
    }
    return;
  }

  // ➕ أمر الرتبة: !رول / !رتبة
  if (['رول', 'رتبة'].includes(command)) {
    const allowedRoles = ['1533615308424609893', '1533614768479535205', '1534403557820993536', '1533588099660124272', '1533588257429000292', '1527008751360413707'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    if (!target || !role) return message.reply('❌ الاستخدام: !رول [العضو] [الرول]');

    try {
      await target.roles.add(role);
      message.reply(`✅ تم منح رول ${role.name} للمستخدم ${target.user.tag}`);
    } catch (err) {
      message.reply('❌ فشل إضافة الرول. ارفع رتبة البوت أعلى من الرتبة الممنوحة.');
    }
    return;
  }

  // 🔒 أمر القفل: !قفل / !ق
  if (['قفل', 'ق'].includes(command)) {
    const allowedRoles = ['1533614768479535205', '1534403557820993536', '1533588099660124272', '1533588257429000292', '1527008751360413707'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له.');

    const channel = message.mentions.channels.first() || message.channel;
    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
      message.reply(`🔒 تم قفل الروم ${channel}`);
    } catch (err) {
      message.reply('❌ فشل قفل الروم.');
    }
    return;
  }

  // 🔓 أمر الفتح: !فتح / !ف
  if (['فتح', 'ف'].includes(command)) {
    const allowedRoles = ['1533614768479535205', '1534403557820993536', '1533588099660124272', '1533588257429000292', '1527008751360413707'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له.');

    const channel = message.mentions.channels.first() || message.channel;
    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
      message.reply(`🔓 تم فتح الروم ${channel}`);
    } catch (err) {
      message.reply('❌ فشل فتح الروم.');
    }
    return;
  }
});

client.login(process.env.DISCORD_TOKEN);
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const PREFIX = '!';

// تخزين البيانات
const warnings = new Map();
const messageCounts = new Map();

function generateWarnID() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function parseDuration(str) {
  if (!str) return null;
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return null;
  const num = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's': return num * 1000;
    case 'm': return num * 60 * 1000;
    case 'h': return num * 60 * 60 * 1000;
    case 'd': return num * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

function hasRole(member, roleIds) {
  if (!member) return false;
  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
  return member.roles.cache.some(role => roleIds.includes(role.id));
}

client.once('ready', () => {
  console.log(`✅ البوت شغال وجاهز باسم: ${client.user.tag}`);
});

// 🔴 هنا حدث messageCreate المسؤول عن قراءة كل الأوامر
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  // 1. تسجيل التفاعل
  const currentCount = messageCounts.get(message.author.id) || 0;
  messageCounts.set(message.author.id, currentCount + 1);

  // 2. الرد على السلام
  const salamPhrases = ['السلام عليكم', 'السلام عليكم ورحمة الله وبركاته', 'سلام عليكم', 'سلام عليكم ورحمة الله وبركاته'];
  if (salamPhrases.includes(message.content.trim())) {
    return message.reply('وعليكم السلام ورحمة الله وبركاته').catch(() => {});
  }

  // 3. التحقق من البريفكس !
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ⛔ أمر الباند: !حظر / !لف / !باند
  if (['حظر', 'لف', 'باند'].includes(command)) {
    const allowedRoles = ['1538588305715888230', '1538587308415000606', '1538587305277784084', '1538587298575425536', '1533615308424609893'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('❌ يرجى تحديد العضو أو المعرف.');

    const duration = parseDuration(args[1]);
    const reason = duration ? args.slice(2).join(' ') || 'بدون سبب' : args.slice(1).join(' ') || 'بدون سبب';

    try {
      await target.ban({ reason });
      message.reply(`✅ تم حظر ${target.user.tag} | السبب: ${reason}`);
      if (duration) {
        setTimeout(async () => {
          await message.guild.members.unban(target.id, 'انتهت مدة الباند المؤقت').catch(() => {});
        }, duration);
      }
    } catch (err) {
      message.reply('❌ تعذر الحظر، تأكد من أن رتبة البوت أعلى من رتبة العضو.');
    }
    return;
  }

  // 🔓 أمر فك الباند: !ارجع / !ازالة_حظر
  if (['ارجع', 'ازالة_حظر'].includes(command)) {
    const allowedRoles = ['1538588305715888230', '1538587308415000606', '1538587305277784084', '1538587298575425536', '1533615308424609893'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له.');

    const userId = args[0];
    if (!userId) return message.reply('❌ يرجى كتابة ID العضو.');

    await message.guild.members.unban(userId).then(() => {
      message.reply(`✅ تم فك الحظر عن ID: ${userId}`);
    }).catch(() => message.reply('❌ لم يتم العثور على حظر لهذا العضو.'));
    return;
  }

  // 👞 أمر الطرد: !طرد
  if (command === 'طرد') {
    const allowedRoles = ['1538588305715888230', '1538587308415000606', '1538587305277784084', '1538587298575425536', '1533615308424609893'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('❌ يرجى تحديد العضو.');
    const reason = args.slice(1).join(' ') || 'بدون سبب';

    try {
      await target.kick(reason);
      message.reply(`✅ تم طرد ${target.user.tag} | السبب: ${reason}`);
    } catch (err) {
      message.reply('❌ فشل الطرد، تحقق من صلاحيات البوت.');
    }
    return;
  }

  // ⏱️ أمر اسكات: !اسكات / !تايم / !لاتتكلم
  if (['اسكات', 'تايم', 'لاتتكلم'].includes(command)) {
    const allowedRoles = ['1538588030338867220', '1538588197095743599', '1533618177358037033', '1533617852484161618', '1533616666011762748', '1538588250246090772', '1533616291754016839', '1533616119296823447', '1533615854132924686', '1538588305715888230', '1538587308415000606', '1538587305277784084', '1538587298575425536', '1533615308424609893'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const duration = parseDuration(args[1]);
    if (!target || !duration) return message.reply('❌ الاستخدام الصحيح: !اسكات [العضو] [المدة مثل 10m] [السبب]');

    const reason = args.slice(2).join(' ') || 'بدون سبب';
    try {
      await target.timeout(duration, reason);
      message.reply(`✅ تم تطبيق تايم أوت على ${target.user.tag} لمدة ${args[1]}`);
    } catch (err) {
      message.reply('❌ تعذر تطبيق التايم أوت.');
    }
    return;
  }

  // 🔊 أمر فك الاسكات: !سولف / !تكلم
  if (['سولف', 'تكلم'].includes(command)) {
    const allowedRoles = ['1538588030338867220', '1538588197095743599', '1533618177358037033', '1533617852484161618', '1533616666011762748', '1538588250246090772', '1533616291754016839', '1533616119296823447', '1533615854132924686', '1538588305715888230', '1538587308415000606', '1538587305277784084', '1538587298575425536', '1533615308424609893'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('❌ يرجى تحديد العضو.');

    try {
      await target.timeout(null);
      message.reply(`✅ تم إزالة التايم أوت عن ${target.user.tag}`);
    } catch (err) {
      message.reply('❌ فشل إلغاء التايم أوت.');
    }
    return;
  }

  // ➕ أمر الرتبة: !رول / !رتبة
  if (['رول', 'رتبة'].includes(command)) {
    const allowedRoles = ['1533615308424609893', '1533614768479535205', '1534403557820993536', '1533588099660124272', '1533588257429000292', '1527008751360413707'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    if (!target || !role) return message.reply('❌ الاستخدام: !رول [العضو] [الرول]');

    try {
      await target.roles.add(role);
      message.reply(`✅ تم منح رول ${role.name} للمستخدم ${target.user.tag}`);
    } catch (err) {
      message.reply('❌ فشل إضافة الرول. ارفع رتبة البوت أعلى من الرتبة الممنوحة.');
    }
    return;
  }

  // 🔒 أمر القفل: !قفل / !ق
  if (['قفل', 'ق'].includes(command)) {
    const allowedRoles = ['1533614768479535205', '1534403557820993536', '1533588099660124272', '1533588257429000292', '1527008751360413707'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له.');

    const channel = message.mentions.channels.first() || message.channel;
    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
      message.reply(`🔒 تم قفل الروم ${channel}`);
    } catch (err) {
      message.reply('❌ فشل قفل الروم.');
    }
    return;
  }

  // 🔓 أمر الفتح: !فتح / !ف
  if (['فتح', 'ف'].includes(command)) {
    const allowedRoles = ['1533614768479535205', '1534403557820993536', '1533588099660124272', '1533588257429000292', '1527008751360413707'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له.');

    const channel = message.mentions.channels.first() || message.channel;
    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
      message.reply(`🔓 تم فتح الروم ${channel}`);
    } catch (err) {
      message.reply('❌ فشل فتح الروم.');
    }
    return;
  }
});

client.login(process.env.DISCORD_TOKEN);
