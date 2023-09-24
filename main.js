const fs = require('fs');
const path = require('path');
const { Client, Collection, Events } = require('discord.js');
require('dotenv').config();

const apiKey = process.env.API_KEY;

const client = new Client(
    {
        intents:28397,
    }
)

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
        
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}



client.on('ready', ( client )=>{
    console.log(`Logeado como: ${client.user.tag}`);
})

client.on(Events.InteractionCreate, async interaction =>{
    if(!interaction.isChatInputCommand()) return;
    console.log(`${interaction}`);
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

    try{
        await command.execute(interaction);
    }catch(error){
        console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
    }
})

client.login(apiKey);