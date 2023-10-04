const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require("discord.js");

module.exports = {
    data : new SlashCommandBuilder()
        .setName('rps')
        .setDescription('Tag a friend to play rock, paper, scissors!')
        .addUserOption((option) => option.setName('opponent').setDescription('Tag your friend!').setRequired(true)),
    async execute(interaction){

        const rock = new ButtonBuilder()
	    .setCustomId('rock')
	    .setStyle(ButtonStyle.Primary)
	    .setEmoji('✊');
        const paper = new ButtonBuilder()
        .setCustomId('paper')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✋')
        const scissors = new ButtonBuilder()
        .setCustomId('scissors')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✌')

        const user1 = interaction.user.toString()
        const user2 = interaction.options.getUser('opponent');
        const row = new ActionRowBuilder()
            .addComponents(rock, paper, scissors)

        const response = await interaction.reply({
            content : `${user1} vs ${user2}\nSelect your hand:\n`,
            components: [row],
        });
    }

}