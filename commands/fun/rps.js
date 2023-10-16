const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessagePayload,  MessageFlags,EmbedBuilder} = require("discord.js");

module.exports = {
    data : new SlashCommandBuilder()
        .setName('rps')
        .setDescription('Tag a friend to play rock, paper, scissors!')
        .addUserOption((option) => option.setName('opponent').setDescription('Tag your friend!').setRequired(true)),
    async execute(interaction){

        const rock = new ButtonBuilder()
	    .setCustomId('rock')
	    .setStyle(ButtonStyle.Primary)
	    .setEmoji('🪨');
        const paper = new ButtonBuilder()
        .setCustomId('paper')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🧻');
        const scissors = new ButtonBuilder()
        .setCustomId('scissors')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✂️');


        const user1 = interaction.user;
        const user2 = interaction.options.getUser('opponent');
        const row = new ActionRowBuilder()
            .addComponents(rock, paper, scissors);

        const row_opponent = new ActionRowBuilder()
            .addComponents(rock,paper, scissors);

        const response_user = await interaction.reply({
            content : `${user1} vs ${user2}\nSelect your hand:\n`,
            components: [row],
            ephemeral:true,
        });

        const message = new MessagePayload(user2, {
            content: `${user1} vs ${user2}\nSelect your hand:\n`,
            components: [row_opponent],
            flags:MessageFlags.Ephemeral,
        });

        const response_opp = await interaction.followUp(message);

        const collectorFilter = (i) => i.customId == 'rock' || i.customId == 'paper' || i.customId == 'scissors';
        

        const emoji = {'rock':'🪨', 'scissors':'✂️','paper':'🧻'}
        
        try{
            const emoji_user = await response_user.awaitMessageComponent({
                filter:collectorFilter, time: 60000
            })
           
            const emoji_opp = await response_opp.awaitMessageComponent({
                filter:collectorFilter, time: 60000,
            })
            

            if(emoji[emoji_user.customId] == emoji[emoji_opp.customId]){

                embedWinner(0, user1, user2, emoji[emoji_user.customId], emoji[emoji_opp.customId], interaction);

            }else if(emoji_user.customId == 'rock' && emoji_opp.customId == 'scissors'){

                embedWinner(1, user1, user2, emoji[emoji_user.customId], emoji[emoji_opp.customId], interaction);

            }else if(emoji_user.customId == 'scissors' && emoji_opp.customId == 'rock'){

                embedWinner(-1,user1,user2, emoji[emoji_opp.customId], emoji[emoji_user.customId], interaction);

            }else if(emoji_user.customId == 'rock' && emoji_opp.customId == 'paper'){

                embedWinner(-1,user1,user2,emoji[emoji_opp.customId], emoji[emoji_user.customId], interaction);

            }else if(emoji_user.customId == 'paper' && emoji_opp.customId == 'rock'){

                embedWinner(1,user1,user2,emoji[emoji_user.customId], emoji[emoji_opp.customId], interaction);

            }else if(emoji_user.customId == 'paper' && emoji_opp.customId == 'scissors'){

                embedWinner(-1,user1,user2,emoji[emoji_opp.customId],emoji[emoji_user.customId], interaction);

            }else if (emoji_user.customId == 'scissors' && emoji_opp.customId == 'paper'){

                embedWinner(1, user1, user2, emoji[emoji_user.customId], emoji[emoji_opp.customId], interaction);
                
            }

        }catch(e){
            await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        }
    }

}


async function embedWinner(win,user,opp,winmoji,losmoji, interaction){
    let embedmsg;
    if(win == 0){
        embedmsg = new EmbedBuilder()
            .setTitle(`Ya tenemos a un ganador!`)
            .setColor('#FFDE33')
            .setDescription(`**${user.username}** => ${winmoji}\t**${opp.username}** => ${losmoji} \n **EL RESULTADO ES!!!** \n \n Un empate!! \n Par de boludos eligieron ${winmoji}`)
    }else if(win == 1){
        embedmsg = new EmbedBuilder()
            .setTitle('Ya tenemos a un ganador!')
            .setColor('#FFDE33')
            .setDescription(`**${user.username}** => ${winmoji}\t**${opp.username}** => ${losmoji}\n**EL GANADOR ES!!!**\n**${user.username}!!**\tMansa paliza le pegaste a **${opp.username}**`)
    }else{
        embedmsg = new EmbedBuilder()
            .setTitle('Ya tenemos a un ganador!')
            .setColor('#FFDE33')
            .setDescription(`**${user.username}** => ${losmoji}\t**${opp.username}** => ${winmoji}\n**EL GANADOR ES!!!**\n**${opp.username}**\tComo te va a ganar un **${opp.username}**, por eso te gorrean gil`)
    }
    await interaction.followUp({ content: `${user.username} vs ${opp.username}`, components: [], embeds: [embedmsg] });
}