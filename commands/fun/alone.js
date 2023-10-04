const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require("discord.js");

module.exports = {
    data : new SlashCommandBuilder()
        .setName('rpsalone')
        .setDescription('Tag a friend to play rock, paper, scissors!'),

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
        const row = new ActionRowBuilder()
            .addComponents(rock, paper, scissors)

        const response = await interaction.reply({
            content : `${user1} vs BOT!!\nSelect your hand:\n`,
            components: [row],
        });
        
        const options = [{name:'rock', emoji:'✊'}, {name:'paper', emoji:'✋'}, {name:'scissors', emoji:'✌'}];
        const fighter = options[Math.floor(Math.random() * options.length)];
        const collectorFilter = i => i.user.id === interaction.user.id;
        try{
            const emoji = await response.awaitMessageComponent({ filter : collectorFilter, time: 60000})

            if(emoji.customId == fighter.name){
                await emoji.update({ content: `${user1} eligió ${fighter.emoji}\tBot eligió ${fighter.emoji}\nEL RESULTADO ES!!!\n\nUn empate!!\nPar de boludos eligieron ${fighter.emoji}`, components: [] });
            }else if(emoji.customId == 'rock' && fighter.name == 'scissors'){
                await emoji.update({ content: `${user1} eligió ✊\tBot eligió ${fighter.emoji}\nEL RESULTADO ES!!!\nAhhhhhh la buena piedra... Nada le gana a la piedra\n${user1} le ganó al bot!`, components: [] });
            }else if(emoji.customId == 'scissors' && fighter.name == 'rock'){
                await emoji.update({ content: `${user1} eligió ✌\tBot eligió ${fighter.emoji}\nEL RESULTADO ES!!!\nQue tan boludo se tiene que ser para que te gane un bot...\nEl bot le ganó a ${user1}!`, components: [] });
            }else if(emoji.customId == 'rock' && fighter.name == 'paper'){
                await emoji.update({ content: `${user1} eligió ✊\tBot eligió ${fighter.emoji}\nEL RESULTADO ES!!!\nNAOOOOO le ganaron a la piedraaa\nEl bot le ganó a ${user1}!`, components: [] });
            }else if(emoji.customId == 'paper' && fighter.name == 'rock'){
                await emoji.update({ content: `${user1} eligió ✋\tBot eligió ${fighter.emoji}\nEL RESULTADO ES!!!\nNo sé como hiciste pero le ganaste a la piedra\n${user1} le ganó al bot!`, components: [] });
            }else if(emoji.customId == 'paper' && fighter.name == 'scissors'){
                await emoji.update({ content: `${user1} eligió ✋\tBot eligió ${fighter.emoji}\nEL RESULTADO ES!!!\nUna vez más pierden los malos...\nEl bot le ganó a ${user1}!`, components: [] });
            }else if(emoji.customId == 'scissors' && fighter.name == 'paper'){
                await emoji.update({ content: `${user1} eligió ✌\tBot eligió ${fighter.emoji}\nEL RESULTADO ES!!!\nRe de puto elegir tijera...\n${user1} le ganó al bot!`, components: [] });
            }

        }catch(e){
            await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        }

    }
}