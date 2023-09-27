const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('echolol')
    .setDescription('Replies with your input!')
    .addStringOption(option =>
        option.setName('input')
        .setDescription('The input to echo back!')
    ),
    async execute(interaction){
        await interaction.reply(interaction.options.getString('input') ?? 'No string passed');
    }    
};