const {SlashCommandBuilder} = require('discord.js');
const wait = require('node:timers/promises').setTimeout;
module.exports = {
    data : new SlashCommandBuilder().setName('wtfping').setDescription('Experimentttttt'),
    async execute(interaction){
        await interaction.reply('WTFPONG');
        wait(4000);
        await interaction.followUp('WTFANOTHERPONG');
    }
}