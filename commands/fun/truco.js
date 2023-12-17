const {SlashCommandBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder, AttachmentBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, time} = require("discord.js");

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
                return con[0]["val"]+20;
            }else{
                let con1 = Object.values(this.coincidences).filter(x => x.n >= 1);
                return Math.max(...[con1[0]["val"],con1[1]["val"],con1[2]["val"]]);
            }
        }
    }
}

class Card{
    constructor(palo,value,pointvalue){
        this.type = palo;
        this.value = pointvalue;
        this.image = `./images/cards/${palo}/${value}.jpg`;
        this.name = `${value} de ${palo}`;
    }

    get getType(){
        return this.type;
    }

    get getValue(){
        return this.value;
    }

    get getName(){
        return this.name;
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
        this.pointsEnvido =0;
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

    playTruco(quiero){
        //previamente puntos de ronda = 1  (si se rechza se lleva esto)
        if(quiero){
            this.pointsRoundIG +=1; //acá valdría 2
        }
    }

    playRetruco(quiero){
        //previamente se sumó 1 a los puntos de ronda --> puntos de ronda = 2  (si se rechza se lleva esto)
        if(quiero){
            this.pointsRoundIG +=1;          //acá valdría 3
        }
    }

    playValeCuatro(quiero){
        //previamente se sumó 1 a los puntos de ronda --> puntos de ronda = 3  (si se rechza se lleva esto)
        if(quiero){
            this.pointsRoundIG +=1;          //acá valdría 4
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
            cartaUser = await Canvas.loadImage(this.user.getUsedHand[i].getImage);
            context.drawImage(cartaUser,200 + 110*i +110*this.user.getHand.length, 50, 70, 110);
        }
        
        for (let i = 0; i < this.rival.getHand.length; i++) {
            context.drawImage(cartadef,200 + 110*i, canvas.height - 160, 70, 110);
        }
        for (let i = 0; i < this.rival.getUsedHand.length; i++) {
            cartaRival = await Canvas.loadImage(this.rival.getUsedHand[i].getImage);
            context.drawImage(cartaRival,200 + 110*i +110*this.rival.getHand.length, canvas.height-160, 70, 110);
        }
        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });
        const respuesta = await interaction.reply({files:[attachment]});
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

async function compRoundEnvido(optComponent, prevInteraction,prevMsg,userTarget, collector){
    const envRow = new ActionRowBuilder()
    .addComponents(optComponent);
    let responseMsg = await prevMsg.reply({
        content:`${userTarget} aceptas el ${prevInteraction.values[0]}`,
        components:[envRow],
    })

    const responseEnv = await responseMsg.awaitMessageComponent({collector, componentType:3, time:60000});

    responseMsg = await responseMsg.edit({
        content:`${userTarget} seleccionó ${responseEnv.values[0]}`,
        components:[],
        embeds:[]
    })

    return [responseEnv, responseMsg];
}
async function roundEnvido(round1RivalInteraction, round1response, game,user,rival, collectorUserFilter, collectorRivalFilter){
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
    if(round1RivalInteraction.values[0] == 'envido'){ //first round envido
                
        const interR1 = await compRoundEnvido(envSelectResponse, round1RivalInteraction, round1response, user, collectorUserFilter);

        if(interR1[0].values[0] == 'acepto' ){
            game.playEnvido(true);
        }else if(interR1[0].values[0] == 'rechazo'){
            game.playEnvido(false);
        }else if(interR1[0].values[0] == 'envido'){   //envido envido
            game.playEnvido(true);
            const interR2 = await compRoundEnvido(envSelectResponse2, interR1[0],interR1[1],rival, collectorRivalFilter);

            if(interR2[0].values[0] == 'acepto'){
                game.playEnvido(true);
            }else if(interR2[0].values[0] == 'rechazo'){
                game.playEnvido(false);
            }else if(interR2[0].values[0] == 'real envido'){   //envido envido real envido
                game.playEnvido(true);
                const interR3 = await compRoundEnvido(envSelectResponse3,interR2[0],interR2[1],user,collectorUserFilter);

                if(interR3[0].values[0] == 'acepto'){
                    game.playRenvido(true);
                }else if(interR3[0].values[0] == 'rechazo'){
                    game.playRenvido(false);
                }else if(interR3[0].values[0] == 'falta envido'){  //envido envido real envido falta envido
                    game.playRenvido(true);
                    game.playFenvido(true);
                }

            }else if(interR2[0].values[0] == 'falta envido'){   //envido envido falta envido
                game.playEnvido(true);

                const interR3 = await compRoundEnvido(envSelectResponse4, interR2[0], interR2[1],rival, collectorRivalFilter);

                if(interR3[0].values[0] == 'acepto'){
                    game.playFenvido(true);
                }else if(interR3[0].values[0] == 'rechazo'){
                    game.playFenvido(false);
                }
            }
        }else if(interR1[0].values[0] == 'real envido'){  //envido real envido
            game.playEnvido(true);
                    
            const interR2 =await compRoundEnvido(envSelectResponse3, interR1[0], interR1[1],rival, collectorRivalFilter);

            if(interR2[0].values[0] == 'acepto'){
                game.playRenvido(true);
            }else if (interR2[0].values[0] == 'rechazo'){
                game.playRenvido(false);
            }else if(interR2[0].values[0] == 'falta envido'){ //envido real envido falta envido
                game.playRenvido(true);

                const interR3 = await compRoundEnvido(envSelectResponse4,interR2[0],interR2[1],user, collectorUserFilter);

                if(interR3[0].values[0] == 'acepto'){
                    game.playFenvido(true);
                }else if(interR3[0].values[0] == ' rechazo'){
                    game.playFenvido(false);
                }
            }
        }else if(interR1[0].values[0] == 'falta envido'){  //envido falta envido
            game.playEnvido(true);

            const interR2 = await compRoundEnvido(envSelectResponse4, interR1[0], interR1[1],rival, collectorRivalFilter);

            if(interR2[0].values[0] == 'acepto'){
                game.playFenvido(true);
            }else if(interR2[0].values[0] == 'rechazo'){
                game.playFenvido(false);
            }
        }
    }else if(round1RivalInteraction.values[0] == 'real envido'){ // first round real envido
            
        const interR1 = await compRoundEnvido(envSelectResponse3, round1RivalInteraction, round1response, rival, collectorRivalFilter);

        if(interR1[0].values[0] == 'acepto'){
            game.playRenvido(true);
        }else if(interR1[0].values[0] =='rechazo'){
            game.playRenvido(false);
        }else if(interR1[0].values[0] == 'falta envido'){  //real envido falta envido
            game.playRenvido(true);

            const interR2 = await compRoundEnvido(envSelectResponse4, interR1[0], interR1[1], user, collectorUserFilter);
            if(interR2[0].values[0] == 'acepto'){
                game.playFenvido(true);
            }else if(interR2[0].values[0] == 'rechazo'){
                game.playFenvido(false);
            }
        }

    }else if(round1RivalInteraction.values[0] == 'falta envido'){// first round falta envido
        const interR1 = await compRoundEnvido(envSelectResponse4, round1RivalInteraction, round1response, rival, collectorRivalFilter);
        if(interR1[0].values[0] == 'acepto'){
            game.playRenvido(true);
        }else if(interR1[0].values[0] =='rechazo'){
            game.playRenvido(false);
        }
    }
}

function addCardOptions(selectMenu, user){
    for (let i = 0; i < user.getHand.length; i++) {
        selectMenu.addOptions(
            new StringSelectMenuOptionBuilder()
            .setLabel(`${user.getHand[i].getName}`)
            .setValue(`${i}`)
        );
    }
    return selectMenu;
}
module.exports = {
    data: new SlashCommandBuilder()
    .setName('truco')
    .setDescription('Arrobá a algun wachin para jugar al truco pa')
    .addUserOption((option)=>option.setName("friend").setDescription("Pana para jugar al truco").setRequired(true)),

    async execute(interaction){
        let user = interaction.user;
        let rival = interaction.options.getUser('friend');
        let iconUser =  gif_to_png(user.avatarURL({extension: 'png'}));
        let iconRival =  gif_to_png(rival.avatarURL({extension: 'png'}));
        
        let game = new Table(user, iconUser, rival, iconRival);
        
        const userOb = game.getUser;
        const rivalOb = game.getRival;

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

        let rivalresponse = await interaction.reply({
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
                rivalresponse = await rivalresponse.edit({
                    content: "Cortamos la mano!",
                    components: []
                });
            }else{
                game.startGame(false);
                rivalresponse = await rivalresponse.edit({
                    content: "No cortamos la mano!",
                    components: []
                })
            }

            const msgTable = await game.showTable(rivalresponse);

            await game.sendCardsTo(user, game.user);
            await game.sendCardsTo(rival, game.rival);
            let cardSelect = new StringSelectMenuBuilder()
			.setCustomId('starter')
			.setPlaceholder('Make a selection!')
			.addOptions(
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
            
            cardSelect = addCardOptions(cardSelect, game.getRival);
            
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
            round1response = await round1response.edit({
                content:`${rival} seleccionó ${round1RivalInteraction.values[0]}`,
                components:[],
                embeds:[]
            })

            const trucoSelectResponseRound1= new StringSelectMenuBuilder()
                .setCustomId('trucoResp')
                .setPlaceholder('Select your response!')
                .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Quiero')
                    .setValue('acepto'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('No quiero')
                    .setValue('rechazo'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Quiero retruco')
                    .setValue('retruco'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Envido')
                    .setValue('envido'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Real envido')
                    .setValue('real envido'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Falta envido')
                    .setValue('falta envido'),
                );
            const retrucoSelectResponse= new StringSelectMenuBuilder()
                .setCustomId('retrucoResp')
                .setPlaceholder('Select your response!')
                .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Quiero')
                    .setValue('acepto'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('No quiero')
                    .setValue('rechazo'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Quiero vale cuatro')
                    .setValue('vale cuatro'),
                );
            
            const vale4SelectResponse = new StringSelectMenuBuilder()
            .setCustomId('vale4Resp')
            .setPlaceholder('Select your response!')
            .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('Quiero')
                .setValue('acepto'),
            new StringSelectMenuOptionBuilder()
                .setLabel('No quiero')
                .setValue('rechazo'));

            let rechazoTruco = false;
            let jugarEnvido = true;
            if(round1RivalInteraction.values[0] == "truco"){
                let trucoRow = new ActionRowBuilder()
                .addComponents(trucoSelectResponseRound1);

                let respTrucoMsg= await round1response.reply({
                    content:`${user} aceptas el ${round1RivalInteraction.values[0]}`,
                    components:[trucoRow],
                })

                let respTruco = await respTrucoMsg.awaitMessageComponent({collectorUserFilter, componentType:3,time:60000});

                respTrucoMsg = await respTrucoMsg.edit({
                    content:`${user} seleccionó ${respTruco.values[0]}`,
                    components:[],
                    embeds:[]
                })
                if(respTruco.values[0] == "envido" || respTruco.values[0] == "falta envido" || respTruco.values[0] == "real envido"){
                    await roundEnvido(respTruco, respTrucoMsg, game, rival,user,collectorRivalFilter, collectorUserFilter);
                }else if(respTruco.values[0] == "acepto"){
                    jugarEnvido = false;
                    game.playTruco(true);
                }else if(respTruco.values[0] == "rechazo"){
                    rechazoTruco = true;
                    game.playTruco(false);
                }else if(respTruco.values[0] == "retruco"){
                    jugarEnvido = false;
                    game.playTruco(true);

                    let retrucoRow = new ActionRowBuilder()
                    .addComponents(retrucoSelectResponse);

                    let respreTrucoMsg = await respTrucoMsg.reply({
                        content:`${rival} aceptas el ${respTruco.values[0]}`,
                        components:[retrucoRow],
                    })

                    let respRetruco =await respreTrucoMsg.awaitMessageComponent({collectorRivalFilter, componentType:3,time:60000});
                    
                    respreTrucoMsg = await respTrucoMsg.edit({
                        content:`${rival} seleccionó ${respRetruco.values[0]}`,
                        components:[],
                        embeds:[]
                    })

                    if(respRetruco.values[0] == "acepto"){
                        game.playRetruco(true);
                    }else if(respRetruco.values[0] == "rechazo"){
                        rechazoTruco = true;
                        game.playRetruco(true);
                    }else if(respRetruco.values[0] == "vale cuatro"){
                        game.playRetruco(true);

                        let vale4row = new ActionRowBuilder()
                        .addComponents(vale4SelectResponse);

                        let respvaleTrucoMsg = await respreTrucoMsg.reply({
                            content: `${user} aceptas el ${respRetruco.values[0]}`,
                            components:[vale4row],
                        });

                        let respValetruco = await respvaleTrucoMsg.awaitMessageComponent({collectorUserFilter, componentType:3,time:60000})
                        
                        respvaleTrucoMsg = await respvaleTrucoMsg.edit({
                            content: `${user} seleccionó ${respValetruco.values[0]}`,
                            components:[],
                            embeds:[]
                        })

                        if(respValetruco.values[0]== "acepto"){
                            game.playValeCuatro(true);
                        }else if(respValetruco.values[0] == "rechazo"){
                            rechazoTruco = true;
                            game.playValeCuatro(false);
                        }
                    } 
                }
            }else if(round1RivalInteraction.values[0] == '0' || round1RivalInteraction.values[0] == '1' || round1RivalInteraction.values[0] == '2'){
                rivalOb.useCard(rivalOb.getHand[parseInt(round1RivalInteraction.values[0])]);
                game.showTable(round1response);
            }
            if(jugarEnvido && !rechazoTruco){
                await roundEnvido(round1RivalInteraction, round1response, game, user, rival, collectorUserFilter, collectorRivalFilter);
            }

        }catch(e){
            console.log(e);
            await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        }
    }
}