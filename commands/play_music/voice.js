const {SlashCommandBuilder} = require('discord.js');
const { generateDependencyReport, VoiceConnectionStatus, joinVoiceChannel, AudioPlayerStatus, } = require('@discordjs/voice');

module.exports ={
    data: new SlashCommandBuilder().setName('play')
    .setDescription('Plays a song')
    .addStringOption(option =>
        option.setName('song')
        .setDescription('Ingresa un link de spotify o youtube!')
    ),
    async execute(interaction){
        //console.log(generateDependencyReport());
        const channel = interaction.member.voice.channel; //canal en el que está el chabón que llamó el codigo
        const guild = interaction.member.guild;

        if(channel){
            const connection = joinVoiceChannel({
                channelId:channel.id,
                guildId:guild.id,
                adapterCreator:guild.voiceAdapterCreator,
            })
            
            await interaction.reply({
                content:"Ya me conecté wacho"
            });
        }else{
            await interaction.reply({
                content:"no estas en un canal wachin"
            });
        }
    }
}