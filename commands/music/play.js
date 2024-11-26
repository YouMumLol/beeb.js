const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require("@distube/ytdl-core");
const queue = require('../../queue');
const yts = require("yt-search");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a YouTube song!')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The name or URL of a YouTube video you want to play')
                .setRequired(true)
                .setAutocomplete(true)),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        if (focusedValue && focusedValue.length > 0) {
            console.log("starting search: ",focusedValue);
            const searchResults = await yts(focusedValue);
            console.log("finished search: ",focusedValue);
            const choices = searchResults.videos.slice(0,5).map(video => ({ name: video.title, value: video.url }));
            await interaction.respond(choices);
        } else {
            await interaction.respond([]);
        }
    },

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const memberVoiceChannel = interaction.member.voice.channel;

        if (!memberVoiceChannel) {
            return interaction.reply({ content: 'You need to be in a voice channel to use this command!', ephemeral: true });
        }

        await interaction.deferReply();

        const connection = joinVoiceChannel({
            channelId: memberVoiceChannel.id,
            guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        const input = interaction.options.getString('query');
        const url = input.includes('https://') ? input : await search(input);
        let serverQueue = queue.get(guildId)
        if (!serverQueue) {
            serverQueue = initializeQueue(guildId, connection, interaction.channel);
            const metadata = await ytdl.getBasicInfo(url);
            serverQueue.queue.push(metadata);
            playNext(serverQueue);
            await interaction.editReply(`🎶 | Added **${metadata.videoDetails.title}** to the queue.`);
        } else {
            const metadata = await ytdl.getBasicInfo(url);
            serverQueue.queue.push(metadata);
            await interaction.editReply(`🎶 | Added **${metadata.videoDetails.title}** to the queue.`);
        }
    },
};

function initializeQueue(guildId, connection, textChannel) {
    const player = createAudioPlayer();

    const queueConstruct = {
        connection,
        player,
        textChannel,
        queue: [],
    };

    queue.set(guildId, queueConstruct);

    player.on('error', error => {
        console.error('Audio player error:', error);
        cleanupQueue(guildId);
    });

    player.on(AudioPlayerStatus.Idle, () => {
        const serverQueue = queue.get(guildId);
        serverQueue.queue.shift(); // Remove the finished song
        if (serverQueue.queue.length > 0) {
            playNext(serverQueue);
        } else {
            cleanupQueue(guildId);
        }
    });

    return queueConstruct;
}

async function playNext(serverQueue) {
    console.log('Playing the next song');
    const nextSong = serverQueue.queue[0];

    // Start fetching the audio stream
    const audioStream = ytdl(nextSong.videoDetails.video_url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1, // Adjust buffer size for smoother streaming
        dlChunkSize: 0,
    });

    console.log('Audio stream created');

    const resource = createAudioResource(audioStream);
    console.log('Audio resource created');

    // Play the resource
    serverQueue.player.play(resource);
    console.log('Audio resource played');
    serverQueue.connection.subscribe(serverQueue.player);
    console.log('Audio player subscribed');

    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`Now Playing: ${nextSong.videoDetails.title}`)
        .setURL(nextSong.videoDetails.video_url)
        .setImage(nextSong.videoDetails.thumbnails.at(-1).url);

    serverQueue.textChannel.send({ embeds: [embed] });
}

function cleanupQueue(guildId) {
    const serverQueue = queue.get(guildId);
    if (serverQueue) {
        serverQueue.connection.destroy();
        queue.delete(guildId);
    }
}

async function search(query) {
    const searchResults = await yts(query);
    return searchResults.videos[0]?.url || null;
}