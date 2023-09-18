const Discord = require('discord.js');

const Client = new Discord.Client(
    {
        intents:28397
    }
)

Client.on('ready', async( client )=>{
    console.log("Estoy listo!");
})

Client.login("MTE1MzE0OTY1Njk5NDQxNDY1NA.GfQv04.Y3OazK9Od-5g03iGj5ZkLg1tcb6tENxAlOrIs0");