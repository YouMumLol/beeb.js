const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const OpenAI = require("openai");
const { MessageAttachment } = require("discord.js"); // Import MessageAttachment
require("dotenv").config();
const { fal } = require("@fal-ai/client");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("image")
    .setDescription("Generate an image using AI!")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("The image you want to generate")
        .setRequired(true)
    ),

  async execute(interaction) {
    interaction.deferReply();
    const input = interaction.options.getString("query");

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt:
          input,
          enable_safety_checker: false,
      },
      logs: true,
    });

    console.log(result);

    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        // .setTitle(result.data.prompt)
        .setImage(result.data.images[0].url);

    await interaction.editReply({
      embeds: [embed],
    });
  },
};
