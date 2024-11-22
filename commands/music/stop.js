const { SlashCommandBuilder } = require('discord.js');
const queue = require('../../queue')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('stop the playing'),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const serverQueue = queue.get(guildId);

        if (!serverQueue) {
            await interaction.reply({ content: 'There is no song playing right now!', ephemeral: true });
            return;
        }

        // Skip the song by stopping the player and playing the next one
        serverQueue.queue = [];
        serverQueue.player.stop();
        await interaction.reply({ content: '🛑 | Stopped playback!', ephemeral: false });
    }
};