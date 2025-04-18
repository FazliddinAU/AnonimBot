const TelegramBot = require("node-telegram-bot-api");
const token = '7922810275:AAHdk-tmlvWx3CllboZNqtJMdWGuDPo5bH8';
const bot = new TelegramBot(token, { polling: true });
const admin = "6560764233";

const Io = require("./utils/io.js");
const Users = new Io("database/users.json");
require('./utils/admin.js')(bot, Users);

let adminMode = {}; 

function getCurrentTime() {
    let now = new Date();
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    let seconds = now.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

bot.on("message", async (message) => {
    const chatId = message.chat.id;
    const userId = message.from.id;
    const username = message.from.username;
    const name = message.from.first_name;
    const lastName = message.from.last_name;
    const phone = message.contact ? message.contact.phone_number : null;

    function formatJoinDate(date) {
        const options = {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        return new Date(date).toLocaleString('en-US', options).replace(',', ' |');
    }

    const joinDate = formatJoinDate(new Date());
    const user = {
        id: userId,
        name: name,
        lastName: lastName,
        username: username,
        phone: phone,
        joinDate: joinDate
    };

    if (message.text === "/start") {
        const users = await Users.read();
        const userExists = users.find(u => u.id === chatId);

        if (userExists) {
            bot.sendMessage(chatId, `<b>Assalomu alaykum bot orqali anonim yozishingiz mumkin📮</b>\n<b>Matn, rasm, video, musiqa, ovozli xabar qabul qilinadi.</b>\n\n<i>Hamkorlik uchun : @inqiIob</i>`, {
                parse_mode : "HTML"
            });
        } else {
            bot.sendMessage(chatId, "📲 Iltimos, kontakt ma'lumotingizni yuboring", {
                reply_markup: {
                    keyboard: [[{ text: "📞 Kontakt yuborish", request_contact: true }]],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            });
        }

    } else if (message.contact) {
        const users = await Users.read();
        const userExists = users.find(u => u.id === chatId);

        if (!userExists) {
            users.push(user);
            await Users.write(users);
        }

        bot.sendMessage(chatId, "✅ Siz ro'yxatdan o'tdingiz. Endi admin bilan yozishishingiz mumkin.", {
            reply_markup: {
                remove_keyboard: true 
            }
        });

    } else if (message.text === "/panel" && chatId == admin) {
        adminMode[chatId] = true;
        return;

    } else if (adminMode[chatId]) {
        return;

    } else {
        const currentTime = getCurrentTime();
        bot.sendMessage(admin, `\n<blockquote>📩 Sizga anonim xabar keldi:</blockquote>\n\n<b>${message.text}</b>`, {
            parse_mode : "HTML"
        });
        await bot.sendMessage(admin, ` ${name} (@${username}) soat : ${currentTime}`)
        bot.sendMessage(chatId, "✅ Xabaringiz adminga yuborildi.");
    }
});

bot.on("photo", async (message) => {
    const chatId = message.chat.id;
    if (adminMode[chatId]) return;

    const name = message.from.first_name;
    const username = message.from.username;
    const currentTime = getCurrentTime();
    const response = `🖼 Rasm: ${name} (@${username}) soat ${currentTime} da yubordi`;

    bot.sendPhoto(admin, message.photo[message.photo.length - 1].file_id, { caption: response });
});

bot.on("video", async (message) => {
    const chatId = message.chat.id;
    if (adminMode[chatId]) return;

    const name = message.from.first_name;
    const username = message.from.username;
    const currentTime = getCurrentTime();
    const response = `🎥 Video: ${name} (@${username}) soat ${currentTime} da yubordi`;

    bot.sendVideo(admin, message.video.file_id, { caption: response });
});

bot.on("audio", async (message) => {
    const chatId = message.chat.id;
    if (adminMode[chatId]) return;

    const name = message.from.first_name;
    const username = message.from.username;
    const currentTime = getCurrentTime();
    const response = `🎵 Audio: ${name} (@${username}) soat ${currentTime} da yubordi`;

    bot.sendAudio(admin, message.audio.file_id, { caption: response });
});


bot.on("voice", async (message) => {
    const chatId = message.chat.id;
    if (adminMode[chatId]) return;

    const name = message.from.first_name;
    const username = message.from.username;
    const currentTime = getCurrentTime();
    const response = `🎙 Voice: ${name} (@${username}) soat ${currentTime} da yubordi`;

    bot.sendVoice(admin, message.voice.file_id, { caption: response });
});
