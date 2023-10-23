const { SlashCommandBuilder, AttachmentBuilder} = require("discord.js");
const Canvas = require('@napi-rs/canvas');

module.exports ={
    data : new SlashCommandBuilder()
        .setName('couple')
        .setDescription('Tag a friend to play rock, paper, scissors!'),
    async execute(interaction){
        const canvas = Canvas.createCanvas(700,300);
        const context = canvas.getContext("2d");

        const background = await Canvas.loadImage('./images/uwu.jpg');

        context.drawImage(background, 0, 0, canvas.width, canvas.height);
        
        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });

        interaction.reply({files:[attachment]});

    }
}