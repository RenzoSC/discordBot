const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder} = require("discord.js");


function embedWinner(win,user,winmoji,losmoji){
    let embedmsg;
    if(win == 0){
        embedmsg = new EmbedBuilder()
            .setTitle(`Ya tenemos a un ganador!`)
            .setColor('#FFDE33')
            .setDescription(`**${user.username}** => ${winmoji}\t**Bot** => ${losmoji}\n**EL RESULTADO ES!!!**\n\nUn empate!!\nPar de boludos eligieron ${winmoji}`)
    }else if(win == 1){
        embedmsg = new EmbedBuilder()
            .setTitle('Ya tenemos a un ganador!')
            .setColor('#FFDE33')
            .setDescription(`**${user.username}** => ${winmoji}\t**Bot** => ${losmoji}\n**EL GANADOR ES!!!**\n**${user.username}!!**\tMansa paliza le pegaste al bot`)
    }else{
        embedmsg = new EmbedBuilder()
            .setTitle('Ya tenemos a un ganador!')
            .setColor('#FFDE33')
            .setDescription(`**${user.username}** => ${losmoji}\t**Bot** => ${winmoji}\n**EL GANADOR ES!!!**\n**Bot!!**\tComo te va a ganar un bot, por eso te gorrean gil`)
    }
    return embedmsg;
}
module.exports = {
    data : new SlashCommandBuilder()
        .setName('rpsalone')
        .setDescription('Tag a friend to play rock, paper, scissors!'),

    async execute(interaction){

        const rock = new ButtonBuilder()
	    .setCustomId('rock')
	    .setStyle(ButtonStyle.Primary)
	    .setEmoji('🪨');
        const paper = new ButtonBuilder()
        .setCustomId('paper')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🧻')
        const scissors = new ButtonBuilder()
        .setCustomId('scissors')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✂️')

        const user1 = interaction.user;
        const row = new ActionRowBuilder()
            .addComponents(rock, paper, scissors)

        const response = await interaction.reply({
            content : `${user1.toString()} vs BOT!!\nSelect your hand:\n`,
            components: [row],
        });
        
        const options = [{name:'rock', emoji:':rock:'}, {name:'paper', emoji:':roll_of_paper:'}, {name:'scissors', emoji:':scissors:'}];
        const fighter = options[Math.floor(Math.random() * options.length)];
        const collectorFilter = i => i.user.id === interaction.user.id;
        try{
            const emoji = await response.awaitMessageComponent({ filter : collectorFilter, time: 60000})

            if(emoji.customId == fighter.name){
                
                const embedmsg = embedWinner(0,user1,fighter.emoji,fighter.emoji);
                await emoji.update({ content: `${user1.toString()} vs BOT!!`, components: [], embeds: [embedmsg] });

            }else if(emoji.customId == 'rock' && fighter.name == 'scissors'){

                const embedmsg = embedWinner(1,user1,':rock:',fighter.emoji);
                await emoji.update({ content: `${user1.toString()} vs BOT!!`, components: [], embeds: [embedmsg] });
            
            }else if(emoji.customId == 'scissors' && fighter.name == 'rock'){
            
                const embedmsg = embedWinner(-1,user1,fighter.emoji,':scissors:');
                await emoji.update({ content: `${user1.toString()} vs BOT!!`, components: [], embeds: [embedmsg] });
            
            }else if(emoji.customId == 'rock' && fighter.name == 'paper'){
            
                const embedmsg = embedWinner(-1,user1,fighter.emoji,':rock:');
                await emoji.update({ content: `${user1.toString()} vs BOT!!`, components: [], embeds: [embedmsg] });
            
            }else if(emoji.customId == 'paper' && fighter.name == 'rock'){
                
                const embedmsg = embedWinner(1, user1, ':roll_of_paper:', fighter.emoji);
                await emoji.update({ content: `${user1.toString()} vs BOT!!`, components: [], embeds: [embedmsg] });
            
            }else if(emoji.customId == 'paper' && fighter.name == 'scissors'){
                
                const embedmsg = embedWinner(-1, user1, fighter.emoji, ':roll_of_paper:');
                await emoji.update({ content: `${user1.toString()} vs BOT!!`, components: [], embeds: [embedmsg] });
            
            }else if(emoji.customId == 'scissors' && fighter.name == 'paper'){
                
                const embedmsg = embedWinner(1, user1, ':scissors:',fighter.emoji);
                await emoji.update({ content: `${user1.toString()} vs BOT!!`, components: [], embeds: [embedmsg] });
            }

        }catch(e){
            await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        }

    }
}
