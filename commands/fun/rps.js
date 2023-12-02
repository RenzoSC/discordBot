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


        const response_users = await interaction.reply({
            content : `${user1} vs ${user2}\nSelect your hand:\n`,
            components: [row],
        });


        const collectorFilter = (i) => i.user.id == user1.id || i.user.id == user2.id;
        

        const emoji = {'rock':'🪨', 'scissors':'✂️','paper':'🧻'}
        
        const waitForSelections = async ()=>{
            try{
                const selections = new Map();

                while (selections.size < 2){
                    const componentInteraction = await response_users.awaitMessageComponent({ collectorFilter, time: 60000 });

                    selections.set(componentInteraction.user.id, componentInteraction.customId);
                    componentInteraction.deferUpdate();
                    
                }

                const emoji_user = selections.get(user1.id);
                const emoji_opp = selections.get(user2.id);
                    
            
                if(emoji[emoji_user] == emoji[emoji_opp]){

                    embedWinner(0, user1, user2, emoji[emoji_user], emoji[emoji_opp], interaction);
        
                }else if(emoji_user == 'rock' && emoji_opp == 'scissors'){
        
                    embedWinner(1, user1, user2, emoji[emoji_user], emoji[emoji_opp], interaction);
        
                }else if(emoji_user == 'scissors' && emoji_opp == 'rock'){
        
                    embedWinner(-1,user1,user2, emoji[emoji_opp], emoji[emoji_user], interaction);
        
                }else if(emoji_user == 'rock' && emoji_opp == 'paper'){
        
                    embedWinner(-1,user1,user2,emoji[emoji_opp], emoji[emoji_user], interaction);
        
                }else if(emoji_user == 'paper' && emoji_opp == 'rock'){
        
                    embedWinner(1,user1,user2,emoji[emoji_user], emoji[emoji_opp], interaction);
        
                }else if(emoji_user== 'paper' && emoji_opp == 'scissors'){
        
                    embedWinner(-1,user1,user2,emoji[emoji_opp],emoji[emoji_user], interaction);
        
                }else if (emoji_user == 'scissors' && emoji_opp == 'paper'){
        
                    embedWinner(1, user1, user2, emoji[emoji_user], emoji[emoji_opp], interaction);
        
                }
            }catch(e){
                await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
            }
                
        }
        waitForSelections();
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