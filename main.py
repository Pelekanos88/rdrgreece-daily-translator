
import os
import asyncio
import logging

import discord
from deep_translator import GoogleTranslator

logging.basicConfig(level=logging.INFO)

TOKEN = os.environ["DISCORD_TOKEN"]
CHANNEL_ID = int(os.environ["CHANNEL_ID"])

intents = discord.Intents.default()
intents.message_content = True

client = discord.Client(intents=intents)
translator = GoogleTranslator(source="auto", target="el")


async def translate_text(text):
    if not text or not text.strip():
        return text

    try:
        result = await asyncio.to_thread(
            translator.translate, text
        )
        return result or text
    except Exception:
        logging.exception("Translation failed")
        return text


@client.event
async def on_ready():
    logging.info("RDRGreece Translator connected as %s", client.user)


@client.event
async def on_message(message):
    if message.channel.id != CHANNEL_ID:
        return

    if client.user and message.author.id == client.user.id:
        return

    if not message.embeds:
        return

    for source in message.embeds:
        translated = discord.Embed(
            title=await translate_text(source.title),
            description=await translate_text(source.description),
            color=source.color,
            url=source.url
        )

        for field in source.fields:
            translated.add_field(
                name=await translate_text(field.name),
                value=await translate_text(field.value),
                inline=field.inline
            )

        if source.author and source.author.name:
            translated.set_author(
                name=source.author.name,
                url=source.author.url,
                icon_url=source.author.icon_url
            )

        if source.thumbnail and source.thumbnail.url:
            translated.set_thumbnail(url=source.thumbnail.url)

        if source.image and source.image.url:
            translated.set_image(url=source.image.url)

        if source.footer and source.footer.text:
            translated.set_footer(
                text=source.footer.text,
                icon_url=source.footer.icon_url
            )

        if source.timestamp:
            translated.timestamp = source.timestamp

        try:
            await message.channel.send(
                embed=translated,
                allowed_mentions=discord.AllowedMentions.none()
            )
            logging.info("Greek translation posted")
        except Exception:
            logging.exception("Could not post translation")


client.run(TOKEN)
