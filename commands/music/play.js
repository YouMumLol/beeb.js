const { SlashCommandBuilder, EmbedBuilder  } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require("@distube/ytdl-core");
const queue = require('../../queue')
const yts = require("yt-search");

const youtubePrefix = 'https://www.youtube.com/watch?v=';

module.exports = {
    data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a youtube song!')
    .addStringOption(option => 
        option.setName('query')
        .setDescription('The name or url of a youtube video you want to play')
        .setRequired(true)
        .setAutocomplete(true)),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        if(focusedValue !== null && focusedValue.length > 0) {
            const searchResults = await yts(focusedValue);
            const choices = searchResults.videos.map(video => video.title);
            await interaction.respond(
                choices.map(choice => ({ name: choice, value: choice })),
            );
        } else{
            await interaction.respond([]);
        }
		// const choices = ['Popular Topics: Threads', 'Sharding: Getting started', 'Library: Voice Connections', 'Interactions: Replying to slash commands', 'Popular Topics: Embed preview'];
		// const filtered = choices.filter(choice => choice.startsWith(focusedValue));
		// await interaction.respond(
		// 	filtered.map(choice => ({ name: choice, value: choice })),
		// );
    },

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const memberVoiceChannel = interaction.member.voice.channel;

        if (!memberVoiceChannel) {
            await interaction.reply({ content: 'You need to be in a voice channel to use this command!', ephemeral: true });
            return;
        }

        await interaction.deferReply();

        const serverQueue = queue.get(guildId);
        
        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });
        
        
        input = interaction.options.getString('query');
        let url;
        if (input.includes('https://')) {
            url = input;
        } else {
            console.log('Searching for: ' + input);
            url = await search(input);
        }
        
        const audioStream = ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25, // Increase buffer size
        });
        
        const info = await new Promise((resolve, reject) => {
            audioStream.on('info', (info) => resolve(info)); // Resolve the promise with the info
            audioStream.on('error', (error) => reject(error)); // Reject the promise if an error occurs
        });
        
        const details = info.videoDetails;
        const resource = createAudioResource(audioStream);
        
        if (!serverQueue) {
            // Listen for player events just once
            const player = createAudioPlayer();
            const queueConstruct = {
                connection,
                player,
                channel: interaction.channel,
                queue: [],
            };
            
            queue.set(guildId, queueConstruct);
            addPlayerListeners(player, guildId);
            queueConstruct.queue.push({ resource: resource, videoDetails: details });
            play(guildId, player, resource, details);
        } else {
            serverQueue.queue.push({ resource: resource, videoDetails: details });
        }

        await interaction.editReply({ content: `🎶 | Added **${details.title}** to the queue.`, ephemeral: false });
    },
};

// Function to start or continue playing the next song in the queue
function play(guildId, player, resource, videoDetails) {
    console.log('Play function called');
    console.log(guildId);
    const serverQueue = queue.get(guildId);
    console.log(serverQueue);

    if (!resource) {
        console.log('No resource found');
        queue.delete(guildId); 
        return;
    }

    const exampleEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Now Playing ***' + videoDetails.title + '***')
        .setURL(videoDetails.video_url)
        .setImage(videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url);

    serverQueue.channel.send({ embeds: [exampleEmbed] });

    player.play(resource);
    serverQueue.connection.subscribe(player);
}

// Function to add event listeners to the player (only once)
function addPlayerListeners(player, guildId) {
    const serverQueue = queue.get(guildId);


    player.on('error', (error) => {
        console.error('Error occurred:', error);
        serverQueue.connection.destroy();
        queue.delete(serverQueue.guildId);
    });

    player.on(AudioPlayerStatus.Playing, () => {
        console.log('Player is playing');
    });

    player.on(AudioPlayerStatus.Idle, () => {
        console.log('Player went idle, song finished');
        console.log('Queue:', serverQueue.queue.length);
        serverQueue.queue.shift(); // Remove the song that just finished

        if (serverQueue.queue.length > 0) {
            // Play next song if available
            play(guildId, player, serverQueue.queue[0].resource, serverQueue.queue[0].videoDetails);
        } else {
            console.log('Queue is empty, destroying connection');
            serverQueue.connection.destroy();
            queue.delete(guildId);
            console.log(queue);
        }
    });
}

const search = async (query) => {
    const searchResults = await yts(query);
    return searchResults.videos[0].url;
}
