const {SlashCommandBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder, AttachmentBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder} = require("discord.js");

const Canvas = require('@napi-rs/canvas');

class Player{
    constructor(player, iconImg){
        this.player = player;
        this.icon = iconImg;
        this.hand = {"unused":[], "used":[]};
        this.points = 0;
    }

    addCard(card){
        this.hand.unused.push(card);
    }

    addPoints(points){
        this.points += points;
    }

    useCard(card){
        this.hand.unused = this.hand.unused.filter(x => x!= card);
        this.hand.used.push(card);
    }

    get getPoints(){
        return this.points;
    }

    get getHand(){
        return this.hand.unused;
    }

    get getUsedHand(){
        return this.hand.used;
    }

    get getTotalCards(){
        return this.hand.unused.length;
    }

    get getCardPoints(){
        
    }
}

class Card{
    constructor(palo,value){
        this.type = palo;
        this.value = value;
        this.image = `./images/cards/${palo}/${value}.jpg`;
    }

    get getType(){
        return this.type;
    }

    get getValue(){
        return this.value;
    }

    get getImage(){
        return this.image;
    }
} 

class Baraja{
    constructor(){
        this.cartas = [];

        this.init();
    }

    init(){
        const palos = ['bastos', 'copas', 'espadas', 'oros'];
        const valores = [1,2,3,4,5,6,7,10,11,12];

        for (const palo of palos){
            for(const valor of valores){
                this.cartas.push(new Card(palo,valor));
            }
        }
    }

    /*Looked at this implementation http://informatica.uv.es/iiguia/FP/BarajarCartas.pdf */
    mezclar(){
        for (let i = this.cartas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            // Intercambiar las posiciones de las cartas i y j
            [this.cartas[i], this.cartas[j]] = [this.cartas[j], this.cartas[i]];
        }
    }

    repartir(user,rival, cortar){
        if(cortar){
            for (let i = 0; i < 3; i++) {
                user.addCard(this.cartas.pop());
                rival.addCard(this.cartas.pop());
            }
        }else{
            for (let i = 0; i < 3; i++) {
                user.addCard(this.cartas.pop());
            }
            for (let i = 0; i < 3; i++) {
                rival.addCard(this.cartas.pop());
            }
        }
    }
}

class Table{
    constructor(user, iconUser, rival, iconRival){
        this.user = new Player(user, iconUser);
        this.rival = new Player(rival, iconRival);
        this.round = 0;
        this.firstStageWon = user;
        this.winTrack = [];
        this.baraja = new Baraja();
        this.pointsRoundIG = 1;
    }

    startGame(cortar){
        this.baraja.mezclar();
        this.baraja.repartir(this.user, this.rival, cortar);
    }

    nextRound(){
        this.round +=1;
    }

    winRound(winner){
        this.winTrack.push(winner);
        if(this.winTrack.length == 1){
            this.firstStageWon = winner;
        }
    }
    
    endHandNormal(empate,points){
        if(empate){
            this.firstStageWon.addPoints(points);
        }else{
            let counter= 0;
            for (const u in this.winTrack) {
                if (u == this.user) {
                    counter +=1
                }
            }

            if(counter == 2){
                this.user.addPoints(points);
            }else{
                this.rival.addPoints(points);
            }
        }
        this.round = 0;
        this.winTrack = [];
        this.pointsRoundIG = 1;
        this.winTrack = [];
    }

    endHandNoTruco(caller){
        this.caller.addPoints(2);
        this.round = 0;
        this.winTrack = [];
        this.pointsRoundIG = 1;
        this.winTrack = [];
    }

    

    playEnvido(caller,quiero,call,callerrival){
        let pointsW, pointsL;
        if(call == "envido"){
            pointsW =2;
            pointsL = 1;
        }else if(call == "real"){
            pointsW =3;
            pointsL = 1;
        }else if(call == "falta"){
            pointsW = 15 -callerrival.getPoints;
            pointsL = 1;
        }else if(call == "envido2"){
            pointsW =4;
            pointsL = 2;
        }else if(call == "envidoreal"){
            pointsW =5;
            pointsL = 2;
        }else if(call == "realfalta"){
            pointsW = 15 -callerrival.getPoints;
            pointsL = 3;
        }

        if(quiero){
            if(this.user.getCardPoints < this.rival.getCardPoints){
                this.rival.addPoints(pointsW);
            }else if(this.rival.getCardPoints < this.user.getCardPoints){
                this.user.addPoints(pointsW);
            }else{
                caller.addPoints(pointsW);
            }
        }else{
            caller.addPoints(pointsL);
        }
    }

    playTruco(quiero, caller){
        this.pointsRoundIG +=1;
        if(!quiero){
            this.endHandNoTruco(caller);
        }
    }

