const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const OpenAI = require("openai");
const { MessageAttachment } = require('discord.js'); // Import MessageAttachment
require("dotenv").config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('image')
        .setDescription('Generate an image using AI!')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The image you want to generate')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('style')
                .setDescription('The style of the image')
                .setRequired(false)
                .addChoices(
                    { name: 'Vivid', value: 'vivid' },
                    { name: 'Natural', value: 'natural' },
                )),
        
    async execute(interaction) {
        interaction.deferReply();
        const input = interaction.options.getString('query');
        
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: "I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS: " + input,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json",
            style: interaction.options.getString('style') ? interaction.options.getString('style') : "vivid"
        });

        console.log("I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS: "+input)
        console.log(response);

        // Extract base64 string from the response
        const base64Image = response.data[0].b64_json;

        // Convert the base64 string to a buffer
        const buffer = Buffer.from(base64Image, 'base64');

        // Create an attachment
        const attachment = new AttachmentBuilder(buffer, 'generated-image.png');

        // Send the attachment
        await interaction.editReply({
            content: 'Here is your generated image:',
            files: [attachment.attachment]
        });
    },
};
