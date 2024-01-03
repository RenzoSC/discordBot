const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const { generateDependencyReport, VoiceConnectionStatus, joinVoiceChannel, AudioPlayerStatus, } = require('@discordjs/voice');
const { QueryType, QueueRepeatMode, Util } = require('discord-player');

module.exports ={
    data: new SlashCommandBuilder().setName('play')
    .setDescription('Plays a song')
    .addSubcommand(subcommand =>
        subcommand
            .setName('search')
            .setDescription('searchs and plays a song')
            .addStringOption(option=>
                option
                    .setName('searchterms')
                    .setDescription('search a song')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('playlist')
            .setDescription('plays a playlist')
            .addStringOption(option=>
                option
                    .setName('url')
                    .setDescription('playlist url')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('song')
            .setDescription('plays a song from YT')
            .addStringOption(option=>
                option
                    .setName('url')
                    .setDescription('song\'s url')
                    .setRequired(true)
            )
    ),

    async execute(interaction){
        //console.log(generateDependencyReport());
        const channel = interaction.member.voice.channel; //canal en el que está el chabón que llamó el codigo
        const guild = interaction.member.guild;
        const client = interaction.client;
        
        if(!channel){
            await interaction.reply({
                content:"no estás en ningún canal wachin!!\n bobo"
            })
            return;
        }

        const queue = client.player.queues.create(guild,{
            repeatMode:QueueRepeatMode.OFF,
        });

        if(!queue.connection)aaa= await queue.connect(channel,{
            deaf:false,
        });
        
        if(interaction.options.getSubcommand()=="song"){
            let url = interaction.options.getString("url");

            const result = await client.player.search(url,{
                requestedBy:interaction.user,
                searchEngine:QueryType.YOUTUBE_VIDEO,
                fallbackSearchEngine:'youtube'
            })
            
            if(result.tracks.length == 0)return interaction.reply({
                content:"no results"
            });

            const song = result.tracks[0];
            await queue.addTrack(song);
            console.log(result.tracks);
            if(!queue.isPlaying()){
                await queue.play(channel.toString(),result.tracks)
            };
        }
    }
}