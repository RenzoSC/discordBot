const {Events} = require('discord.js');

module.exports = {
    name : Events.InteractionCreate,
    async export(intereaction){
        if(!intereaction.isChatInputCommand()) return;
        console.log(intereaction);
        const command = intereaction.client.commands.get(intereaction.commandName);
        
        if(!command){
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try{
            await command.execute(intereaction);
        } catch(error){
            console.error(`Error executing ${interaction.commandName}`);
			console.error(error);
        }
    }

}