const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
    .setName('mood')
    .setDescription('There is always a meme that describes your mood...'),
    async execute(interaction){
        try{
            const rawdata = fs.readFileSync('images/dogs.json');
            const imagesdata = JSON.parse(rawdata).images;
           
            const image = Math.floor(Math.random() * (imagesdata.length))
            const selectedImage = imagesdata[image];
            const embedmsg = new EmbedBuilder().setTitle("This meme is you lmao")
            .setColor(selectedImage.color)
            .setDescription(selectedImage.text)
            .setImage(selectedImage.url)
            interaction.reply({ embeds: [embedmsg]});
        }catch(error){
            console.log(error);
            interaction.reply('Hubo un error al cargar las imágenes.');
        }

        
    }
}