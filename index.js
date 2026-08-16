const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
const express = require('express');

// 1. خادم إبقاء البوت يعمل دائماً
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

// تخزين التحذيرات والتفاعل في الذاكرة
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
  console.log(`✅ البوت يعمل بنجاح باسم: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  // تسجيل التفاعل
  const currentCount = messageCounts.get(message.author.id) || 0;
  messageCounts.set(message.author.id, currentCount + 1);

  // الرد التلقائي على السلام
  const salamPhrases = [
    'السلام عليكم',
    'السلام عليكم ورحمة الله وبركاته',
    'سلام عليكم',
    'سلام عليكم ورحمة الله وبركاته'
  ];
  if (salamPhrases.includes(message.content.trim())) {
    return message.reply('وعليكم السلام ورحمة الله وبركاته').catch(() => {});
  }

  // معالجة الأوامر
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // 🔴 أمر باند
  if (['حظر', 'لف', 'باند'].includes(command)) {
    const allowedRoles = ['1538588305715888230', '1538587308415000606', '1538587305277784084', '1538587298575425536', '1533615308424609893'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له لاستخدام هذا الأمر.');

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
      message.reply('❌ فشل تنفيذ الباند. تأكد أن رتبة البوت أعلى من الشخص المراد حظره.');
    }
    return;
  }

  // 🟢 أمر فك الباند
  if (['ارجع', 'ازالة_حظر'].includes(command)) {
    const allowedRoles = ['1538588305715888230', '1538587308415000606', '1538587305277784084', '1538587298575425536', '1533615308424609893'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له لاستخدام هذا الأمر.');

    const userId = args[0];
    if (!userId) return message.reply('❌ يرجى كتابة ID العضو.');
    
    await message.guild.members.unban(userId).then(() => {
      message.reply(`✅ تم فك الحظر عن ID: ${userId}`);
    }).catch(() => message.reply('❌ لم يتم العثور على حظر لهذا العضو.'));
    return;
  }

  // 👞 أمر طرد
  if (command === 'طرد') {
    const allowedRoles = ['1538588305715888230', '1538587308415000606', '1538587305277784084', '1538587298575425536', '1533615308424609893'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له لاستخدام هذا الأمر.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('❌ يرجى تحديد العضو.');
    const reason = args.slice(1).join(' ') || 'بدون سبب';

    try {
      await target.kick(reason);
      message.reply(`✅ تم طرد ${target.user.tag} | السبب: ${reason}`);
    } catch (err) {
      message.reply('❌ فشل الطرد. تأكد من صلاحيات ورتبة البوت.');
    }
    return;
  }

  // ⏱️ أمر تايم أوت
  if (['اسكات', 'تايم', 'لاتتكلم'].includes(command)) {
    const allowedRoles = ['1538588030338867220', '1538588197095743599', '1533618177358037033', '1533617852484161618', '1533616666011762748', '1538588250246090772', '1533616291754016839', '1533616119296823447', '1533615854132924686', '1538588305715888230', '1538587308415000606', '1538587305277784084', '1538587298575425536', '1533615308424609893'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له لاستخدام هذا الأمر.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const duration = parseDuration(args[1]);
    if (!target || !duration) return message.reply('❌ الاستخدام الصحيح: !اسكات [العضو] [المدة مثل 10m] [السبب]');

    const reason = args.slice(2).join(' ') || 'بدون سبب';
    try {
      await target.timeout(duration, reason);
      message.reply(`✅ تم تطبيق تايم أوت على ${target.user.tag} لمدة ${args[1]}`);
    } catch (err) {
      message.reply('❌ فشل تطبيق التايم أوت.');
    }
    return;
  }

  // 🔊 أمر فك تايم أوت
  if (['سولف', 'تكلم'].includes(command)) {
    const allowedRoles = ['1538588030338867220', '1538588197095743599', '1533618177358037033', '1533617852484161618', '1533616666011762748', '1538588250246090772', '1533616291754016839', '1533616119296823447', '1533615854132924686', '1538588305715888230', '1538587308415000606', '1538587305277784084', '1538587298575425536', '1533615308424609893'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له لاستخدام هذا الأمر.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('❌ يرجى تحديد العضو.');

    try {
      await target.timeout(null);
      message.reply(`✅ تم إزالة التايم أوت عن ${target.user.tag}`);
    } catch (err) {
      message.reply('❌ تعذر إزالة التايم أوت.');
    }
    return;
  }

  // 📊 أمر معلومات السيرفر
  if (command === 'server') {
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`معلومات سيرفر: ${message.guild.name}`)
      .addFields(
        { name: '🆔 ID السيرفر', value: message.guild.id, inline: true },
        { name: '👑 المالِك', value: `<@${message.guild.ownerId}>`, inline: true },
        { name: '👥 عدد الأعضاء', value: `${message.guild.memberCount}`, inline: true },
        { name: '💬 عدد الرومات', value: `${message.guild.channels.cache.size}`, inline: true }
      );
    message.reply({ embeds: [embed] }).catch(() => {});
    return;
  }

  // ➕ أمر إعطاء رول
  if (['رول', 'رتبة'].includes(command)) {
    const allowedRoles = ['1533615308424609893', '1533614768479535205', '1534403557820993536', '1533588099660124272', '1533588257429000292', '1527008751360413707'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له لاستخدام هذا الأمر.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    if (!target || !role) return message.reply('❌ الاستخدام: !رول [العضو] [الرول]');

    try {
      await target.roles.add(role);
      message.reply(`✅ تم منح رول ${role.name} للمستخدم ${target.user.tag}`);
    } catch (err) {
      message.reply('❌ فشل إضافة الرول. تأكد أن رتبة البوت أعلى من الرتبة المراد إعطاؤها.');
    }
    return;
  }

  // ➖ أمر إزالة رول
  if (['سحب_رول', 'سحب'].includes(command)) {
    const allowedRoles = ['1533615308424609893', '1533614768479535205', '1534403557820993536', '1533588099660124272', '1533588257429000292', '1527008751360413707'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له لاستخدام هذا الأمر.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    if (!target || !role) return message.reply('❌ الاستخدام: !سحب [العضو] [الرول]');

    try {
      await target.roles.remove(role);
      message.reply(`✅ تم سحب رول ${role.name} من المستخدم ${target.user.tag}`);
    } catch (err) {
      message.reply('❌ فشل سحب الرول.');
    }
    return;
  }

  // ⏳ أمر رول مؤقت
  if (command === 'رول_مؤقت') {
    const allowedRoles = ['1533615308424609893', '1533614768479535205', '1534403557820993536', '1533588099660124272', '1533588257429000292', '1527008751360413707', '1538587298575425536'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له لاستخدام هذا الأمر.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    const duration = parseDuration(args[2]);
    if (!target || !role || !duration) return message.reply('❌ الاستخدام: !رول_مؤقت [العضو] [الرول] [المدة مثل 1h]');

    try {
      await target.roles.add(role);
      message.reply(`✅ تم منح رول ${role.name} مؤقتاً لمدة ${args[2]}`);

      setTimeout(async () => {
        await target.roles.remove(role).catch(() => {});
      }, duration);
    } catch (err) {
      message.reply('❌ فشل إعطاء الرول المؤقت.');
    }
    return;
  }

  // 🔓 أمر فتح روم
  if (['فتح', 'ف'].includes(command)) {
    const allowedRoles = ['1533614768479535205', '1534403557820993536', '1533588099660124272', '1533588257429000292', '1527008751360413707'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له لاستخدام هذا الأمر.');

    const channel = message.mentions.channels.first() || message.channel;
    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
      message.reply(`🔓 تم فتح الروم ${channel}`);
    } catch (err) {
      message.reply('❌ فشل فتح الروم.');
    }
    return;
  }

  // 🔒 أمر إغلاق روم
  if (['قفل', 'ق'].includes(command)) {
    const allowedRoles = ['1533614768479535205', '1534403557820993536', '1533588099660124272', '1533588257429000292', '1527008751360413707'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له لاستخدام هذا الأمر.');

    const channel = message.mentions.channels.first() || message.channel;
    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
      message.reply(`🔒 تم قفل الروم ${channel}`);
    } catch (err) {
      message.reply('❌ فشل قفل الروم.');
    }
    return;
  }

  // ⚠️ أمر تحذير
  if (command === 'تحذير') {
    const allowedRoles = ['1538588030338867220', '1538588197095743599', '1533618177358037033', '1533617852484161618', '1533616666011762748', '1538588250246090772', '1533616291754016839', '1533616119296823447', '1533615854132924686', '1538588305715888230', '1538587308415000606', '1538587305277784084', '1538587298575425536', '1533615308424609893'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له لاستخدام هذا الأمر.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const reason = args.slice(1).join(' ');
    if (!target || !reason) return message.reply('❌ الاستخدام: !تحذير [العضو] [السبب]');

    const warnID = generateWarnID();
    const userWarns = warnings.get(target.id) || [];
    userWarns.push({ id: warnID, reason });
    warnings.set(target.id, userWarns);

    const embed = new EmbedBuilder()
      .setColor('#FFCC00')
      .setTitle('⚠️ تم تسجيل تحذير جديد')
      .addFields(
        { name: '👤 العضو', value: `${target.user.tag}`, inline: true },
        { name: '🆔 كود التحذير', value: `\`${warnID}\``, inline: true },
        { name: '📝 السبب', value: reason }
      );

    message.reply({ embeds: [embed] }).catch(() => {});
    return;
  }

  // 🗑️ أمر إزالة تحذير
  if (['اعفاء', 'شيل'].includes(command)) {
    const allowedRoles = ['1538588030338867220', '1538588197095743599', '1533618177358037033', '1533617852484161618', '1533616666011762748', '1538588250246090772', '1533616291754016839', '1533616119296823447', '1533615854132924686', '1538588305715888230', '1538587308415000606', '1538587298575425536', '1533615308424609893'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له لاستخدام هذا الأمر.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const warnID = args[1];
    if (!target || !warnID) return message.reply('❌ الاستخدام: !شيل [العضو] [كود التحذير]');

    let userWarns = warnings.get(target.id) || [];
    const initialLen = userWarns.length;
    userWarns = userWarns.filter(w => w.id !== warnID);
    warnings.set(target.id, userWarns);

    if (userWarns.length < initialLen) {
      message.reply(`✅ تم إزالة التحذير ذات الكود \`${warnID}\` من ${target.user.tag}`);
    } else {
      message.reply('❌ لم يتم العثور على هذا الكود بهذا العضو.');
    }
    return;
  }

  // 📜 أمر قائمة التحذيرات
  if (command === 'تحذيرات') {
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);

    if (target) {
      const userWarns = warnings.get(target.id) || [];
      if (userWarns.length === 0) return message.reply('✅ لا يوجد تحذيرات لهذا العضو.');

      const embed = new EmbedBuilder()
        .setColor('#FF9900')
        .setTitle(`قائمة تحذيرات ${target.user.tag}`)
        .setDescription(userWarns.map(w => `🔹 الكود: \`${w.id}\` | السبب: ${w.reason}`).join('\n'));

      return message.reply({ embeds: [embed] });
    }

    if (args[0] === 'all') {
      if (warnings.size === 0) return message.reply('✅ لا يوجد أي تحذيرات مسجلة بالسيرفر.');
      let desc = '';
      warnings.forEach((warns, uid) => {
        if (warns.length > 0) {
          desc += `<@${uid}>: ${warns.length} تحذير/ات\n`;
        }
      });
      const embed = new EmbedBuilder().setColor('#FF9900').setTitle('📊 تحذيرات السيرفر').setDescription(desc);
      return message.reply({ embeds: [embed] });
    }

    message.reply('❌ الاستخدام: !تحذيرات [mention/ID] أو !تحذيرات all');
    return;
  }

  // 🏆 أمر لوحة الصدارة
  if (['top', 'توب'].includes(command)) {
    const limit = parseInt(args[0]) || 10;
    const sorted = [...messageCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);

    if (sorted.length === 0) return message.reply('لا توجد بيانات تفاعل بعد.');

    const leaderboard = sorted.map((entry, idx) => `**#${idx + 1}** <@${entry[0]}> - ${entry[1]} رسالة`).join('\n');
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`🏆 أفضل ${limit} متفاعلين`)
      .setDescription(leaderboard);

    message.reply({ embeds: [embed] });
    return;
  }

  // ✏️ أمر اللقب
  if (['لقب', 'اسم'].includes(command)) {
    const allowedRoles = ['1533620080116502650', '1533619125035733062', '1538588030338867220', '1538588197095743599', '1533618177358037033', '1533617852484161618', '1533616666011762748', '1538588250246090772', '1533616291754016839', '1533616119296823447', '1533615854132924686', '1538588305715888230', '1538587308415000606', '1538587305277784084', '1538587298575425536', '1533615308424609893'];
    if (!hasRole(message.member, allowedRoles)) return message.reply('❌ لا تملك الرول المصرح له لاستخدام هذا الأمر.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const nick = args.slice(1).join(' ');
    if (!target || !nick) return message.reply('❌ الاستخدام: !اسم [العضو] [الاسم الجديد]');

    try {
      await target.setNickname(nick);
      message.reply(`✅ تم تغيير اسم ${target.user.tag} إلى **${nick}**`);
    } catch (err) {
      message.reply('❌ فشل تغيير الاسم.');
    }
    return;
  }
});

client.login(process.env.DISCORD_TOKEN);
