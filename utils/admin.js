module.exports = (bot, Users) => {
    let blockedUsers = [];

    function isAdmin(userId) {
        return userId == 6560764233;
    }

    const adminPanelButtons = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "👤 Foydalanuvchilar", callback_data: "show_users" }],
                [{ text: "🔍 Qidirish", callback_data: "search_user" }],
                [{ text: "🔒 Bloklash", callback_data: "block_user" }, { text: "🔓 Blokdan chiqarish", callback_data: "unblock_user" }],
                [{ text: "📢 Hammaga xabar", callback_data: "send_all" }, { text: "📬 Bittaga xabar", callback_data: "send_to" }],
            ]
        }
    };

    bot.onText(/\/panel/, (msg) => {
        if (!isAdmin(msg.from.id)) return;
        bot.sendMessage(msg.chat.id, "🔧 Admin paneliga xush kelibsiz!", adminPanelButtons);
    });

    bot.on('callback_query', async (query) => {
        const chatId = query.message.chat.id;
        const userId = query.from.id;
        const data = query.data;

        if (!isAdmin(userId)) return;

        const users = await Users.read();

        if (data === "show_users") {
            let userList = users.map(u => `👤 ${u.name} (@${u.username}) - ID: ${u.id}`).join('\n\n');
            bot.sendMessage(chatId, userList || "❗️Foydalanuvchilar topilmadi.");
        }

        else if (data === "search_user") {
            bot.sendMessage(chatId, "🔎 Iltimos, qidirilayotgan username yoki ID yuboring:\n\n(Usernameni '@' bilan kiriting)");
            bot.once("message", async (msg) => {
                const query = msg.text.toLowerCase();
                const user = users.find(u =>
                    `@${u.username.toLowerCase()}` === query || String(u.id) === query
                );

                if (user) {
                    const userInfo = `
🔍 Topilgan foydalanuvchi:

👤 Ismi: ${user.name}
🔹 Username: @${user.username}
🆔 ID: ${user.id}
📞 Telefon raqami : ${user.phone || "Noma'lum"}
⏰ Qo'shilgan sana: ${user.joinDate}
                    `;
                    bot.sendMessage(chatId, userInfo);
                } else {
                    bot.sendMessage(chatId, "❌ Foydalanuvchi topilmadi.");
                }
            });
        }

        else if (data === "block_user") {
            bot.sendMessage(chatId, "🚫 Bloklash uchun foydalanuvchi ID yuboring:");
            bot.once("message", (msg) => {
                const id = Number(msg.text);
                if (!blockedUsers.includes(id)) {
                    blockedUsers.push(id);
                    bot.sendMessage(chatId, `🔒 Foydalanuvchi ${id} bloklandi.`);
                } else {
                    bot.sendMessage(chatId, "❗️ Bu foydalanuvchi allaqachon bloklangan.");
                }
            });
        }

        else if (data === "unblock_user") {
            bot.sendMessage(chatId, "🔓 Blokdan chiqarish uchun foydalanuvchi ID yuboring:");
            bot.once("message", (msg) => {
                const id = Number(msg.text);
                blockedUsers = blockedUsers.filter(u => u !== id);
                bot.sendMessage(chatId, `✅ Foydalanuvchi ${id} blokdan chiqarildi.`);
            });
        }

        else if (data === "send_all") {
            bot.sendMessage(chatId, "✉️ Hammaga yuboriladigan xabar matnini yozing:");
            bot.once("message", async (msg) => {
                const message = msg.text;
                const users = await Users.read();
                users.forEach(user => {
                    if (!blockedUsers.includes(user.id)) {
                        bot.sendMessage(user.id, message);
                    }
                });
                bot.sendMessage(chatId, "✅ Xabar barcha foydalanuvchilarga yuborildi.");
            });
        }

        else if (data === "send_to") {
            bot.sendMessage(chatId, "👤 Iltimos, foydalanuvchining ID yoki @usernameni yuboring:");
        
            bot.once("message", (msg1) => {
                const identifier = msg1.text.trim();
        
                if (!identifier) {
                    return bot.sendMessage(chatId, "❗️ Foydalanuvchi ID yoki username kiritilmadi.");
                }
        
                bot.sendMessage(chatId, "✉️ Endi yuboriladigan xabar matnini kiriting:");
        
                bot.once("message", async (msg2) => {
                    const messageToSend = msg2.text.trim();
        
                    if (!messageToSend) {
                        return bot.sendMessage(chatId, "❗️ Xabar matni bo‘sh bo‘lmasligi kerak.");
                    }
        
                    try {
                        let userId = null;
                        if (identifier.startsWith("@")) {
                            const users = await Users.read();
                            const found = users.find(u => "@" + u.username === identifier);
                            if (found) userId = found.id;
                        } else {
                            userId = Number(identifier);
                        }
        
                        if (!userId) {
                            return bot.sendMessage(chatId, "❗️ Bunday foydalanuvchi topilmadi.");
                        }
        
                        await bot.sendMessage(userId, `📬 Sizga admindan xabar:\n\n${messageToSend}`);
                        await bot.sendMessage(chatId, `✅ Xabar foydalanuvchiga (${userId}) yuborildi.`);
        
                    } catch (error) {
                        console.error(error);
                        bot.sendMessage(chatId, "❗️ Xatolik yuz berdi. Ehtimol, foydalanuvchi botni boshlamagan.");
                    }
                });
            });
        }
        

        bot.answerCallbackQuery(query.id);
    });
};
