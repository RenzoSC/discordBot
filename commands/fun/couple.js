const { SlashCommandBuilder, AttachmentBuilder} = require("discord.js");
const Canvas = require('@napi-rs/canvas');

function gif_to_png(url){
    let newurl = url;
    if (newurl.includes('.gif')){
        newurl = url.replace('.gif', '.png');
    }
    return newurl;
}

module.exports ={
    data : new SlashCommandBuilder()
        .setName('couple')
        .setDescription('Tag a friend to play rock, paper, scissors!')
        .addUserOption((option) => option.setName('friend').setDescription('Tag your friend!').setRequired(true)),

    async execute(interaction){
        const canvas = Canvas.createCanvas(700,300);
        const context = canvas.getContext("2d");
        
        const user_img = gif_to_png(interaction.user.avatarURL({extension: 'png'}));
        const target_img = gif_to_png(interaction.options.getUser('friend').avatarURL({extension: 'png'}))

        console.log(user_img);
        console.log(target_img);

        const background = await Canvas.loadImage('./images/uwu.jpg');

        context.drawImage(background, 0, 0, canvas.width, canvas.height);
        
        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });

        interaction.reply({files:[attachment]});

    }
}