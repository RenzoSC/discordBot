const {SlashCommandBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder, AttachmentBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder} = require("discord.js");

const Canvas = require('@napi-rs/canvas');

class Player{
    constructor(player, iconImg){
        this.player = player;
        this.icon = iconImg;
        this.hand = {"unused":[], "used":[]};
        this.points = 0;
        this.coincidences = {"bastos":{"n":0, "val":0},"copas":{"n":0, "val":0},"espadas":{"n":0, "val":0},"oros":{"n":0, "val":0}};
    }

    addCard(card){
        this.hand.unused.push(card);
    }

    addCoincidence(card){
        this.coincidences[card.getType]["n"] +=1;
        this.coincidences[card.getType]["val"] += card.getValue;
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
        let card1 = this.hand.unused[0];
        let card2 = this.hand.unused[1];
        let card3 = this.hand.unused[2];
        if(card1.getType == card2.getType && card2.getType == card3.getType){
            return Math.max(...[card1.getValue + card2.getValue, card1.getValue + card3.getValue, card2.getValue + card3.getValue]) +20;
        }else{
            const con = Object.values(this.coincidences).filter(x => x.n == 2);
            if(con.length == 1){
                return con["val"]+20;
            }else{
                const con = Object.values(this.coincidences).filter(x => x.n >= 1);
                return Math.max(...[con[0]["val"],con[1]["val"],con[2]["val"]]);
            }
        }
    }
}

