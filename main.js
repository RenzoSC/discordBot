const Discord = require('discord.js');
require('dotenv').config();
const apiKey = process.env.API_KEY;
const Client = new Discord.Client(
    {
        intents:28397,
    };
)

Client.on('ready', async( client )=>{
    console.log('Estoy listo!');
})

Client.login(apiKey);