    async showTable(interaction){
        const canvas = Canvas.createCanvas(700,400);
        const context = canvas.getContext("2d");

        const bgtable = await Canvas.loadImage('./images/table.jpg');
        const cartadef= await Canvas.loadImage('./images/dorso.jpg');

        let cartaUser;
        let cartaRival;

        context.imageSmoothingEnabled = true;
        context.drawImage(bgtable, 0, 0, canvas.width, canvas.height);
        for (let i = 0; i < this.user.getHand.length; i++) {
            context.drawImage(cartadef,200 + 110*i, 50, 70, 110);
        }
        for (let i = 0; i < this.user.getUsedHand.length; i++) {
            cartaUser = await Canvas.loadImage(this.user.getHand[i].getImage);
            context.drawImage(cartaUser,200 + 110*i +110*this.user.getHand.length, 50, 70, 110);
        }
        
        for (let i = 0; i < this.rival.getHand.length; i++) {
            context.drawImage(cartadef,200 + 110*i, canvas.height - 160, 70, 110);
        }
        for (let i = 0; i < this.rival.getUsedHand.length; i++) {
            cartaRival = await Canvas.loadImage(this.user.getHand[i].getImage);
            context.drawImage(cartaRival,200 + 110*i +110*this.rival.getHand.length, canvas.height-160, 70, 110);
        }
        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });
        await interaction.followUp({files:[attachment]});
    }

    async sendCardsTo(user, player){
        const canvas = Canvas.createCanvas(600,400);
        const context = canvas.getContext("2d");

        const dmUser = await user.createDM(false);
        let playerCards = player.getHand;
        
        const bghand = await Canvas.loadImage('./images/table.jpg');
        
        context.drawImage(bghand, 0,0, canvas.width, canvas.height);
        let i=0;
        for(let card of playerCards){

            let cardImg = await Canvas.loadImage(card.getImage);
            context.drawImage(cardImg, 100+160*i,120,110,160);
            i++;
        }
        const attachment = new AttachmentBuilder(await canvas.encode('png'), {name:'cards.png'});
        
        dmUser.send({
            files:[attachment],
        });
    }

    get getRound(){
        return this.round;
    }
    
    get getUser(){
        return this.user;
    }
    
    get getRival(){
        return this.rival;
    }
}


function gif_to_png(url){
    let newurl = url;

    if (newurl.includes('.gif')){
        newurl = url.replace('.gif', '.png');
    }
    return newurl;
}

module.exports = {
    data: new SlashCommandBuilder()
    .setName('truco')
    .setDescription('Arrobá a algun wachin para jugar al truco pa')
    .addUserOption((option)=>option.setName("friend").setDescription("Pana para jugar al truco").setRequired(true)),

    async execute(interaction){
        const user = interaction.user;
        const rival = interaction.options.getUser('friend');
        const iconUser =  gif_to_png(user.avatarURL({extension: 'png'}));
        const iconRival =  gif_to_png(rival.avatarURL({extension: 'png'}));
        
        let game = new Table(user, iconUser, rival, iconRival);
        
        const cortar = new ButtonBuilder()
        .setCustomId('cortar')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🟢');

        const nocortar = new ButtonBuilder()
        .setCustomId('nocortar')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔴');

        const cortarRow = new ActionRowBuilder()
        .addComponents(cortar,nocortar);

        const rivalresponse = await interaction.reply({
            content:`${rival}\nVas a cortar o no?\n`,
            components : [cortarRow],
        })

        const collectorRivalFilter = (i) => i.user.id == rival.id && i.user.id != user.id;

        try{
            const cortarInteraction = await rivalresponse.awaitMessageComponent({ collectorRivalFilter, componentType: 2, time: 60000 });


            const respCortar = cortarInteraction.customId;

            if(respCortar == "cortar"){
                game.startGame(true);
                cortarInteraction.update({
                    content: "Cortamos la mano!",
                    components: []
                });
            }else{
                game.startGame(false);
                cortarInteraction.update({
                    content: "No cortamos la mano!",
                    components: []
                })
            }

            await game.showTable(interaction);

            await game.sendCardsTo(user, game.user);
            await game.sendCardsTo(rival, game.rival);

            let cardButtonSelect = new StringSelectMenuBuilder()
			.setCustomId('starter')
			.setPlaceholder('Make a selection!')
			.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel('Primera carta')
					.setValue('0'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Segunda carta')
					.setValue('1'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Tercera carta')
					.setValue('2'),
                new StringSelectMenuOptionBuilder()
					.setLabel('Envido')
					.setValue('envido'),
                new StringSelectMenuOptionBuilder()
					.setLabel('Truco')
					.setValue('truco'),
                new StringSelectMenuOptionBuilder()
					.setLabel('Salir')
					.setValue('salir'),
			);

            let firstRoundRow = new ActionRowBuilder()
            .setComponents(cardButtonSelect)
            
            let firstRoundEmbed = new EmbedBuilder()
            .setTitle('Primera mano!')
            .setColor('#FFDE33')
            .setDescription(`${user} vs ${rival} jugando un trucardo`)

            await interaction.followUp(
                {
                    content:`${rival} elige tu jugada:`,
                    components:[firstRoundRow],
                    embeds:[firstRoundEmbed]
                }
            )

        }catch(e){
            console.log(e);
            await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        }
    }
}