const { SlashCommandBuilder, EmbedBuilder  } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType, AudioPlayerStatus} = require('@discordjs/voice');
const ytdl = require("@distube/ytdl-core");
const queue = require('../../queue')
const youtubesearchapi = require("youtube-search-api");

const youtubePrefix = 'https://www.youtube.com/watch?v=';


module.exports = {
    data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a youtube song!')
    .addStringOption(option => 
        option.setName('query')
        .setDescription('The name or url of a youtube video you want to play')
        .setRequired(true)),

        async execute(interaction) {
            const guildId = interaction.guild.id;
            const memberVoiceChannel = interaction.member.voice.channel;

            if(!memberVoiceChannel){
                await interaction.reply({content:'You need to be in a voice channel to use this command!', ephemeral: true});
                return;
            }

            await interaction.deferReply();
            
            const serverQueue = queue.get(guildId);

            const player = createAudioPlayer();
            const connection = joinVoiceChannel({
                channelId: interaction.member.voice.channel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            })
            // connection.subscribe(player);
            
            input = interaction.options.getString('query');
            if(input.includes('https://')){
                url = input;
            } else{
                console.log('Searching for: ' + input);
                url = await search(input);
            }
            console.log(url);
            const audioStream = await ytdl(url, {
                filter: 'audioonly',
                // fmt: 'mp3',
                // highWaterMark: 1 << 30,
                // liveBuffer: 20000,
                dlChunkSize: 0,
                quality: 'lowestaudio',
            });
            audioStream.on('error', (error) => {
                console.error('Stream error:', error);
            });
            
            audioStream.on('end', () => {
                console.log('Stream ended');
            });
            const info = await new Promise((resolve, reject) => {
                audioStream.on('info', (info) => {
                    resolve(info); // Resolve the promise with the info
                });
            
                audioStream.on('error', (error) => {
                    reject(error); // Reject the promise if an error occurs
                });
            });
            const details = info.videoDetails;
            const resource = createAudioResource(audioStream);

            if(!serverQueue){
                const queueConstruct = {
                    connection,
                    player,
                    channel: interaction.channel,
                    queue: [],
                };

                queue.set(guildId, queueConstruct);
                
                queueConstruct.queue.push({resource:resource, videoDetails: details});
                
                play(guildId, player, resource, details);
                
            } else{
                serverQueue.queue.push({resource:resource, videoDetails: details});
            }
            await interaction.editReply({ content: `🎶 | Added **${details.title}** to the queue.`, ephemeral: false });
	},
};

// Function to start or continue playing the next song in the queue
async function play(guildId, player, resource, videoDetails) {
    console.log('Play hath been called');
    const serverQueue = queue.get(guildId);
    console.log('serverQueue obtained');

    if (!resource) {
        console.log('No resource');
        queue.delete(guildId); // If there's no resource, clear the queue for the guild
        return;
    }

    const exampleEmbed = new EmbedBuilder()
	.setColor('#ff0000')
	.setTitle('Now Playing ***' + videoDetails.title + '***')
	.setURL(videoDetails.video_url)
	.setImage(videoDetails.thumbnails[videoDetails.thumbnails.length-1].url)

    serverQueue.channel.send({ embeds: [exampleEmbed] });

    player.play(resource);

    serverQueue.connection.subscribe(player);

    // When the current song finishes, play the next one
    player.on(AudioPlayerStatus.Idle, () => {
        console.log('Song ended');
        serverQueue.queue.shift(); // Remove the played song
        if (serverQueue.queue.length > 0) {
            play(guildId, player, serverQueue.queue[0].resource, serverQueue.queue[0].videoDetails); // Play the next song
        } else {
            console.log('Queue ended');
            console.log(serverQueue.queue)
            serverQueue.connection.destroy(); // Leave the channel if the queue is empty
            queue.delete(guildId);
        }
    });

    player.on('error', (error) => {
        console.error(`Error: ${error}`);
        console.error(`Error: ${error.message}`);
        serverQueue.connection.destroy();
        queue.delete(guildId);
    });
}

const search = async (query) => {
    const searchResults = await youtubesearchapi.GetListByKeyword(query, false, 1, {type: 'video'});
    return youtubePrefix + searchResults.items[0].id;
}