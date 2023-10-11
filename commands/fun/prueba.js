const { SlashCommandBuilder, EmbedBuilder, MessagePayload, MessageFlags} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("prueba")
    .setDescription("Comando de prueba, arroba a un usuario")
    .addUserOption(option =>option.setName('opponent').setDescription('tag a friend').setRequired(true)),

    async execute(interaction){
        const user1 = interaction.user;
        const user2 = interaction.options.getUser('opponent');

        const message = new MessagePayload(user2, {
            content: '¡Chau!',
            embeds:[
                {
                    title: 'Mensaje para ti',
                    description: 'Este mensaje solo puedes verlo tú.',
                    color: 0x00FF00, 
                },
            ],
            flags:MessageFlags.Ephemeral,
        });
        
        await interaction.reply({
            content: '¡Hola!',
            embeds: [
                {
                    title: 'Mensaje para ti',
                    description: 'Este mensaje solo puedes verlo tú.',
                    color: 0x00FF00, 
                },
            ],
            ephemeral: true, 
        });
        
        await interaction.followUp(message);
    }
}