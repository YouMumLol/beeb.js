const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const queue = require('../../queue')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('View the current queue of songs'),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const serverQueue = queue.get(guildId);

        if (!serverQueue) {
            await interaction.reply({ content: 'There are no songs playing right now!', ephemeral: true });
            return;
        }

        const queueEmbed = new EmbedBuilder()
            .setTitle('Queue')
            .setDescription('Here are the songs in the queue:')
            .setColor('RANDOM')
            .addFields(
                serverQueue.queue.map((song, index) => {
                    return {
                        name: `${index + 1}. ${song.title}`,
                        value: `Duration: ${song.duration}`,
                    }
                })
            );
        interaction.reply({ embeds: [queueEmbed], ephemeral: false });
    }
};