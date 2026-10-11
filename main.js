const { Client, GatewayIntentBits, EmbedBuilder, AllowedMentions } = require('discord.js');
const translate = require('google-translate-api-x');

const TOKEN = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

if (!TOKEN) {
    console.error('ERROR: Discord bot token is missing.');
    process.exit(1);
}

if (!CHANNEL_ID) {
    console.error('ERROR: CHANNEL_ID is missing.');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

async function translateText(text) {
    if (!text || !text.trim()) return text || null;

    try {
        const result = await translate(text, { to: 'el' });
        return result.text || text;
    } catch (error) {
        console.error('Translation failed:', error.message);
        return text;
    }
}

client.once('ready', () => {
    console.log(`RDRGreece Translator connected as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.channel.id !== CHANNEL_ID) return;
    if (message.author.id === client.user.id) return;
    if (!message.embeds.length) return;

    for (const source of message.embeds) {
        try {
            const embedData = {};

            if (source.title) {
                embedData.title = await translateText(source.title);
            }

            if (source.description) {
                embedData.description = await translateText(source.description);
            }

            if (source.url) embedData.url = source.url;
            if (source.color) embedData.color = source.color;
            if (source.timestamp) embedData.timestamp = source.timestamp;

            if (source.author?.name) {
                embedData.author = {
                    name: source.author.name,
                    ...(source.author.url ? { url: source.author.url } : {}),
                    ...(source.author.iconURL() ? { iconURL: source.author.iconURL() } : {})
                };
            }

            if (source.thumbnail?.url) {
                embedData.thumbnail = { url: source.thumbnail.url };
            }

            if (source.image?.url) {
                embedData.image = { url: source.image.url };
            }

            if (source.footer?.text) {
                embedData.footer = {
                    text: source.footer.text,
                    ...(source.footer.iconURL() ? { iconURL: source.footer.iconURL() } : {})
                };
            }

            if (source.fields.length) {
                embedData.fields = [];

                for (const field of source.fields) {
                    embedData.fields.push({
                        name: await translateText(field.name),
                        value: await translateText(field.value),
                        inline: field.inline
                    });
                }
            }

            const translatedEmbed = new EmbedBuilder(embedData);

            await message.channel.send({
                embeds: [translatedEmbed],
                allowedMentions: AllowedMentions.none()
            });

            console.log('Greek translation posted.');
        } catch (error) {
            console.error('Could not translate embed:', error.message);
        }
    }
});

client.login(TOKEN);
