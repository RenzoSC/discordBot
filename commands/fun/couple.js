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
        .setDescription('Tag a friend!')
        .addUserOption((option) => option.setName('friend').setDescription('Tag your friend!').setRequired(true)),

    async execute(interaction){
        const canvas = Canvas.createCanvas(700,400);
        const context = canvas.getContext("2d");
        
        let user_img = gif_to_png(interaction.user.avatarURL({extension: 'png'}));
        let target_img = gif_to_png(interaction.options.getUser('friend').avatarURL({extension: 'png'}))

        const background = await Canvas.loadImage('./images/uwu.jpg');

        const heart = await Canvas.loadImage('./images/heart.png');

        user_img = await Canvas.loadImage(user_img);
        target_img = await Canvas.loadImage(target_img);

        context.imageSmoothingEnabled = true; // Habilitar el antialiasing
        context.drawImage(background, 0, 0, canvas.width, canvas.height);

        // Dibujar el marco circular para la imagen del usuario
        context.save(); // Guardar el estado actual del contexto
        context.beginPath();
        context.arc(125, canvas.height / 2 , 100, 0, Math.PI * 2, true);
        context.closePath();
        context.clip(); // Aplicar el recorte al círculo

        // Dibujar la imagen del usuario
        context.drawImage(user_img, 25, canvas.height / 2 - 100, 200, 200);

        context.restore(); // Restaurar el estado original del contexto

        // Dibujar el marco circular para la imagen del amigo
        context.save(); // Guardar el estado actual del contexto
        context.beginPath();
        context.arc(canvas.width - 125, canvas.height / 2, 100, 0, Math.PI * 2, true);
        context.closePath();
        context.clip(); // Aplicar el recorte al círculo

        // Dibujar la imagen del amigo
        context.drawImage(target_img, canvas.width - 225, canvas.height / 2 - 100, 200, 200);

        context.restore(); // Restaurar el estado original del contexto

        context.save(); // Guardar el estado actual del contexto
        context.drawImage(heart, canvas.width/2 -55, canvas.height/2 -55, 110,100);
        context.restore();

        // Agregar texto uwu en el centro del lienzo
        context.font = '30px Arial';
        context.fillStyle = '#000000'; // Color del texto
        context.textAlign = 'center';
        context.fillText('uwu', canvas.width / 2, canvas.height / 2 + 150);

        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });

        interaction.reply({files:[attachment]});

    }
}