class Card{
    constructor(palo,value,pointvalue){
        this.type = palo;
        this.value = pointvalue;
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
                if([10,11,12].includes(valor)){
                    this.cartas.push(new Card(palo,valor,0));
                }else{
                    this.cartas.push(new Card(palo,valor,valor));
                }
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
                let card = this.cartas.pop();
                user.addCard(card);
                user.addCoincidence(card);
                card = this.cartas.pop();
                rival.addCard(card);
                rival.addCoincidence(card)
            }
        }else{
            for (let i = 0; i < 3; i++) {
                let card = this.cartas.pop();
                user.addCard(card);
                user.addCoincidence(card);
            }
            for (let i = 0; i < 3; i++) {
                let card = this.cartas.pop();
                rival.addCard(card);
                rival.addCoincidence(card)
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
        this.pointsEnvido ={"envpoints":0,"toplayer":this.user};
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

    
    calcPointsInGame(){

    }

    playEnvido(quiero){
        if(quiero){
            this.pointsEnvido += 2;
        }else{
            this.pointsEnvido +=1;
        }
    }

    playRenvido(quiero){
        if(quiero){
            this.pointsEnvido += 3;
        }else{
            this.pointsEnvido +=1;
        }
    }

    playFenvido(quiero, against){
        if(quiero){
            this.pointsEnvido = 15 - against.getPoints;
        }else{
            this.pointsEnvido +=1;
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
        const respuesta = await interaction.followUp({files:[attachment]});
        return respuesta;
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

        const collectorRivalFilter = (i) => i.user.id == rival.id;
        const collectorUserFilter = (i) => i.user.id == user.id;

        try{
            const cortarInteraction = await rivalresponse.awaitMessageComponent({ collectorRivalFilter, componentType: 2, time: 60000 });


            const respCortar = cortarInteraction.customId;

            if(respCortar == "cortar"){
                game.startGame(true);
                await cortarInteraction.update({
                    content: "Cortamos la mano!",
                    components: []
                });
            }else{
                game.startGame(false);
                await cortarInteraction.update({
                    content: "No cortamos la mano!",
                    components: []
                })
            }

            const msgTable = await game.showTable(interaction);

            await game.sendCardsTo(user, game.user);
            await game.sendCardsTo(rival, game.rival);

            let cardSelect = new StringSelectMenuBuilder()
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
					.setLabel('Real envido')
					.setValue('real envido'),
                new StringSelectMenuOptionBuilder()
					.setLabel('Falta envido')
					.setValue('falta envido'),
                new StringSelectMenuOptionBuilder()
					.setLabel('Truco')
					.setValue('truco'),
                new StringSelectMenuOptionBuilder()
					.setLabel('Salir')
					.setValue('salir'),
			);

            let firstRoundRow = new ActionRowBuilder()
            .setComponents(cardSelect)
            
            let firstRoundEmbed = new EmbedBuilder()
            .setTitle('Primera mano!')
            .setColor('#FFDE33')
            .setDescription(`${user} vs ${rival} jugando un trucardo`);

            let round1response = await msgTable.reply(
                {
                    content:`${rival} elige tu jugada:`,
                    components:[firstRoundRow],
                    embeds:[firstRoundEmbed]
                }
            ); 
            
            const round1RivalInteraction = await round1response.awaitMessageComponent({ collectorRivalFilter, componentType: 3, time: 60000 });
            
            const envSelectResponse= new StringSelectMenuBuilder()
                .setCustomId('envResp')
                .setPlaceholder('Select your response!')
                .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Acepto')
                    .setValue('acepto'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('No acepto')
                    .setValue('rechazo'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Envido')
                    .setValue('envido'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Real envido')
                    .setValue('real envido'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Falta envido')
                    .setValue('falta envido'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Salir')
                    .setValue('salir'),
			);
            
            const envSelectResponse2= new StringSelectMenuBuilder()
                .setCustomId('envResp')
                .setPlaceholder('Select your response!')
                .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Acepto')
                    .setValue('acepto'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('No acepto')
                    .setValue('rechazo'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Real envido')
                    .setValue('real envido'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Falta envido')
                    .setValue('falta envido'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Salir')
                    .setValue('salir'),
			);

            const envSelectResponse3= new StringSelectMenuBuilder()
                .setCustomId('envResp')
                .setPlaceholder('Select your response!')
                .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Acepto')
                    .setValue('acepto'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('No acepto')
                    .setValue('rechazo'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Falta envido')
                    .setValue('falta envido'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Salir')
                    .setValue('salir'),
			);

            const envSelectResponse4= new StringSelectMenuBuilder()
                .setCustomId('envResp')
                .setPlaceholder('Select your response!')
                .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Acepto')
                    .setValue('acepto'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('No acepto')
                    .setValue('rechazo'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Salir')
                    .setValue('salir'),
			);

            round1response = await round1response.edit({
                content:`${rival} seleccionó ${round1RivalInteraction.values[0]}`,
                components:[],
                embeds:[]
            })

            if(round1RivalInteraction.values[0] == 'envido'){ //first round envido
                
                const envRow = new ActionRowBuilder()
                .addComponents(envSelectResponse);
                
                let userResponseMsg = await round1response.reply(
                    {
                        content:`${user} aceptas el ${round1RivalInteraction.values[0]}`,
                        components:[envRow],
                    }
                ); 

                const userResponseEnv = await userResponseMsg.awaitMessageComponent({collectorUserFilter,componentType:3,time:60000});
                
                userResponseMsg= await userResponseMsg.edit({
                    content:`${user} seleccionó ${userResponseEnv.values[0]}`,
                    components:[],
                    embeds:[]
                })
                
                if(userResponseEnv.values[0] == 'acepto' ){
                    game.playEnvido(true);
                }else if(userResponseEnv.values[0] == 'rechazo'){
                    game.playEnvido(false);
                }else if(userResponseEnv.values[0] == 'envido'){   //envido envido

                    const envRow2 = new ActionRowBuilder()
                    .addComponents(envSelectResponse2);

                    let rivalResponseEnv2msg = await userResponseMsg.reply(
                        {
                            content:`${rival} aceptas el ${userResponseEnv.values[0]}?`,
                            components:[envRow2],
                        }
                    )

                    const rivalResponseEnv2 = await rivalResponseEnv2msg.awaitMessageComponent({collectorRivalFilter, componentType:3,time:60000});
                    
                    rivalResponseEnv2msg = await rivalResponseEnv2msg.edit({
                        content:`${rival} seleccionó ${rivalResponseEnv2.values[0]}`,
                        components:[],
                        embeds:[]
                    })

                    if(rivalResponseEnv2.values[0] == 'acepto'){
                        game.playEnvido(true);
                    }else if(rivalResponseEnv2.values[0] == 'rechazo'){
                        game.playEnvido(false);
                    }else if(rivalResponseEnv2.values[0] == 'real envido'){   //envido envido real envido
                        game.playEnvido(true);
                        const envRow3 = new ActionRowBuilder()
                        .addComponents(envSelectResponse3);
                        
                        let userResponseEnv3msg = await rivalResponseEnv2msg.reply(
                            {
                                content:`${user} aceptas el ${rivalResponseEnv2.values[0]}?`,
                                components:[envRow3],
                            }
                        );
                        
                        const userResponseEnv3 = await userResponseEnv3msg.awaitMessageComponent({collectorUserFilter, componentType:3, time:60000});
                        
                        userResponseEnv3msg = await userResponseEnv3msg.edit({
                            content:`${user} seleccionó ${userResponseEnv3.values[0]}`,
                            components:[],
                            embeds:[]
                        });

                        if(userResponseEnv3.values[0] == 'acepto'){
                            game.playRenvido(true);
                        }else if(userResponseEnv3.values[0] == 'rechazo'){
                            game.playRenvido(false);
                        }else if(userResponseEnv3.values[0] == 'falta envido'){  //envido envido real envido falta envido
                            game.playRenvido(true);
                            game.playFenvido(true);
                        }

                    }else if(rivalResponseEnv2.values[0] == 'falta envido'){   //envido envido falta envido
                        game.playEnvido(true);

                        const envRow4 = new ActionRowBuilder()
                        .addComponents(envSelectResponse4);
                        
                        let rivalResponseEnv4msg = await rivalResponseEnv2msg.reply(
                            {
                                content:`${rival} aceptas el ${rivalResponseEnv2.values[0]}?`,
                                components:[envRow4],
                            }
                        );

                        const rivalResponseEnv4 = await rivalResponseEnv4msg.awaitMessageComponent({collectorUserFilter, componentType:3, time:60000});
                        
                        rivalResponseEnv4msg = await rivalResponseEnv4msg.reply({
                            content:`${rival} seleccionó ${rivalResponseEnv4.values[0]}`,
                            components:[],
                            embeds:[]
                        });

                        if(rivalResponseEnv4.values[0] == 'acepto'){
                            game.playFenvido(true);
                        }else if(rivalResponseEnv4.values[0] == 'rechazo'){
                            game.playFenvido(false);
                        }
                    }
                }else if(userResponseEnv.values[0] == 'real envido'){  //envido real envido
                    game.playEnvido(true);
                    const envRow3 = new ActionRowBuilder()
                    .addComponents(envSelectResponse3);

                    let rivalResponseEnv3msg = await userResponseMsg.reply({
                        content:`${rival} aceptas el ${userResponseEnv.values[0]}?`,
                        components:[envRow3],
                    });

                    const rivalResponseEnv3 = await rivalResponseEnv3msg.awaitMessageComponent({collectorRivalFilter, componentType:3,time:60000});

                    rivalResponseEnv3msg = await rivalResponseEnv3msg.edit({
                        content:`${rival} seleccionó ${rivalResponseEnv3.values[0]}`,
                        components:[],
                        embeds:[]
                    })

                    if(rivalResponseEnv3.values[0] == 'acepto'){
                        game.playRenvido(true);
                    }else if (rivalResponseEnv3.values[0] == 'rechazo'){
                        game.playRenvido(false);
                    }else if( rivalResponseEnv3.values[0] == 'falta envido'){ //envido real envido falta envido
                        game.playRenvido(true);

                        const envRow4 = new ActionRowBuilder()
                        .addComponents(envSelectResponse4);

                        let userResponseEnv4msg = await rivalResponseEnv3msg.reply({
                            content:`${user} aceptas el ${rivalResponseEnv3.values[0]}?`,
                            components:[envRow4],
                        })

                        const userResponseEnv4 = await userResponseEnv4msg.awaitMessageComponent({collectorUserFilter, componentType:3,time:60000});

                        userResponseEnv4msg = await userResponseEnv4msg.edit({
                            content:`${user} seleccionó ${userResponseEnv4.values[0]}`,
                            components:[],
                            embeds:[]
                        })

                        if(userResponseEnv4.values[0] == 'acepto'){
                            game.playFenvido(true);
                        }else if(userResponseEnv4.values[0] == ' rechazo'){
                            game.playFenvido(false);
                        }
                    }
                }else if(userResponseEnv.values[0] == 'falta envido'){  //envido falta envido
                    game.playEnvido(true);

                    const envRow4 = new ActionRowBuilder()
                    .addComponents(envSelectResponse4);

                    let rivalResponseEnv4msg = await userResponseMsg.reply({
                        content:`${rival} aceptas el ${userResponseEnv.values[0]}?`,
                            components:[envRow4],
                    })

                    const rivalResponseEnv4 = await rivalResponseEnv4msg.awaitMessageComponent({collectorRivalFilter, componentType:3,time:60000});

                    rivalResponseEnv4msg = await rivalResponseEnv4msg.edit({
                        content:`${rival} seleccionó ${rivalResponseEnv4.values[0]}`,
                        components:[],
                        embeds:[]
                    })

                    if(rivalResponseEnv4.values[0] == 'acepto'){
                        game.playFenvido(true);
                    }else if(rivalResponseEnv4.values[0] == 'rechazo'){
                        game.playFenvido(false);
                    }
                }
            }else if(round1RivalInteraction.values[0] == 'real envido'){ // first round real envido
                const envRow3 = new ActionRowBuilder()
                .addComponents(envSelectResponse3);

                let rivalResponseEnv3msg = await round1RivalInteraction.reply(
                    {
                        content:`${rival} aceptas el ${round1RivalInteraction.values[0]}?`,
                        components:[envRow3],
                    }
                )

                const rivalResponseEnv3 = await rivalResponseEnv3msg.awaitMessageComponent({collectorRivalFilter, componentType:3,time:60000});
                
                rivalResponseEnv3msg = await rivalResponseEnv3msg.edit({
                    content:`${rival} seleccionó ${rivalResponseEnv3.values[0]}`,
                    components:[],
                    embeds:[]
                })

                if(rivalResponseEnv3.values[0] == 'acepto'){
                    game.playRenvido(true);
                }else if(rivalResponseEnv3.values[0] =='rechazo'){
                    game.playRenvido(false);
                }else if(rivalResponseEnv3.values[0] == 'falta envido'){  //real envido falta envido

                    const envRow4 = new ActionRowBuilder()
                    .addComponents(envSelectResponse4);

                    let userResponseEnv4msg = await rivalResponseEnv3.reply({
                        content:`${user} aceptas el ${rivalResponseEnv3.values[0]}?`,
                        components:[envRow4],
                    })

                    const userResponseEnv4 = await userResponseEnv4msg.awaitMessageComponent({collectorUserFilter, componentType:3, time:60000});

                    userResponseEnv4msg = await userResponseEnv4msg.edit({
                        content:`${user} seleccionó ${userResponseEnv4.values[0]}`,
                        components:[],
                        embeds:[]
                    })

                    if(userResponseEnv4.values[0] == 'acepto'){
                        game.playFenvido(true);
                    }else if(userResponseEnv4.values[0] == 'rechazo'){
                        game.playFenvido(false);
                    }
                }

            }else if(round1RivalInteraction.values[0] == 'falta envido'){// first round falta envido
                const envRow4 = new ActionRowBuilder()
                .addComponents(envSelectResponse4);

                let rivalResponseEnv3msg = await round1RivalInteraction.reply(
                    {
                        content:`${rival} aceptas el ${round1RivalInteraction.values[0]}?`,
                        components:[envRow4],
                    }
                )
                
                rivalResponseEnv3msg = await rivalResponseEnv3msg.edit({
                    content:`${rival} seleccionó ${rivalResponseEnv3.values[0]}`,
                    components:[],
                    embeds:[]
                })

                const rivalResponseEnv3 = await rivalResponseEnv3msg.awaitMessageComponent({collectorRivalFilter, componentType:3,time:60000});
                
                if(rivalResponseEnv3.values[0] == 'acepto'){
                    game.playRenvido(true);
                }else if(rivalResponseEnv3.values[0] =='rechazo'){
                    game.playRenvido(false);
                }
            }
            console.log(game.pointsEnvido);
        }catch(e){
            console.log(e);
            await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        }
    }
}