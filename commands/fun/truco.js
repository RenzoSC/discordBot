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

    resetHand(){
        this.hand = {"unused":[], "used":[]};
    }
    
    resetCoincidences(){
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
        let cards = this.hand.unused.concat(this.hand.used);
        let card1 = cards[0];
        let card2 = cards[1];
        let card3 = cards[2];
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
    constructor(palo,value,pointvalue, valorTruco){
        this.type = palo;
        this.value = pointvalue;
        this.image = `./images/cards/${palo}/${value}.jpg`;
        this.name = `${value} de ${palo}`;
        this.trucoValue = valorTruco;
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

    get getTrucoValue(){
        return this.trucoValue;
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
                    this.cartas.push(new Card(palo,valor,0,valor));
                }else if(valor== 1 && palo == 'espadas'){             //Macho
                    this.cartas.push(new Card(palo,valor,valor,20));  
                }else if(valor == 1 && palo == 'bastos'){             //Hembra
                    this.cartas.push(new Card(palo,valor,valor,19)) 
                }else if(valor == 7 && palo == 'espadas'){            // 7 de espada
                    this.cartas.push(new Card(palo,valor,valor,18))
                }else if(valor == 7 && palo == 'oros'){               // 7 de oro
                    this.cartas.push(new Card(palo,valor,valor,17))
                }else if(valor == 3){                                 // 3's 
                    this.cartas.push(new Card(palo,valor,valor,16))
                }else if(valor == 2){                                 // 2's
                    this.cartas.push(new Card(palo,valor,valor,15))
                }else if(valor == 1 && (palos == 'oros' || palos == 'copas')){  //1 de copas y 1 de oro
                    this.cartas.push(new Card(palo,valor,valor, 14))
                }else{
                    this.cartas.push(new Card(palo,valor,valor,valor));
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
        this.firstStageWon = null;
        this.winTrack = [];
        this.baraja = new Baraja();
        this.pointsRoundIG = 1;
        this.pointsEnvido =0;
        this.handWinTrack = []
    }

    set setWinTrack(x){
        this.winTrack = x;
    }
    set setPointsEnvido(points){
        this.pointsEnvido = points;
    }

    set setPointsRoundIG(points){
        this.pointsRoundIG = points;
    }

    set setFirstStageWon(x){
        this.firstStageWon = x;
    }

    set setRound(round){
        this.round = round;
    }

    startGame(cortar){
        this.baraja.mezclar();
        this.baraja.repartir(this.user, this.rival, cortar);
    }

    nextRound(){
        this.round +=1;
    }

    winHand(winner){
        this.handWinTrack.push(winner);
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
    
    get getPointsEnvido(){
        return this.pointsEnvido;
    }

    get getPointsRound(){
        return this.pointsRoundIG;
    }

    get getUser(){
        return this.user;
    }
    
    get getRival(){
        return this.rival;
    }

    get getTrack(){
        return this.winTrack;
    }

    get getFirstStageWon(){
        return this.firstStageWon;
    }

    get getHandWinTrack(){
        return this.handWinTrack;
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

    const responseEnv = await responseMsg.awaitMessageComponent({filter:collector, componentType:3, time:60000});

    responseMsg = await responseMsg.edit({
        content:`${userTarget} seleccionó ${responseEnv.values[0]}`,
        components:[],
        embeds:[]
    })

    return [responseEnv, responseMsg];
}
let salir = {"ob":null,"us":null,"val":false};
async function roundEnvido(round1RivalInteraction, round1response, game,user,rival, userOb,rivalOb, collectorUserFilter, collectorRivalFilter){
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
            return {'lastInteraction':interR1[0],'lastMsg':interR1[1], 'rechazo':{"ob":userOb,"us":user,"val":false}};
        }else if(interR1[0].values[0] == 'rechazo'){
            game.playEnvido(false);
            lastMsgInHand = interR1[1];
            return {'lastInteraction':interR1[0],'lastMsg':interR1[1], 'rechazo':{"ob":userOb,"us":user,"val":true}};
        }else if(interR1[0].values[0] == 'envido'){   //envido envido
            game.playEnvido(true);
            lastMsgInHand = interR1[1];
            const interR2 = await compRoundEnvido(envSelectResponse2, interR1[0],interR1[1],rival, collectorRivalFilter);

            if(interR2[0].values[0] == 'acepto'){
                game.playEnvido(true);
                return {'lastInteraction':interR2[0],'lastMsg':interR2[1], 'rechazo':{"ob":rival,"us":rival,"val":false}};
            }else if(interR2[0].values[0] == 'rechazo'){
                lastMsgInHand = interR2[1];
                game.playEnvido(false);
                return {'lastInteraction':interR2[0],'lastMsg':interR2[1],'rechazo':{"ob":userOb,"us":user,"val":true}};
            }else if(interR2[0].values[0] == 'real envido'){   //envido envido real envido
                game.playEnvido(true);
                const interR3 = await compRoundEnvido(envSelectResponse3,interR2[0],interR2[1],user,collectorUserFilter);

                if(interR3[0].values[0] == 'acepto'){
                    game.playRenvido(true);
                    return {'lastInteraction':interR3[0],'lastMsg':interR3[1], 'rechazo':{"ob":userOb,"us":user,"val":false}};
                }else if(interR3[0].values[0] == 'rechazo'){
                    game.playRenvido(false);
                    lastMsgInHand = interR3[1];
                    return {'lastInteraction':interR3[0],'lastMsg':interR3[1],'rechazo':{"ob":userOb,"us":user,"val":true}};
                }else if(interR3[0].values[0] == 'falta envido'){  //envido envido real envido falta envido
                    game.playRenvido(true);
                    const interR4 = await compRoundEnvido(envSelectResponse4, interR3[0], interR3[1], rival, collectorRivalFilter);

                    if(interR4[0].values[0] == 'acepto'){
                        game.playFenvido(true);
                        return {'lastInteraction':interR4[0],'lastMsg':interR4[1], 'rechazo':{"ob":rivalOb,"us":rival,"val":false}};
                    }else if(interR4[0].values[0]=='rechazo'){
                        game.playFenvido(false);
                        lastMsgInHand = interR4[1];
                        return {'lastInteraction':interR4[0],'lastMsg':interR4[1],'rechazo':{"ob":rivalOb,"us":rival,"val":true}};
                    }else if(interR4[0].values[0]=="salir"){
                        salir = {"ob":rivalOb,"us":rival,"val":true};
                        lastMsgInHand = interR4[1];
                        return {'lastInteraction':interR4[0],'lastMsg':interR4[1],'rechazo':{"ob":rivalOb,"us":rival,"val":true}};
                    }
            
                }else if(interR3[0].values[0]=="salir"){
                    salir = {"ob":userOb,"us":user,"val":true};
                    lastMsgInHand = interR3[1];
                    return {'lastInteraction':interR3[0],'lastMsg':interR3[1],'rechazo':{"ob":userOb,"us":user,"val":true}};
                }
        

            }else if(interR2[0].values[0] == 'falta envido'){   //envido envido falta envido
                game.playEnvido(true);

                const interR3 = await compRoundEnvido(envSelectResponse4, interR2[0], interR2[1],user, collectorRivalFilter);

                if(interR3[0].values[0] == 'acepto'){
                    game.playFenvido(true);
                    return {'lastInteraction':interR3[0],'lastMsg':interR3[1], 'rechazo':{"ob":userOb,"us":user,"val":false}};
                }else if(interR3[0].values[0] == 'rechazo'){
                    game.playFenvido(false);
                    lastMsgInHand = interR3[1];
                    return {'lastInteraction':interR3[0],'lastMsg':interR3[1],'rechazo':{"ob":userOb,"us":user,"val":true}};
                }else if(interR3[0].values[0]=="salir"){
                    salir = {"ob":userOb,"us":user,"val":true};
                    lastMsgInHand = interR3[1];
                    return {'lastInteraction':interR3[0],'lastMsg':interR3[1],'rechazo':{"ob":userOb,"us":user,"val":true}};
                }
            }else if(interR2[0].values[0]=="salir"){
                salir = {"ob":rivalOb,"us":rival,"val":true};
                lastMsgInHand = interR2[1];
                return {'lastInteraction':interR2[0],'lastMsg':interR2[1],'rechazo':{"ob":rivalOb,"us":rival,"val":true}};
            }
    
        }else if(interR1[0].values[0] == 'real envido'){  //envido real envido
            game.playEnvido(true);
                    
            const interR2 =await compRoundEnvido(envSelectResponse3, interR1[0], interR1[1],rival, collectorRivalFilter);

            if(interR2[0].values[0] == 'acepto'){
                game.playRenvido(true);
                return {'lastInteraction':interR2[0],'lastMsg':interR2[1], 'rechazo':{"ob":rivalOb,"us":rival,"val":false}};
            }else if (interR2[0].values[0] == 'rechazo'){
                game.playRenvido(false);
                lastMsgInHand = interR2[1];
                return {'lastInteraction':interR2[0],'lastMsg':interR2[1],'rechazo':{"ob":rivalOb,"us":rival,"val":true}};
            }else if(interR2[0].values[0] == 'falta envido'){ //envido real envido falta envido
                game.playRenvido(true);

                const interR3 = await compRoundEnvido(envSelectResponse4,interR2[0],interR2[1],user, collectorUserFilter);

                if(interR3[0].values[0] == 'acepto'){
                    game.playFenvido(true);
                    return {'lastInteraction':interR3[0],'lastMsg':interR3[1], 'rechazo':{"ob":userOb,"us":user,"val":false}};
                }else if(interR3[0].values[0] == ' rechazo'){
                    game.playFenvido(false);
                    lastMsgInHand = interR3[1];
                    return {'lastInteraction':interR3[0],'lastMsg':interR3[1],'rechazo':{"ob":userOb,"us":user,"val":true}};
                }else if(interR3[0].values[0]=="salir"){
                    salir = {"ob":userOb,"us":user,"val":true};
                    lastMsgInHand = interR3[1];
                    return {'lastInteraction':interR3[0],'lastMsg':interR3[1],'rechazo':{"ob":userOb,"us":user,"val":true}};
                }
        
            }else if(interR2[0].values[0]=="salir"){
                salir = {"ob":rivalOb,"us":rival,"val":true};
                lastMsgInHand = interR2[1];
                return {'lastInteraction':interR2[0],'lastMsg':interR2[1],'rechazo':{"ob":rivalOb,"us":rival,"val":true}};
            }
    
        }else if(interR1[0].values[0] == 'falta envido'){  //envido falta envido
            game.playEnvido(true);

            const interR2 = await compRoundEnvido(envSelectResponse4, interR1[0], interR1[1],rival, collectorRivalFilter);

            if(interR2[0].values[0] == 'acepto'){
                game.playFenvido(true);
                return {'lastInteraction':interR2[0],'lastMsg':interR2[1], 'rechazo':{"ob":rivalOb,"us":rival,"val":false}};
            }else if(interR2[0].values[0] == 'rechazo'){
                game.playFenvido(false);
                lastMsgInHand = interR2[1];
                return {'lastInteraction':interR2[0],'lastMsg':interR2[1],'rechazo':{"ob":rivalOb,"us":rival,"val":true}};
            }else if(interR2[0].values[0]=="salir"){
                salir = {"ob":rivalOb,"us":rival,"val":true};
                lastMsgInHand = interR2[1];
                return {'lastInteraction':interR2[0],'lastMsg':interR2[1],'rechazo':{"ob":rivalOb,"us":rival,"val":true}};
            }
    
        }else if(interR1[0].values[0]=="salir"){
            salir = {"ob":userOb,"us":user,"val":true};
            lastMsgInHand = interR1[1];
            return {'lastInteraction':interR1[0],'lastMsg':interR1[1],'rechazo':{"ob":userOb,"us":user,"val":true}};
        }

    }else if(round1RivalInteraction.values[0] == 'real envido'){ // first round real envido
            
        const interR1 = await compRoundEnvido(envSelectResponse3, round1RivalInteraction, round1response, user, collectorRivalFilter);

        if(interR1[0].values[0] == 'acepto'){
            game.playRenvido(true);
            return {'lastInteraction':interR1[0],'lastMsg':interR1[1], 'rechazo':{"ob":userOb,"us":user,"val":false}};
        }else if(interR1[0].values[0] =='rechazo'){
            game.playRenvido(false);
            lastMsgInHand = interR1[1];
            return {'lastInteraction':interR1[0],'lastMsg':interR1[1],'rechazo':{"ob":userOb,"us":user,"val":true}};
        }else if(interR1[0].values[0] == 'falta envido'){  //real envido falta envido
            game.playRenvido(true);

            const interR2 = await compRoundEnvido(envSelectResponse4, interR1[0], interR1[1], rival, collectorUserFilter);
            if(interR2[0].values[0] == 'acepto'){
                game.playFenvido(true);
                return {'lastInteraction':interR2[0],'lastMsg':interR2[1], 'rechazo':{"ob":rivalOb,"us":rival,"val":false}};
            }else if(interR2[0].values[0] == 'rechazo'){
                game.playFenvido(false);
                lastMsgInHand = interR2[1];
                return {'lastInteraction':interR2[0],'lastMsg':interR2[1],'rechazo':{"ob":rivalOb,"us":rival,"val":true}};
            }else if(interR2[0].values[0]=="salir"){
                salir = {"ob":rivalOb,"us":rival,"val":true};
                lastMsgInHand = interR2[1];
                return {'lastInteraction':interR2[0],'lastMsg':interR2[1],'rechazo':{"ob":rivalOb,"us":rival,"val":true}};
            }
    
        }else if(interR1[0].values[0]=="salir"){
            salir = {"ob":userOb,"us":user,"val":true};
            lastMsgInHand = interR1[1];
            return {'lastInteraction':interR1[0],'lastMsg':interR1[1],'rechazo':{"ob":userOb,"us":user,"val":true}};
        }

    }else if(round1RivalInteraction.values[0] == 'falta envido'){// first round falta envido
        const interR1 = await compRoundEnvido(envSelectResponse4, round1RivalInteraction, round1response, user, collectorRivalFilter);
        if(interR1[0].values[0] == 'acepto'){
            game.playRenvido(true);
            return {'lastInteraction':interR1[0],'lastMsg':interR1[1], 'rechazo':{"ob":userOb,"us":user,"val":false}};
        }else if(interR1[0].values[0] =='rechazo'){
            game.playRenvido(false);
            lastMsgInHand = interR1[1];
            return {'lastInteraction':interR1[0],'lastMsg':interR1[1],'rechazo':{"ob":userOb,"us":user,"val":true}};
        }else if(interR1[0].values[0]=="salir"){
            salir = {"ob":userOb,"us":user,"val":true};
            lastMsgInHand = interR1[1];
            return {'lastInteraction':interR1[0],'lastMsg':interR1[1],'rechazo':{"ob":userOb,"us":user,"val":true}};
        }
    }else if(round1RivalInteraction.values[0]=='salir'){
        salir = {"ob":userOb,"us":user,"val":true};
        lastMsgInHand = round1response;
        return {'lastInteraction':round1RivalInteraction,'lastMsg':round1response,'rechazo':{"ob":userOb,"us":user,"val":true}};
    }
}

let rechazoTruco = {"ob":null,"us":null,"val":false};
let jugarEnvido = true;
let truco = true;
let retruco = false;
let vale4 = false;

async function trucoFirstRound(selectResponse, responseMsg, responseInteraction, game, user, rival, userOb,rivalOb, collectorUserFilter, collectorRivalFilter, retrucoSelectResponse, vale4SelectResponse){
    let trucoRow = new ActionRowBuilder()
    .addComponents(selectResponse);
    let lastMsg;
    let respTrucoMsg= await responseMsg.reply({
        content:`${user} aceptas el ${responseInteraction.values[0]}`,
        components:[trucoRow],
    })

    let respTruco = await respTrucoMsg.awaitMessageComponent({filter:collectorUserFilter, componentType:3,time:60000});

    respTrucoMsg = await respTrucoMsg.edit({
        content:`${user} seleccionó ${respTruco.values[0]}`,
        components:[],
        embeds:[]
    })
    if(respTruco.values[0] == "envido" || respTruco.values[0] == "falta envido" || respTruco.values[0] == "real envido"){
        jugarEnvido = false;
        const round = await roundEnvido(respTruco, respTrucoMsg, game, rival,user,rivalOb, userOb,collectorRivalFilter, collectorUserFilter);
        let pointsRival = rivalOb.getCardPoints;
        let pointsUser = userOb.getCardPoints;
        pointsInGame = game.getPointsEnvido;
        if(!round.rechazo.val){
            if(pointsRival > pointsUser){
                rivalOb.addPoints(pointsInGame);
                lastMsg = await round.lastMsg.reply({
                    content:`${rival} se lleva ${pointsInGame} puntos de envido!`,
                    components:[],
                    embeds:[]
                })
            }else if(pointsUser > pointsRival){
                userOb.addPoints(pointsInGame);
                lastMsg = await round.lastMsg.reply({
                    content:`${user} se lleva ${pointsInGame} puntos de envido!`,
                    components:[],
                    embeds:[]
                })
            }else{
                userOb.addPoints(pointsInGame);
                lastMsg = await round.lastMsg.reply({
                    content:`${user} se lleva ${pointsInGame} puntos de envido!`,
                    components:[],
                    embeds:[]
                })
            }
        }else{
            let usEnvob = round.rechazo.us==user?rivalOb:userOb;
            let usEnv = round.rechazo.us == user ?rival:user;
            usEnvob.addPoints(pointsInGame);
            lastMsg = await round.lastMsg.reply({
                content:`${usEnv} se lleva ${pointsInGame} puntos de envido!`,
                components:[],
                embeds:[]
            })
        }
    }else if(respTruco.values[0] == "acepto"){
        jugarEnvido = false;
        game.playTruco(true);
        lastMsg = respTrucoMsg;
        truco = false;
        retruco = true;
        vale4 = false;
    }else if(respTruco.values[0] == "rechazo"){
        rechazoTruco = {"ob":userOb,"us":user,"val":true};
        game.playTruco(false);
        lastMsg = respTrucoMsg;
        lastMsgInHand  = respTrucoMsg;
    }else if(respTruco.values[0] == "retruco"){
        jugarEnvido = false;
        game.playTruco(true);

        let retrucoRow = new ActionRowBuilder()
        .addComponents(retrucoSelectResponse);

        let respreTrucoMsg = await respTrucoMsg.reply({
            content:`${rival} aceptas el ${respTruco.values[0]}`,
            components:[retrucoRow],
        })
        let respRetruco =await respreTrucoMsg.awaitMessageComponent({filter:collectorRivalFilter, componentType:3,time:60000});           
        respreTrucoMsg = await respreTrucoMsg.edit({
            content:`${rival} seleccionó ${respRetruco.values[0]}`,
            components:[],
            embeds:[]
        })

        if(respRetruco.values[0] == "acepto"){
            game.playRetruco(true);
            lastMsg = respreTrucoMsg;
            truco = false;
            retruco = false;
            vale4 = true;
        }else if(respRetruco.values[0] == "rechazo"){
            rechazoTruco = {"ob":rivalOb,"us":rival,"val":true};
            game.playRetruco(false);
            lastMsg = respreTrucoMsg;
            lastMsgInHand = respreTrucoMsg;
        }else if(respRetruco.values[0] == "vale cuatro"){
            game.playRetruco(true);

            let vale4row = new ActionRowBuilder()
            .addComponents(vale4SelectResponse);

            let respvaleTrucoMsg = await respreTrucoMsg.reply({
                content: `${user} aceptas el ${respRetruco.values[0]}`,
                components:[vale4row],
            });

            let respValetruco = await respvaleTrucoMsg.awaitMessageComponent({filter:collectorUserFilter, componentType:3,time:60000})
                        
            respvaleTrucoMsg = await respvaleTrucoMsg.edit({
                content: `${user} seleccionó ${respValetruco.values[0]}`,
                components:[],
                embeds:[]
            })

            if(respValetruco.values[0]== "acepto"){
                game.playValeCuatro(true);
                lastMsg = respvaleTrucoMsg;
                truco = false;
                retruco = false;
                vale4 = false;
            }else if(respValetruco.values[0] == "rechazo"){
                rechazoTruco = {"ob":userOb,"us":user,"val":true};
                game.playValeCuatro(false);
                lastMsg = respvaleTrucoMsg;
                lastMsgInHand = respvaleTrucoMsg;
            }else if(respValetruco.values[0]=="salir"){
                salir = {"ob":userOb,"us":user,"val":true};
                lastMsgInHand = respvaleTrucoMsg;
            }
        }else if(respRetruco.values[0]=="salir"){
            salir = {"ob":rivalOb,"us":rival,"val":true};
            lastMsgInHand = respreTrucoMsg;
        } 
    }else if(respTruco.values[0]== "salir"){
        salir = {"ob":userOb,"us":user,"val":true};
        lastMsgInHand = respTrucoMsg;
    }       
    return lastMsg; 
}

function addCardOptions(selectMenu, user){
    let cardOption = ["primera","segunda","tercera"];
;    for (let i = 0; i < user.getHand.length; i++) {
        selectMenu.addOptions(
            new StringSelectMenuOptionBuilder()
            .setLabel(`${cardOption[i]} carta`)
            .setValue(`${i}`)
        );
    }
    return selectMenu;
}

//return {"winner":caller,"loser":target,"lastInteraction":lastInteraction,"lastMsg":lastMsg};
                                                         //user  rival
async function selectionCardRound(lastMsg, game, caller, target,  callerOb, targetOb, collectorCaller, collectorTarget){   //falta agregar const truco retruco etc
    let cardCaller,cardTarget, lastMsgBis, lastInteraction;

    let selectResponse = new StringSelectMenuBuilder()
    .setCustomId('selectResp')
    .setPlaceholder('Select your move!')
    .addOptions(
        new StringSelectMenuOptionBuilder()
        .setLabel('Salir')
        .setValue('salir')
    );

    selectResponse = addCardOptions(selectResponse, callerOb);

    let selectResponseTarget = new StringSelectMenuBuilder()
    .setCustomId('selectRespTarget')
    .setPlaceholder('Select your move!')
    .addOptions(
        new StringSelectMenuOptionBuilder()
        .setLabel('Salir')
        .setValue('salir')
    );

    selectResponseTarget = addCardOptions(selectResponseTarget, targetOb);

    let roundRow = new ActionRowBuilder()
    .addComponents(selectResponse);

    let roundMsg = await lastMsg.reply({
        content:`${caller} que harás ahora?`,
        components:[roundRow]
    })

    let roundInteraction = await roundMsg.awaitMessageComponent({filter:collectorCaller, componentType:3,time:60000});

    roundMsg = await roundMsg.edit({
        content:`${caller} seleccionó ${roundInteraction.values[0]}`,
        components:[],
        embeds:[]
    })

    if(['0','1','2'].includes(roundInteraction.values[0])){
        cardCaller = callerOb.getHand[parseInt(roundInteraction.values[0])];
        callerOb.useCard(cardCaller);
        await game.sendCardsTo(caller,callerOb);
        await game.showTable(roundMsg);    //devuelve msg...
        let targetRow = new ActionRowBuilder()
        .addComponents(selectResponseTarget);
        let roundTargetMsg  = roundMsg.reply({
            content:`${target} que harás ahora?`,
            components:[targetRow]
        });

        let roundTargetInteraction = roundTargetMsg.awaitMessageComponent({filter:collectorTarget, componentType:3, time:60000});

        roundTargetMsg = roundTargetMsg.edit({
            content:`${target} seleccionó ${roundTargetInteraction.values[0]}`,
            components:[],
            embeds:[]
        })
        //también deberia poder cantar truco, el otro no pq ya fue validado anteriormente
        if(['0','1','2'].includes(roundTargetInteraction.values[0])){
            cardTarget = targetOb.getHand[parseInt(roundTargetInteraction.values[0])];
            targetOb.useCard(cardTarget);
            await game.sendCardsTo(target,targetOb);
            lastMsgBis = await game.showTable(roundTargetMsg);
            lastInteraction = roundTargetInteraction;
        }
    }

    return {"cardC":cardCaller,"cardT":cardTarget, 'lastMsg':lastMsgBis, 'lastInteraction':lastInteraction};
}

async function playRound(lastMsg, game, caller, target,callerOb,targetOb, collectorCaller, collectorTarget){
    /* 
    Funcion que representa una ronda (en la que se puede cantar truco etc)
    
    Caller es el que empieza y Target es el que responde a la jugada del caller
    
    Necesitas el ultimo mensaje que se envió para poder usar esta función
    
    Devuelve los resultados de la ronda asi como también el ultimo mensaje que se envió y la ultima interacción (por si los necesita usar luego)
    */

    let needToPlayCards = true;
    let cardCaller,cardTarget, lastMsgBis, lastInteractionBis;
    let trucoSelectResponse = new StringSelectMenuBuilder()
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
        .setLabel('Salir')
        .setValue('salir'),
    );
    
    let retrucoSelectResponse =new StringSelectMenuBuilder()
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
        .setLabel('QUIERO VALE CUATRO')
        .setValue('vale cuatro'),
    new StringSelectMenuOptionBuilder()
        .setLabel('Salir')
        .setValue('salir'),
    );

    let valeCuatroSelectResponse = new StringSelectMenuBuilder()
    .setCustomId('vale4Resp')
    .setPlaceholder('Select your response!')
    .addOptions(
    new StringSelectMenuOptionBuilder()
        .setLabel('Quiero')
        .setValue('acepto'),
    new StringSelectMenuOptionBuilder()
        .setLabel('No quiero')
        .setValue('rechazo'),
    new StringSelectMenuOptionBuilder()
        .setLabel('Salir')
        .setValue('salir'),
    )

    let cardSelect = new StringSelectMenuBuilder()
    .setCustomId('roundSelectMenu')
    .setPlaceholder('Make a selection!')
    .addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('Salir')
            .setValue('salir'),
    );
    
    cardSelect = addCardOptions(cardSelect, callerOb);
    
    let selectResponseTarget = new StringSelectMenuBuilder()
    .setCustomId('selectRespTarget')
    .setPlaceholder('Select your move!')
    .addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('Salir')
            .setValue('salir'),
    );

    selectResponseTarget = addCardOptions(selectResponseTarget, targetOb);
    if(truco){
        cardSelect = cardSelect.addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Truco').setValue('truco')
        )
        selectResponseTarget = selectResponseTarget.addOptions(new StringSelectMenuOptionBuilder().setLabel('Truco').setValue('truco'));
    }else if(retruco){
        cardSelect = cardSelect.addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Quiero re truco').setValue('retruco')
        )
        selectResponseTarget = selectResponseTarget.addOptions(new StringSelectMenuOptionBuilder().setLabel('Quiero retruco').setValue('retruco'));
    }else if(vale4){
        cardSelect = cardSelect.addOptions(
            new StringSelectMenuOptionBuilder().setLabel('QUIERO VALE CUATRO').setValue('vale cuatro')
        )

        selectResponseTarget = selectResponseTarget.addOptions(new StringSelectMenuOptionBuilder().setLabel('QUIERO VALE CUATRO').setValue('vale cuatro'));
    }

    let cardsTargetOptions = new StringSelectMenuBuilder()
    .setCustomId('cardsTarget')
    .setPlaceholder('Select your move!')
    .addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('Salir')
            .setValue('salir'),
    );

    cardsTargetOptions = addCardOptions(cardsTargetOptions, targetOb);

    let roundRow = new ActionRowBuilder()
    .addComponents(cardSelect);

    let roundMsg = await lastMsg.reply({
        content:`${caller} que harás ahora?`,
        components:[roundRow]
    })

    let roundInteraction = await roundMsg.awaitMessageComponent({filter:collectorCaller, componentType:3,time:60000});

    roundMsg = await roundMsg.edit({
        content:`${caller} seleccionó ${roundInteraction.values[0]}`,
        components:[],
        embeds:[]
    })
    
    if(roundInteraction.values[0] == "truco"){
        let trucoRow = new ActionRowBuilder()
        .addComponents(trucoSelectResponse);

        let trucoMsg = await roundMsg.reply({
            content:`${target} que harás ahora?`,
            components:[trucoRow]
        })

        let trucoInteraction = await trucoMsg.awaitMessageComponent({filter:collectorTarget, componentType:3,time:60000});
        
        trucoMsg = await trucoMsg.edit({
            content:`${target} seleccionó ${trucoInteraction.values[0]}`,
            components:[],
            embeds:[]
        })

        if(trucoInteraction.values[0]=="retruco"){
            game.playTruco(true);
            let retrucoRow = new ActionRowBuilder()
            .addComponents(retrucoSelectResponse);

            let retrucoMsg = await trucoMsg.reply({
                content:`${caller} que harás ahora?`,
                components:[retrucoRow]
            })

            let retrucoInteraction = await retrucoMsg.awaitMessageComponent({filter:collectorCaller, componentType:3, time:60000});

            retrucoMsg = await retrucoMsg.edit({
                content:`${caller} seleccionó ${retrucoInteraction.values[0]}`,
                components:[],
                embeds:[],
            })

            if(retrucoInteraction.values[0]=="vale cuatro"){
                game.playRetruco(true);
                let vale4row = new ActionRowBuilder()
                .addComponents(valeCuatroSelectResponse);

                let vale4Msg = await retrucoMsg.reply({
                    content:`${target} que harás ahora?`,
                    components:[vale4row]
                });

                let vale4Interaction = await vale4Msg.awaitMessageComponent({filter:collectorTarget, componentType:3, time:60000});

                vale4Msg = await vale4Msg.edit({
                    content:`${target} seleccionó ${vale4Interaction.values[0]}`,
                    components:[],
                    embeds:[]
                })

                if(vale4Interaction.values[0]== "acepto"){
                    game.playValeCuatro(true);
                    let cardSelected =await selectionCardRound(vale4Msg,game,caller,target,callerOb,targetOb, collectorCaller, collectorTarget);

                    cardCaller = cardSelected.cardC;
                    cardTarget = cardSelected.cardT;
                    truco = false;
                    retruco = false;
                    vale4 = false;
                    needToPlayCards = false;
                    lastMsgBis = cardSelected.lastMsg;
                    lastInteractionBis = cardSelected.lastInteraction;
                }else if(vale4Interaction.values[0]== "rechazo"){
                    game.playValeCuatro(false);
                    rechazoTruco = {"ob":targetOb,"us":target,"val":true};
                    lastMsgInHand = vale4Msg;
                    return {"winnerOb":callerOb,"loserOb":targetOb,"winner":caller,"loser":target,"draw":false,"lastInteraction":vale4Interaction,"lastMsg":vale4Msg, "winnerCol":collectorCaller, "loserCol":collectorTarget};
                }else if(vale4Interaction.values[0]=="salir"){
                    salir = {"ob":targetOb,"us":target,"val":true};
                    lastMsgInHand = vale4Msg;
                    return {"winnerOb":callerOb,"loserOb":targetOb,"winner":caller,"loser":target,"draw":false,"lastInteraction":vale4Interaction,"lastMsg":vale4Msg, "winnerCol":collectorCaller, "loserCol":collectorTarget}; 
                }
            }else if(retrucoInteraction.values[0] == "acepto"){
                game.playRetruco(true);

                let cardSelected = await selectionCardRound(retrucoMsg,game,caller,target,callerOb,targetOb, collectorCaller, collectorTarget);

                cardCaller =cardSelected.cardC;
                cardTarget = cardSelected.cardT;
                truco = false;
                retruco = false;
                vale4 = true;
                needToPlayCards = false;
                lastMsgBis = cardSelected.lastMsg;
                lastInteractionBis = cardSelected.lastInteraction;
            }else if(retrucoInteraction.values[0]== "rechazo"){
                game.playRetruco(false);
                rechazoTruco = {"ob":callerOb,"us":caller,"val":true};
                lastMsgInHand= retrucoMsg;
                return {"winnerOb":targetOb,"loserOb":callerOb,"winner":target,"loser":caller,"draw":false,"lastInteraction":retrucoInteraction,"lastMsg":retrucoMsg, "winnerCol":collectorTarget, "loserCol":collectorCaller};
            }else if(retrucoInteraction.values[0]=="salir"){
                salir={"ob":callerOb,"us":caller,"val":true};
                lastMsgInHand = retrucoMsg;
                return {"winnerOb":targetOb,"loserOb":callerOb,"winner":target,"loser":caller,"draw":false,"lastInteraction":retrucoInteraction,"lastMsg":retrucoMsg, "winnerCol":collectorTarget, "loserCol":collectorCaller}; 
            } 
        }else if(trucoInteraction.values[0] == "acepto"){
            game.playTruco(true);
            let cardSelected = await selectionCardRound(trucoMsg,game,caller,target,callerOb,targetOb, collectorCaller, collectorTarget);

            cardCaller =cardSelected.cardC;
            cardTarget = cardSelected.cardT;
            truco = false;
            retruco = true;
            vale4 = false;
            needToPlayCards = false;
            lastMsgBis = cardSelected.lastMsg;
            lastInteractionBis = cardSelected.lastInteraction;
        }else if(trucoInteraction.values[0] == "rechazo"){
            game.playTruco(false);
            rechazoTruco = {"ob":targetOb,"us":target,"val":true};
            lastMsgInHand = trucoMsg;
            return {"winnerOb":callerOb,"loserOb":targetOb,"winner":caller,"loser":target,"draw":false,"lastInteraction":trucoInteraction,"lastMsg":trucoMsg, "winnerCol":collectorCaller, "loserCol":collectorTarget};
        }else if(trucoInteraction.values[0]== "salir"){
            salir = {"ob":targetOb,"us":target,"val":true};
            lastMsgInHand = trucoMsg;
            return {"winnerOb":callerOb,"loserOb":targetOb,"winner":caller,"loser":target,"draw":false,"lastInteraction":trucoInteraction,"lastMsg":trucoMsg, "winnerCol":collectorCaller, "loserCol":collectorTarget}; 
        }
    }else if(roundInteraction.values[0] == "retruco"){
        let retrucoRow = new ActionRowBuilder()
        .addComponents(retrucoSelectResponse);

        let retrucoMsg = await roundMsg.reply({
            content:`${target} que harás ahora?`,
            components:[retrucoRow]
        })

        let retrucoInteraction = await retrucoMsg.awaitMessageComponent({filter:collectorTarget, componentType:3,time:60000});
        
        retrucoMsg = await retrucoMsg.edit({
            content:`${target} seleccionó ${retrucoInteraction.values[0]}`,
            components:[],
            embeds:[]
        })

        if(retrucoInteraction.values[0] == "vale cuatro"){
            game.playRetruco(true);
            let vale4row = new ActionRowBuilder()
            .addComponents(valeCuatroSelectResponse);

            let vale4Msg = await retrucoMsg.reply({
                content:`${caller} que harás ahora?`,
                components:[vale4row]
            });

            let vale4Interaction = await vale4Msg.awaitMessageComponent({filter:collectorCaller, componentType:3, time:60000});

            vale4Msg = await vale4Msg.edit({
                content:`${caller} seleccionó ${vale4Interaction.values[0]}`,
                components:[],
                embeds:[]
            });

            if(vale4Interaction.values[0]== "acepto"){
                game.playValeCuatro(true);
                let cardSelected = await selectionCardRound(vale4Msg,game,caller,target,callerOb,targetOb, collectorCaller, collectorTarget);

                cardCaller = cardSelected.cardC;
                cardTarget = cardSelected.cardT;
                truco = false;
                retruco = false;
                vale4 = false;
                needToPlayCards=false;
                lastMsgBis = cardSelected.lastMsg;
                lastInteractionBis = cardSelected.lastInteraction;
            }else if(vale4Interaction.values[0]=="rechazo"){
                game.playValeCuatro(false);
                rechazoTruco = {"ob":callerOb,"us":caller,"val":true};
                lastMsgInHand = vale4Msg;
                return {"winnerOb":targetOb,"loserOb":callerOb,"winner":target,"loser":caller,"draw":false,"lastInteraction":vale4Interaction,"lastMsg":vale4Msg, "winnerCol":collectorTarget, "loserCol":collectorCaller};
            }else if(vale4Interaction.values[0]=="salir"){
                salir = {"ob":callerOb,"us":caller,"val":true};
                lastMsgInHand = vale4Msg;
                return {"winnerOb":targetOb,"loserOb":callerOb,"winner":target,"loser":caller,"draw":false,"lastInteraction":vale4Interaction,"lastMsg":vale4Msg, "winnerCol":collectorTarget, "loserCol":collectorCaller}; 
            }
        }else if(retrucoInteraction.values[0] == "acepto"){
            game.playRetruco(true);
            let cardSelected = await selectionCardRound(retrucoMsg, game,caller,target,callerOb,targetOb, collectorCaller, collectorTarget);
            
            cardCaller = cardSelected.cardC;
            cardTarget = cardSelected.cardT;
            truco = false;
            retruco = false;
            vale4 = true;
            needToPlayCards=false;
            lastMsgBis = cardSelected.lastMsg;
            lastInteractionBis = cardSelected.lastInteraction;
        }else if(retrucoInteraction.values[0] == "rechazo"){
            game.playRetruco(false);
            rechazoTruco = {"ob":targetOb,"us":target,"val":true};
            lastMsgInHand = retrucoMsg;
            return {"winnerOb":caller,"loserOb":targetOb,"winner":caller,"loser":target,"draw":false,"lastInteraction":retrucoInteraction,"lastMsg":retrucoMsg, "winnerCol":collectorCaller, "loserCol":collectorTarget};
        }else if(retrucoInteraction.values[0]=="salir"){
            salir = {"ob":targetOb,"us":target,"val":true};
            lastMsgInHand = retrucoMsg;
            return {"winnerOb":caller,"loserOb":targetOb,"winner":caller,"loser":target,"draw":false,"lastInteraction":retrucoInteraction,"lastMsg":retrucoMsg, "winnerCol":collectorCaller, "loserCol":collectorTarget}; 
        }
    }else if(roundInteraction.values[0]== "vale cuatro"){
        let vale4row = new ActionRowBuilder()
        .addComponents(valeCuatroSelectResponse);

        let vale4Msg = await roundMsg.reply({
            content:`${target} que harás ahora?`,
            components:[vale4row]
        });

        let vale4Interaction = await vale4Msg.awaitMessageComponent({filter:collectorTarget, componentType:3, time:60000});

        vale4Msg = await vale4Msg.edit({
            content:`${target} seleccionó ${vale4Interaction.values[0]}`,
            components:[],
            embeds:[]
        })
        if(vale4Interaction.values[0]== "acepto"){
            game.playValeCuatro(true);
            let cardSelected = await selectionCardRound(vale4Msg,game,caller,target,callerOb,targetOb, collectorCaller, collectorTarget);
            
            cardCaller = cardSelected.cardC;
            cardTarget = cardSelected.cardT;
            truco = false;
            retruco = false;
            vale4 = false;
            needToPlayCards=false;
            lastMsgBis = cardSelected.lastMsg;
            lastInteractionBis = cardSelected.lastInteraction;
        }else if(vale4Interaction.values[0]== "rechazo"){
            game.playValeCuatro(false);
            rechazoTruco = {"ob":targetOb,"us":target,"val":true};
            lastMsgInHand = vale4Msg;
            return {"winnerOb":callerOb,"loserOb":targetOb,"winner":caller,"loser":target,"draw":false,"lastInteraction":vale4Interaction,"lastMsg":vale4Msg, "winnerCol":collectorCaller, "loserCol":collectorTarget};
        }else if(vale4Interaction.values[0]=="salir"){
            salir={"ob":targetOb,"us":target,"val":true};
            lastMsgInHand = vale4Msg;
            return {"winnerOb":callerOb,"loserOb":targetOb,"winner":caller,"loser":target,"draw":false,"lastInteraction":vale4Interaction,"lastMsg":vale4Msg, "winnerCol":collectorCaller, "loserCol":collectorTarget}; 
        }
    }else if(['0','1','2'].includes(roundInteraction.values[0]) && needToPlayCards){
        cardCaller = callerOb.getHand[parseInt(roundInteraction.values[0])];
        callerOb.useCard(cardCaller);
        await game.sendCardsTo(caller,callerOb);
        await game.showTable(roundMsg);    //devuelve msg
        let targetRow = new ActionRowBuilder()
        .addComponents(selectResponseTarget);
        let roundTargetMsg = await roundMsg.reply({
            content:`${target} que harás ahora?`,
            components:[targetRow]
        });
                
        let roundTargetInteraction =await roundTargetMsg.awaitMessageComponent({filter:collectorTarget, componentType:3, time:60000});

        roundTargetMsg = await roundTargetMsg.edit({
            content:`${target} seleccionó ${roundTargetInteraction.values[0]}`,
            components:[],
            embeds:[]
        })

        if(roundTargetInteraction.values[0] == "truco"){
            let trucoRow = new ActionRowBuilder()
            .addComponents(trucoSelectResponse);
    
            let trucoMsg = await roundTargetMsg.reply({
                content:`${caller} que harás ahora?`,
                components:[trucoRow]
            })
    
            let trucoInteraction = await trucoMsg.awaitMessageComponent({filter:collectorCaller, componentType:3,time:60000});
            
            trucoMsg = await trucoMsg.edit({
                content:`${caller} seleccionó ${trucoInteraction.values[0]}`,
                components:[],
                embeds:[]
            })
    
            if(trucoInteraction.values[0]=="retruco"){
                game.playTruco(true);

                let retrucoRow = new ActionRowBuilder()
                .addComponents(retrucoSelectResponse);
    
                let retrucoMsg = await trucoMsg.reply({
                    content:`${target} que harás ahora?`,
                    components:[retrucoRow]
                })
    
                let retrucoInteraction = await retrucoMsg.awaitMessageComponent({filter:collectorTarget, componentType:3, time:60000});
    
                retrucoMsg = await retrucoMsg.edit({
                    content:`${target} seleccionó ${retrucoInteraction.values[0]}`,
                    components:[],
                    embeds:[],
                })
    
                if(retrucoInteraction.values[0]=="vale cuatro"){
                    game.playRetruco(true);

                    let vale4row = new ActionRowBuilder()
                    .addComponents(valeCuatroSelectResponse);
    
                    let vale4Msg = await retrucoMsg.reply({
                        content:`${caller} que harás ahora?`,
                        components:[vale4row]
                    });
    
                    let vale4Interaction = await vale4Msg.awaitMessageComponent({filter:collectorCaller, componentType:3, time:60000});
    
                    vale4Msg = await vale4Msg.edit({
                        content:`${caller} seleccionó ${vale4Interaction.values[0]}`,
                        components:[],
                        embeds:[]
                    })
    
                    if(vale4Interaction.values[0]== "acepto"){
                        game.playValeCuatro(true);

                        let rowCardSelection = new ActionRowBuilder()
                        .addComponents(cardsTargetOptions);

                        let cardMsgTarget = await vale4Msg.reply({
                            content:`${target} que harás ahora?`,
                            components:[rowCardSelection]
                        });

                        let cardTargetInteraction = await cardMsgTarget.awaitMessageComponent({filter:collectorTarget, componentType:3, time:60000});

                        cardMsgTarget = await cardMsgTarget.edit({
                            content:`${target} seleccionó ${cardTargetInteraction.values[0]}`,
                            components:[],
                            embeds:[]
                        })
                        if(['0','1','2'].includes(cardTargetInteraction.values[0])){
                            cardTarget = targetOb.getHand[parseInt(cardTargetInteraction.values[0])];
                            targetOb.useCard(cardTarget);
                            await game.sendCardsTo(target,targetOb);
                            lastMsgBis =await game.showTable(cardMsgTarget);
                            lastInteractionBis= cardTargetInteraction;
                        }
                        truco = false;
                        retruco = false;
                        vale4 = false;
                        needToPlayCards = false;
                    }else if(vale4Interaction.values[0]== "rechazo"){
                        game.playValeCuatro(false);
                        rechazoTruco = {"ob":targetOb,"us":target,"val":true};
                        lastMsgInHand = vale4Msg;
                        return {"winnerOb":callerOb,"loserOb":targetOb,"winner":caller,"loser":target,"draw":false,"lastInteraction":vale4Interaction,"lastMsg":vale4Msg, "winnerCol":collectorCaller, "loserCol":collectorTarget};
                    }else if(vale4Interaction.values[0]=="salir"){
                        salir = {"ob":targetOb,"us":target,"val":true};
                        lastMsgInHand = vale4Msg;
                        return {"winnerOb":callerOb,"loserOb":targetOb,"winner":caller,"loser":target,"draw":false,"lastInteraction":vale4Interaction,"lastMsg":vale4Msg, "winnerCol":collectorCaller, "loserCol":collectorTarget}; 
                    }
                }else if(retrucoInteraction.values[0] == "acepto"){
                    game.playRetruco(true);

                    let rowCardSelection = new ActionRowBuilder()
                    .addComponents(cardsTargetOptions);

                    let cardMsgTarget = await retrucoMsg.reply({
                        content:`${target} que harás ahora?`,
                        components:[rowCardSelection]
                    });

                    let cardTargetInteraction = await cardMsgTarget.awaitMessageComponent({filter:collectorTarget, componentType:3, time:60000});

                    cardMsgTarget = await cardMsgTarget.edit({
                        content:`${target} seleccionó ${cardTargetInteraction.values[0]}`,
                        components:[],
                        embeds:[]
                    })
                    if(['0','1','2'].includes(cardTargetInteraction.values[0])){
                        cardTarget = targetOb.getHand[parseInt(cardTargetInteraction.values[0])];
                        targetOb.useCard(cardTarget);
                        await game.sendCardsTo(target,targetOb);
                        lastMsgBis =await game.showTable(cardMsgTarget);
                        lastInteractionBis = cardTargetInteraction;
                    }
                    truco = false;
                    retruco = false;
                    vale4 = true;
                    needToPlayCards = false;
                }else if(retrucoInteraction.values[0]== "rechazo"){
                    game.playRetruco(false);
                    rechazoTruco = {"ob":targetOb,"us":target,"val":true};
                    lastMsgInHand = retrucoMsg;
                    return {"winnerOb":callerOb,"loserOb":targetOb,"winner":caller,"loser":target,"draw":false,"lastInteraction":retrucoInteraction,"lastMsg":retrucoMsg, "winnerCol":collectorCaller, "loserCol":collectorTarget};
                }else if(retrucoInteraction.values[0]=="salir"){
                    salir = {"ob":targetOb,"us":target,"val":true};
                    lastMsgInHand = retrucoMsg;
                    return {"winnerOb":callerOb,"loserOb":targetOb,"winner":caller,"loser":target,"draw":false,"lastInteraction":retrucoInteraction,"lastMsg":retrucoMsg, "winnerCol":collectorCaller, "loserCol":collectorTarget}; 
                }
            }else if(trucoInteraction.values[0] == "acepto"){
                game.playTruco(true);

                let rowCardSelection = new ActionRowBuilder()
                .addComponents(cardsTargetOptions);

                let cardMsgTarget = await trucoMsg.reply({
                    content:`${target} que harás ahora?`,
                    components:[rowCardSelection]
                });

                let cardTargetInteraction = await cardMsgTarget.awaitMessageComponent({filter:collectorTarget, componentType:3, time:60000});

                cardMsgTarget = await cardMsgTarget.edit({
                    content:`${target} seleccionó ${cardTargetInteraction.values[0]}`,
                    components:[],
                    embeds:[]
                })
                if(['0','1','2'].includes(cardTargetInteraction.values[0])){
                    cardTarget = targetOb.getHand[parseInt(cardTargetInteraction.values[0])];
                    targetOb.useCard(cardTarget);
                    await game.sendCardsTo(target,targetOb);
                    lastMsgBis = await game.showTable(cardMsgTarget);
                    lastInteractionBis = cardTargetInteraction;
                }
                truco = false;
                retruco = true;
                vale4 = false;
                needToPlayCards = false;
            }else if(trucoInteraction.values[0] == "rechazo"){
                game.playTruco(false);
                rechazoTruco = {"ob":callerOb,"us":caller,"val":true};
                lastMsgInHand = trucoMsg;
                return {"winnerOb":targetOb,"loserOb":callerOb,"winner":target,"loser":caller,"draw":false,"lastInteraction":trucoInteraction,"lastMsg":trucoMsg, "winnerCol":collectorTarget, "loserCol":collectorCaller};
            }else if(trucoInteraction.values[0]=="salir"){
                salir = {"ob":callerOb,"us":caller,"val":true};
                lastMsgInHand = trucoMsg;
                return {"winnerOb":targetOb,"loserOb":callerOb,"winner":target,"loser":caller,"draw":false,"lastInteraction":trucoInteraction,"lastMsg":trucoMsg, "winnerCol":collectorTarget, "loserCol":collectorCaller}; 
            }
        }else if(roundTargetInteraction.values[0] == "retruco"){ 
            let retrucoRow = new ActionRowBuilder()
            .addComponents(retrucoSelectResponse);
    
            let retrucoMsg = await roundTargetMsg.reply({
                content:`${caller} que harás ahora?`,
                components:[retrucoRow]
            })
    
            let retrucoInteraction = await retrucoMsg.awaitMessageComponent({filter:collectorCaller, componentType:3,time:60000});
            
            retrucoMsg = await retrucoMsg.edit({
                content:`${caller} seleccionó ${retrucoInteraction.values[0]}`,
                components:[],
                embeds:[]
            })
    
            if(retrucoInteraction.values[0] == "vale cuatro"){
                game.playRetruco(true);
                let vale4row = new ActionRowBuilder()
                .addComponents(valeCuatroSelectResponse);
    
                let vale4Msg = await retrucoMsg.reply({
                    content:`${target} que harás ahora?`,
                    components:[vale4row]
                });
    
                let vale4Interaction = await vale4Msg.awaitMessageComponent({filter:collectorTarget, componentType:3, time:60000});
    
                vale4Msg = await vale4Msg.edit({
                    content:`${target} seleccionó ${vale4Interaction.values[0]}`,
                    components:[],
                    embeds:[]
                });
    
                if(vale4Interaction.values[0]== "acepto"){
                    game.playValeCuatro(true);
                    let rowCardSelection = new ActionRowBuilder()
                    .addComponents(cardsTargetOptions);

                    let cardMsgTarget = await vale4Msg.reply({
                        content:`${target} que harás ahora?`,
                        components:[rowCardSelection]
                    });

                    let cardTargetInteraction = await cardMsgTarget.awaitMessageComponent({filter:collectorTarget, componentType:3, time:60000});

                    cardMsgTarget = await cardMsgTarget.edit({
                        content:`${target} seleccionó ${cardTargetInteraction.values[0]}`,
                        components:[],
                        embeds:[]
                    })
                    if(['0','1','2'].includes(cardTargetInteraction.values[0])){
                        cardTarget = targetOb.getHand[parseInt(cardTargetInteraction.values[0])];
                        targetOb.useCard(cardTarget);
                        await game.sendCardsTo(target,targetOb);
                        lastMsgBis =await game.showTable(cardMsgTarget);
                        lastInteractionBis = cardTargetInteraction;
                    }
                    truco = false;
                    retruco = false;
                    vale4 = false;
                    needToPlayCards=false;
                }else if(vale4Interaction.values[0]=="rechazo"){
                    game.playValeCuatro(false);
                    rechazoTruco = {"ob":targetOb,"us":target,"val":true};
                    lastMsgInHand = vale4Msg;
                    return {"winnerOb":callerOb,"loserOb":targetOb,"winner":caller,"loser":target,"draw":false,"lastInteraction":roundTargetInteraction,"lastMsg":roundTargetMsg, "winnerCol":collectorCaller, "loserCol":collectorTarget};
                }else if(vale4Interaction.values[0]=="salir"){
                    salir = {"ob":targetOb,"us":target,"val":true};
                    lastMsgInHand = vale4Msg;
                    return {"winnerOb":callerOb,"loserOb":targetOb,"winner":caller,"loser":target,"draw":false,"lastInteraction":vale4Interaction,"lastMsg":vale4Msg, "winnerCol":collectorCaller, "loserCol":collectorTarget}; 
                }
            }else if(retrucoInteraction.values[0] == "acepto"){
                game.playRetruco(true);
                let rowCardSelection = new ActionRowBuilder()
                .addComponents(cardsTargetOptions);

                let cardMsgTarget = await retrucoMsg.reply({
                    content:`${target} que harás ahora?`,
                    components:[rowCardSelection]
                });

                let cardTargetInteraction = await cardMsgTarget.awaitMessageComponent({filter:collectorTarget, componentType:3, time:60000});

                cardMsgTarget = await cardMsgTarget.edit({
                    content:`${target} seleccionó ${cardTargetInteraction.values[0]}`,
                    components:[],
                    embeds:[]
                })
                if(['0','1','2'].includes(cardTargetInteraction.values[0])){
                    cardTarget = targetOb.getHand[parseInt(cardTargetInteraction.values[0])];
                    targetOb.useCard(cardTarget);
                    await game.sendCardsTo(target,targetOb);
                    lastMsgBis =await game.showTable(cardMsgTarget);
                    lastInteractionBis = cardTargetInteraction;
                }
                truco = false;
                retruco = false;
                vale4 = true;
                needToPlayCards=false;
            }else if(retrucoInteraction.values[0] == "rechazo"){
                game.playRetruco(false);
                rechazoTruco={"ob":callerOb,"us":caller,"val":true};
                lastMsgInHand = retrucoMsg;
                return {"winnerOb":targetOb,"loserOb":callerOb,"winner":target,"loser":caller,"draw":false,"lastInteraction":retrucoInteraction,"lastMsg":retrucoMsg, "winnerCol":collectorTarget, "loserCol":collectorCaller};
            }else if(retrucoInteraction.values[0]=="salir"){
                salir = {"ob":callerOb,"us":caller,"val":true};
                lastMsgInHand = retrucoMsg;
                return {"winnerOb":targetOb,"loserOb":callerOb,"winner":target,"loser":caller,"draw":false,"lastInteraction":retrucoInteraction,"lastMsg":retrucoMsg, "winnerCol":collectorTarget, "loserCol":collectorCaller}; 
            }
        }else if(roundTargetInteraction.values[0]== "vale cuatro"){
            let vale4row = new ActionRowBuilder()
            .addComponents(valeCuatroSelectResponse);
    
            let vale4Msg = await roundTargetMsg.reply({
                content:`${caller} que harás ahora?`,
                components:[vale4row]
            });
    
            let vale4Interaction = await vale4Msg.awaitMessageComponent({filter:collectorCaller, componentType:3, time:60000});
    
            vale4Msg = await vale4Msg.edit({
                content:`${caller} seleccionó ${vale4Interaction.values[0]}`,
                components:[],
                embeds:[]
            })
            if(vale4Interaction.values[0]== "acepto"){
                game.playValeCuatro(true);
                let rowCardSelection = new ActionRowBuilder()
                .addComponents(cardsTargetOptions);

                let cardMsgTarget = await vale4Msg.reply({
                    content:`${target} que harás ahora?`,
                    components:[rowCardSelection]
                });

                let cardTargetInteraction = await cardMsgTarget.awaitMessageComponent({filter:collectorTarget, componentType:3, time:60000});

                cardMsgTarget = await cardMsgTarget.edit({
                    content:`${target} seleccionó ${cardTargetInteraction.values[0]}`,
                    components:[],
                    embeds:[]
                })
                if(['0','1','2'].includes(cardTargetInteraction.values[0])){
                    cardTarget = targetOb.getHand[parseInt(cardTargetInteraction.values[0])];
                    targetOb.useCard(cardTarget);
                    await game.sendCardsTo(target,targetOb);
                    lastMsgBis=await game.showTable(cardMsgTarget);
                    lastInteractionBis=cardTargetInteraction;
                }
                truco = false;
                retruco = false;
                vale4 = false;
                needToPlayCards=false;
            }else if(vale4Interaction.values[0]== "rechazo"){
                game.playValeCuatro(false);
                rechazoTruco = {"ob":callerOb,"us":caller,"val":true};
                lastMsgInHand = vale4Msg;
                return {"winnerOb":targetOb,"loserOb":callerOb,"winner":target,"loser":caller,"draw":false,"lastInteraction":vale4Interaction,"lastMsg":vale4Msg, "winnerCol":collectorTarget, "loserCol":collectorCaller};
            }else if(vale4Interaction.values[0]=="salir"){
                salir = {"ob":callerOb,"us":caller,"val":true};
                lastMsgInHand = vale4Msg;
                return {"winnerOb":targetOb,"loserOb":callerOb,"winner":target,"loser":caller,"draw":false,"lastInteraction":vale4Interaction,"lastMsg":vale4Msg, "winnerCol":collectorTarget, "loserCol":collectorCaller}; 
            }
        }else if(['0','1','2'].includes(roundTargetInteraction.values[0]) && needToPlayCards){
            cardTarget = targetOb.getHand[parseInt(roundTargetInteraction.values[0])];

            targetOb.useCard(cardTarget);
            await game.sendCardsTo(target,targetOb);
            lastMsgBis=await game.showTable(roundTargetMsg);
            lastInteractionBis = roundTargetInteraction;
        }else if(roundTargetInteraction.values[0]=="salir"){
            salir = {"ob":targetOb,"us":target,"val":true};
            lastMsgInHand = roundTargetMsg;
            return {"winnerOb":callerOb,"loserOb":targetOb,"winner":caller,"loser":target,"draw":false,"lastInteraction":roundTargetInteraction,"lastMsg":roundTargetMsg, "winnerCol":collectorCaller, "loserCol":collectorTarget}; 
        }
    }else if(roundInteraction.values[0]=="salir"){
        salir = {"ob":callerOb,"us":caller,"val":true};
        lastMsgInHand = roundMsg;
        return {"winnerOb":targetOb,"loserOb":callerOb,"winner":target,"loser":caller,"draw":false,"lastInteraction":roundInteraction,"lastMsg":roundMsg, "winnerCol":collectorTarget, "loserCol":collectorCaller}; 
    }

    if(!salir.val && !rechazoTruco.val){
        let pointsCaller = cardCaller.getTrucoValue;
        let pointsTarget = cardTarget.getTrucoValue;
        
        if(pointsCaller > pointsTarget){
            return {"winnerOb":callerOb,"loserOb":targetOb,"winner":caller,"loser":target,"draw":false,"lastInteraction":lastInteractionBis,"lastMsg":lastMsgBis, "winnerCol":collectorCaller, "loserCol":collectorTarget};  
        }else if(pointsCaller < pointsTarget){
            return {"winnerOb":targetOb,"loserOb":callerOb,"winner":target,"loser":caller,"draw":false,"lastInteraction":lastInteractionBis,"lastMsg":lastMsgBis, "winnerCol":collectorTarget, "loserCol":collectorCaller};  
        }else{
            return {"winnerOb":callerOb,"loserOb":targetOb,"winner":caller,"loser":target,"draw":true,"lastInteraction":lastInteractionBis,"lastMsg":lastMsgBis, "winnerCol":collectorCaller, "loserCol":collectorTarget};  
        }
    }
}
let pointsInGame;
let lastMsgInHand;
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
        
        let userOb = game.getUser;
        let rivalOb = game.getRival;

        const cortar = new ButtonBuilder()
        .setCustomId('cortar')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🟢');

        const nocortar = new ButtonBuilder()
        .setCustomId('nocortar')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔴');
        lastMsgInHand = interaction;
        let iHand = 0;
        while(userOb.getPoints <15 && rivalOb.getPoints < 15){
            const cortarRow = new ActionRowBuilder()
            .addComponents(cortar,nocortar);

            let rivalresponse = await lastMsgInHand.reply({
                content:`${rival}\nVas a cortar o no?\n`,
                components : [cortarRow],
            })

            const collectorRivalFilter = (i) => i.user.id === rival.id;
            const collectorUserFilter = (i) => i.user.id === user.id;
            let firstRound, secondRound, thirdRound;
            let rivalFirstCard, userFirstCard;
            let firstRoundDone = false;
            try{
                const cortarInteraction = await rivalresponse.awaitMessageComponent({ filter:collectorRivalFilter, componentType: 2, time: 60000 });


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
                .setCustomId('rivalCardSelectStarter')
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
                
                cardSelect = addCardOptions(cardSelect, rivalOb);
                
                let cardSelect2 = new StringSelectMenuBuilder()
                .setCustomId('userCardSelectStarter')
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

                cardSelect2 = addCardOptions(cardSelect2, userOb);

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
                
                const round1RivalInteraction = await round1response.awaitMessageComponent({collectorRivalFilter, componentType: 3, time: 60000 });
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
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Salir')
                        .setValue('salir'),
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
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Salir')
                        .setValue('salir'),
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
                    .setValue('rechazo'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Salir')
                    .setValue('salir'),);

                let lastMsgFirstRound;
                console.log(round1RivalInteraction.values);
                if(round1RivalInteraction.values[0] == "truco"){
                    truco = false;
                    retruco = true;
                    vale4 = false;
                    lastMsgFirstRound= await trucoFirstRound(trucoSelectResponseRound1, round1response, round1RivalInteraction, game, user, rival,userOb,rivalOb, collectorUserFilter, collectorRivalFilter, retrucoSelectResponse, vale4SelectResponse);
                }else if(round1RivalInteraction.values[0] == '0' || round1RivalInteraction.values[0] == '1' || round1RivalInteraction.values[0] == '2'){
                    rivalFirstCard = rivalOb.getHand[parseInt(round1RivalInteraction.values[0])];
                    rivalOb.useCard(rivalFirstCard);
                    await game.sendCardsTo(rival,rivalOb);
                    await game.showTable(round1response);   //esto tmb devuelve un msg....

                    let cardRound1Row = new ActionRowBuilder()
                    .addComponents(cardSelect2);
                    
                    let userCardRespMsg = await round1response.reply({
                        content: `${user} que harás ahora?`,
                        components:[cardRound1Row],
                    })

                    let userCardResp = await userCardRespMsg.awaitMessageComponent({filter:collectorUserFilter, componentType:3,time:60000});

                    userCardRespMsg = await userCardRespMsg.edit({
                        content:`${user} seleccionó ${userCardResp.values[0]}`,
                        components:[],
                        embeds:[]
                    })

                    if(userCardResp.values[0] == "truco"){
                        truco = false;
                        retruco = true;
                        vale4 = false;
                        jugarEnvido = false;
                        let msg = await trucoFirstRound(trucoSelectResponseRound1, userCardRespMsg, userCardResp, game, rival, user,rivalOb,userOb, collectorRivalFilter, collectorUserFilter, retrucoSelectResponse, vale4SelectResponse);

                        let selectCardUserFR = new StringSelectMenuBuilder()
                        .setCustomId('trucoResp')
                        .setPlaceholder('Select your response!')
                        .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Salir')
                            .setValue('salir'))

                        if(truco){
                            selectCardUserFR = selectCardUserFR.addOptions(
                            new StringSelectMenuOptionBuilder().setLabel('Truco').setValue('truco'))
                        }else if(retruco){
                            selectCardUserFR = selectCardUserFR.addOptions(
                                new StringSelectMenuOptionBuilder().setLabel('Quiero re truco').setValue('retruco'))
                        }else if(vale4){
                            selectCardUserFR = selectCardUserFR.addOptions(
                                new StringSelectMenuOptionBuilder().setLabel('QUIERO VALE CUATRO').setValue('vale cuatro'))
                        }
                        selectCardUserFR = addCardOptions(selectCardUserFR, userOb);
                        let selectFRrow = new ActionRowBuilder()
                        .addComponents(selectCardUserFR);

                        let selectFRMsg = await msg.reply({
                            content: `${user} que harás ahora?`,
                            components:[selectFRrow],
                        });

                        let selectFRInteraction = await selectFRMsg.awaitMessageComponent({filter:collectorUserFilter, componentType:3,time:60000});

                        selectFRMsg = await selectFRMsg.edit({
                            content:`${user} seleccionó ${userCardResp.values[0]}`,
                            components:[],
                            embeds:[]
                        })

                        if(['0','1','2'].includes(selectFRInteraction.values[0])){
                            userFirstCard =userOb.getHand[parseInt(selectFRInteraction.values[0])];
                            userOb.useCard(userFirstCard);
                            await game.sendCardsTo(user,userOb);
                            let lastMsg = await game.showTable(selectFRMsg);
                            lastMsgFirstRound = lastMsg;
                            jugarEnvido = false;
                            if(rivalFirstCard.getTrucoValue > userFirstCard.getTrucoValue){
                                firstRound = {"winnerOb":rivalOb,"loserOb":userOb,"winner":rival, "loser":user,"draw":false, "lastInteraction":selectFRInteraction,"lastMsg":lastMsg,"winnerCol":collectorRivalFilter,"loserCol":collectorUserFilter};
                            }else if(rivalFirstCard.getTrucoValue < userFirstCard.getTrucoValue){
                                firstRound = {"winnerOb":userOb,"loserOb":rivalOb,"winner":user, "loser":rival,"draw":false, "lastInteraction":selectFRInteraction,"lastMsg":lastMsg,"winnerCol":collectorUserFilter,"loserCol":collectorRivalFilter};
                            }else{
                                firstRound = {"winnerOb":rivalOb,"loserOb":userOb,"winner":rival, "loser":user,"draw":true, "lastInteraction":selectFRInteraction,"lastMsg":lastMsg,"winnerCol":collectorRivalFilter,"loserCol":collectorUserFilter};
                            }
                            firstRoundDone = true;
                            if(firstRound.draw){
                                game.winRound(null);
                                game.nextRound();
                            }else{
                                game.winRound(firstRound.winnerOb);
                                game.nextRound();
                            }
                        }else if(selectFRInteraction.values[0] == "salir"){
                            salir = {"ob":userOb,"us":user,"val":true};
                            lastMsgInHand = selectFRMsg;
                        }
                    }else if(userCardResp.values[0] == '0' || userCardResp.values[0] == '1' || userCardResp.values[0] == '2'){
                        userFirstCard =userOb.getHand[parseInt(userCardResp.values[0])]; 
                        userOb.useCard(userFirstCard);
                        await game.sendCardsTo(user,userOb);
                        let lassstmsg = await game.showTable(userCardRespMsg);    //devuelve msg

                        lastMsgFirstRound = lassstmsg;
                        jugarEnvido = false;
                        if(rivalFirstCard.getTrucoValue > userFirstCard.getTrucoValue){
                            firstRound = {"winnerOb":rivalOb,"loserOb":userOb,"winner":rival, "loser":user,"draw":false, "lastInteraction":userCardResp,"lastMsg":lassstmsg,"winnerCol":collectorRivalFilter,"loserCol":collectorUserFilter};
                        }else if(rivalFirstCard.getTrucoValue < userFirstCard.getTrucoValue){
                            firstRound = {"winnerOb":userOb,"loserOb":rivalOb,"winner":user, "loser":rival,"draw":false, "lastInteraction":userCardResp,"lastMsg":lassstmsg,"winnerCol":collectorUserFilter,"loserCol":collectorRivalFilter};
                        }else{
                            firstRound = {"winnerOb":rivalOb,"loserOb":userOb,"winner":rival, "loser":user,"draw":true, "lastInteraction":userCardResp,"lastMsg":lassstmsg,"winnerCol":collectorRivalFilter,"loserCol":collectorUserFilter};
                        }
                        firstRoundDone = true;
                        if(firstRound.draw){
                            game.winRound(null);
                            game.nextRound();
                        }else{
                            game.winRound(firstRound.winnerOb);
                            game.nextRound();
                        }
                        lastMsgInHand = firstRound.lastMsg;
                    }else if(userCardResp.values[0]== "salir"){
                        salir = {"ob":userOb,"us":user,"val":true};
                        lastMsgInHand = userCardRespMsg;
                    }else if(["envido", "real envido", "falta envido"].includes(userCardResp.values[0])){
                        const round = await roundEnvido(userCardResp, userCardRespMsg,game,rival,user,rivalOb, userOb,collectorRivalFilter, collectorUserFilter);
                        let pointsRival = rivalOb.getCardPoints;
                        let pointsUser = userOb.getCardPoints;
                        pointsInGame = game.getPointsEnvido;
                        let lastmsg;   //si lo cancela se lleva el otroxd
                        let elegirCarta = false;
                        if(!round.rechazo.val){
                            if(pointsRival > pointsUser){
                                rivalOb.addPoints(pointsInGame);
                                lastmsg =await round.lastMsg.reply({
                                    content:`${rival} se lleva ${pointsInGame} puntos de envido!`,
                                    components:[],
                                    embeds:[]
                                })
                            }else if(pointsUser > pointsRival){
                                userOb.addPoints(pointsInGame);
                                lastmsg =await round.lastMsg.reply({
                                    content:`${user} se lleva ${pointsInGame} puntos de envido!`,
                                    components:[],
                                    embeds:[]
                                })
                            }else{
                                userOb.addPoints(pointsInGame);
                                lastmsg =await round.lastMsg.reply({
                                    content:`${user} se lleva ${pointsInGame} puntos de envido!`,
                                    components:[],
                                    embeds:[]
                                })
                            }
                        }else{
                            let usEnvob = round.rechazo.us==user?rivalOb:userOb;
                            let usEnv = round.rechazo.us == user ?rival:user;
                            
                            usEnvob.addPoints(pointsInGame);
                            lastmsg = await round.lastMsg.reply({
                                content:`${usEnv} se lleva ${pointsInGame} puntos de envido!`,
                                components:[],
                                embeds:[]
                            })
                        }
                        jugarEnvido = false;
                        let select = new StringSelectMenuBuilder()
                        .setCustomId('select')
                        .setPlaceholder('Select your response!')
                        .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Truco')
                            .setValue('truco'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Salir')
                            .setValue('salir'),);
                        select = addCardOptions(select, userOb);

                        let rowselect = new ActionRowBuilder()
                        .addComponents(select);
                        
                        let selectUserMsg = await lastmsg.reply({
                            content:`${user} que harás ahora?`,
                            components:[rowselect]
                        })

                        let selectUserInteraction = await selectUserMsg.awaitMessageComponent({filter:collectorUserFilter, componentType:3,time:60000});

                        selectUserMsg = await selectUserMsg.edit({
                            content:`${user} seleccionó ${selectUserInteraction.values[0]}`,
                            components:[],
                            embeds:[]
                        })

                        if(selectUserInteraction.values[0] == "truco"){
                            let trucoResp = new StringSelectMenuBuilder()
                            .setCustomId('truco')
                            .setPlaceholder('Select your response!')
                            .addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel('Quiero')
                                .setValue('acepto'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('No quiero')
                                .setValue('rechazo'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('Retruco')
                                .setValue('retruco'),);
                            let trucoRow = new ActionRowBuilder().addComponents(trucoResp);
                            
                            let rivalTrucoMsg = await selectUserMsg.reply({
                                content:`${rival} que harás ahora?`,
                                components:[trucoRow]
                            })
        
                            let rivalTrucoInteraction = await rivalTrucoMsg.awaitMessageComponent({filter:collectorRivalFilter, componentType:3,time:60000});
        
                            rivalTrucoMsg = await rivalTrucoMsg.edit({
                                content:`${rival} seleccionó ${rivalTrucoInteraction.values[0]}`,
                                components:[],
                                embeds:[]
                            })

                            if(rivalTrucoInteraction.values[0]== "acepto"){
                                game.playTruco(true);
                                truco = false;
                                retruco = true;
                                vale4 = false;
                                lastmsg = rivalTrucoMsg;
                            }else if(rivalTrucoInteraction.values[0]== "rechazo"){
                                game.playTruco(false);
                                rechazoTruco = {"ob":rivalOb,"us":rival,"val":true};
                                lastMsgInHand = rivalTrucoMsg
                            }else if(rivalTrucoInteraction.values[0]=="retruco"){
                                game.playTruco(true);
                                let retrucoResp = new StringSelectMenuBuilder()
                                .setCustomId('retruco')
                                .setPlaceholder('Select your response!')
                                .addOptions(
                                new StringSelectMenuOptionBuilder()
                                    .setLabel('Quiero')
                                    .setValue('acepto'),
                                new StringSelectMenuOptionBuilder()
                                        .setLabel('No quiero')
                                        .setValue('rechazo'),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel('QUIERO VALE CUATRO')
                                    .setValue('vale cuatro'),);
                                let retrucoRow = new ActionRowBuilder().addComponents(retrucoResp);
                                
                                let userRetrucoMsg = await rivalTrucoMsg.reply({
                                    content:`${user} que harás ahora?`,
                                    components:[retrucoRow]
                                })
            
                                let userRetrucoInteraction = await userRetrucoMsg.awaitMessageComponent({filter:collectorUserFilter, componentType:3,time:60000});
            
                                userRetrucoMsg = await userRetrucoMsg.edit({
                                    content:`${user} seleccionó ${userRetrucoInteraction.values[0]}`,
                                    components:[],
                                    embeds:[]
                                })

                                if(userRetrucoInteraction.values[0] =="acepto"){
                                    game.playRetruco(true);
                                    truco = false;
                                    retruco = false;
                                    vale4 = true;
                                    lastmsg = userRetrucoMsg;
                                }else if(userRetrucoInteraction.values[0]=="rechazo"){
                                    game.playRetruco(false);
                                    rechazoTruco = {"ob":userOb,"us":user,"val":true};
                                    lastMsgInHand = userRetrucoMsg;
                                }else if(userRetrucoInteraction.values[0]=="vale cuatro"){
                                    game.playRetruco(true);
                                    let vale4Resp = new StringSelectMenuBuilder()
                                    .setCustomId('vale4')
                                    .setPlaceholder('Select your response!')
                                    .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Quiero')
                                        .setValue('acepto'),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('No quiero')
                                        .setValue('rechazo'),)
                                    let vale4Row = new ActionRowBuilder().addComponents(vale4Resp);
                                    
                                    let rivalvale4Msg = await userRetrucoMsg.reply({
                                        content:`${rival} que harás ahora?`,
                                        components:[vale4Row]
                                    })
                
                                    let rivalVale4Interaction = await rivalvale4Msg.awaitMessageComponent({filter:collectorRivalFilter, componentType:3,time:60000});
                
                                    rivalvale4Msg = await rivalvale4Msg.edit({
                                        content:`${rival} seleccionó ${rivalVale4Interaction.values[0]}`,
                                        components:[],
                                        embeds:[]
                                    })
                                    if(rivalVale4Interaction.values[0]=="acepto"){
                                        game.playValeCuatro(true);
                                        truco = false;
                                        retruco = false;
                                        vale4 = false;
                                        lastmsg = rivalvale4Msg;
                                    }else if(rivalVale4Interaction.values[0]=="rechazo"){
                                        game.playValeCuatro(false);
                                        rechazoTruco = {"ob":rivalOb,"us":rival,"val":true};
                                        lastMsgInHand = rivalVale4Interaction;
                                    }
                                }
                            }
                            elegirCarta = true;
                            jugarEnvido = false;
                        }else if(["0","1","2"].includes(selectUserInteraction.values[0])){
                            userFirstCard =userOb.getHand[parseInt(selectUserInteraction.values[0])]; 
                            userOb.useCard(userFirstCard);
                            await game.sendCardsTo(user,userOb);
                            let lassstmsg = await game.showTable(selectUserMsg);    //devuelve msg

                            lastMsgFirstRound = lassstmsg;
                            if(rivalFirstCard.getTrucoValue > userFirstCard.getTrucoValue){
                                firstRound = {"winnerOb":rivalOb,"loserOb":userOb,"winner":rival, "loser":user,"draw":false, "lastInteraction":selectUserInteraction,"lastMsg":lassstmsg,"winnerCol":collectorRivalFilter,"loserCol":collectorUserFilter};
                            }else if(rivalFirstCard.getTrucoValue < userFirstCard.getTrucoValue){
                                firstRound = {"winnerOb":userOb,"loserOb":rivalOb,"winner":user, "loser":rival,"draw":false, "lastInteraction":selectUserInteraction,"lastMsg":lassstmsg,"winnerCol":collectorUserFilter,"loserCol":collectorRivalFilter};
                            }else{
                                firstRound = {"winnerOb":rivalOb,"loserOb":userOb,"winner":rival, "loser":user,"draw":true, "lastInteraction":selectUserInteraction,"lastMsg":lassstmsg,"winnerCol":collectorRivalFilter,"loserCol":collectorUserFilter};
                            }
                            firstRoundDone = true;
                            if(firstRound.draw){
                                game.winRound(null);
                                game.nextRound();
                            }else{
                                game.winRound(firstRound.winnerOb);
                                game.nextRound();
                            }
                            lastMsgInHand = firstRound.lastMsg;
                            jugarEnvido = false;
                        }else if(selectUserInteraction.values[0]=="salir"){
                            salir = {"ob":userOb,"us":user,"val":true};
                            lastMsgInHand = selectUserMsg;
                        }
                        if(elegirCarta && !rechazoTruco.val){
                            let selectCardUser = new StringSelectMenuBuilder()
                            .setCustomId('selectCardUser')
                            .setPlaceholder('Selecciona tu jugada')
                            .setOptions(new StringSelectMenuOptionBuilder().setLabel('Salir').setValue('salir'));

                            selectCardUser = addCardOptions(selectCardUser,userOb);

                            let selectCardRow = new ActionRowBuilder().addComponents(selectCardUser);

                            let selectCardMsg = await lastmsg.reply({
                                content:`${user} que harás ahora?`,
                                components:[selectCardRow]
                            })
        
                            let selectCardInteraction = await selectCardMsg.awaitMessageComponent({filter:collectorUserFilter, componentType:3,time:60000});
        
                            selectCardMsg = await selectCardMsg.edit({
                                content:`${user} seleccionó ${selectCardInteraction.values[0]}`,
                                components:[],
                                embeds:[]
                            })

                            if(selectCardInteraction.values[0] != "salir"){
                                userFirstCard =userOb.getHand[parseInt(selectUserInteraction.values[0])]; 
                                userOb.useCard(userFirstCard);
                                await game.sendCardsTo(user,userOb);
                                let lassstmsg = await game.showTable(selectUserMsg);    //devuelve msg

                                lastMsgFirstRound = lassstmsg;
                                if(rivalFirstCard.getTrucoValue > userFirstCard.getTrucoValue){
                                    firstRound = {"winnerOb":rivalOb,"loserOb":userOb,"winner":rival, "loser":user,"draw":false, "lastInteraction":selectCardInteraction,"lastMsg":lassstmsg,"winnerCol":collectorRivalFilter,"loserCol":collectorUserFilter};
                                }else if(rivalFirstCard.getTrucoValue < userFirstCard.getTrucoValue){
                                    firstRound = {"winnerOb":userOb,"loserOb":rivalOb,"winner":user, "loser":rival,"draw":false, "lastInteraction":selectCardInteraction,"lastMsg":lassstmsg,"winnerCol":collectorUserFilter,"loserCol":collectorRivalFilter};
                                }else{
                                    firstRound = {"winnerOb":rivalOb,"loserOb":userOb,"winner":rival, "loser":user,"draw":true, "lastInteraction":selectCardInteraction,"lastMsg":lassstmsg,"winnerCol":collectorRivalFilter,"loserCol":collectorUserFilter};
                                }
                                if(firstRound.draw){
                                    game.winRound(null);
                                    game.nextRound();
                                }else{
                                    game.winRound(firstRound.winnerOb);
                                    game.nextRound();
                                }
                                lastMsgInHand = firstRound.lastMsg;
                            }else{
                                salir = {"ob":userOb,"us":user,"val":true};
                                lastMsgInHand = selectCardMsg;
                            }
                            jugarEnvido = false;
                        }
                    }
                    
                }else if(round1RivalInteraction.values[0]== "salir"){
                    salir = {"ob":rivalOb,"us":rival,"val":true}
                    lastMsgInHand = round1response;
                }
                if(jugarEnvido && !rechazoTruco.val && !salir.val){
                    const round = await roundEnvido(round1RivalInteraction, round1response, game, user,rival, userOb, rivalOb, collectorUserFilter, collectorRivalFilter);   
                    let pointsRival = rivalOb.getCardPoints;
                    let pointsUser = userOb.getCardPoints;
                    pointsInGame = game.getPointsEnvido;
                    let lastmsg;
                    if(!round.rechazo.val){
                        if(pointsRival > pointsUser){
                            rivalOb.addPoints(pointsInGame);
                            lastmsg =await round.lastMsg.reply({
                                content:`${rival} se lleva ${pointsInGame} puntos de envido!`,
                                components:[],
                                embeds:[]
                            })
                        }else if(pointsUser > pointsRival){
                            userOb.addPoints(pointsInGame);
                            lastmsg =await round.lastMsg.reply({
                                content:`${user} se lleva ${pointsInGame} puntos de envido!`,
                                components:[],
                                embeds:[]
                            })
                        }else{
                            rivalOb.addPoints(pointsInGame);
                            lastmsg =await round.lastMsg.reply({
                                content:`${rival} se lleva ${pointsInGame} puntos de envido!`,
                                components:[],
                                embeds:[]
                            })
                        }
                    }else{
                        let usEnvob = round.rechazo.us==user?rivalOb:userOb;
                        let usEnv = round.rechazo.us == user ?rival:user;
                        usEnvob.addPoints(pointsInGame);
                        lastmsg = await round.lastMsg.reply({
                            content:`${usEnv} se lleva ${pointsInGame} puntos de envido!`,
                            components:[],
                            embeds:[]
                        })
                    }
                    lastMsgFirstRound = lastmsg;
                }
                if(!firstRoundDone && !rechazoTruco.val && !salir.val){
                    firstRound = await playRound(lastMsgFirstRound, game, rival, user, rivalOb, userOb, collectorRivalFilter, collectorUserFilter);
                    lastMsgInHand = firstRound.lastMsg;
                    if(!salir.val){
                        if(firstRound.draw){
                            game.winRound(null);
                            game.nextRound();
                        }else{
                            game.winRound(firstRound.winnerOb);
                            game.nextRound();
                        }
                    }
                }
                if(!rechazoTruco.val && !salir.val){
                    secondRound = await playRound(firstRound.lastMsg, game,firstRound.winner, firstRound.loser, firstRound.winnerOb, firstRound.loserOb, firstRound.winnerCol, firstRound.loserCol);
                    lastMsgInHand= secondRound.lastMsg;
                    if(!salir.val){
                        if(secondRound.draw){
                            game.winRound(null);
                            game.nextRound();
                        }else{
                            game.winRound(secondRound.winnerOb);
                            game.nextRound();
                        }
                        let track = game.getTrack;
                        if((track[0] == null && track[1] == null) || (track[0] != null && track[1]!= null) && !rechazoTruco.val){
                            thirdRound = await playRound(secondRound.lastMsg, game, secondRound.winner, secondRound.loser, secondRound.winnerOb, secondRound.loserOb, secondRound.winnerCol, secondRound.loserCol);
                            lastMsgInHand = thirdRound.lastMsg;
                            if(!salir.val){
                                if(thirdRound.draw){
                                    game.winRound(null);
                                    game.nextRound();
                                }else{
                                    game.winRound(thirdRound.winnerOb);
                                    game.nextRound();
                                }
            
                                track = game.getTrack;
            
                                if(track[0] == null && track[1] == null && track[2] == null){
                                    game.winHand(rivalOb);
                                    pointsInGame = game.getPointsRound;
                                    rivalOb.addPoints(pointsInGame);
                                }else{
                                    game.winHand(track[2]);
                                    pointsInGame = game.getPointsRound;
                                    track[2].addPoints(pointsInGame);
                                }
                            }
                        }
                        if(track[1] == null){
                            let winner = game.getFirstStageWon;
                            game.winHand(winner);
                            pointsInGame = game.getPointsRound;
                            winner.addPoints(pointsInGame);
                        }
        
                        if(track[0] == null){
                            let winner = secondRound.winnerOb;
                            game.winHand(winner);
                            pointsInGame = game.getPointsRound;
                            winner.addPoints(pointsInGame);
                        }
                        if(track[0] != null && (track[1] == track[0])){
                            game.winHand(track[0]);
                            pointsInGame = game.getPointsRound;
                            track[0].addPoints(pointsInGame);
                        }
                    }
                }
                if(!salir.val && !rechazoTruco.val){
                    let winnerHand = game.getHandWinTrack[iHand] == rivalOb ? rival:user;
                    lastMsgInHand= await lastMsgInHand.reply({
                        content:`La mano finalizó.\nGanó ${winnerHand}\n+${pointsInGame} puntos!!\nSIGUIENTE MANO!!`,
                        components:[],
                        embeds:[]
                    })
                }else if(rechazoTruco.val){
                    console.log(rechazoTruco);
                    let winnerHandOb = rechazoTruco.us == user?rivalOb:userOb;
                    let winnerHandUs = rechazoTruco.us == user?rival:user;
                    pointsInGame = game.getPointsRound;
                    winnerHandOb.addPoints(pointsInGame);
                    console.log(pointsInGame + " pnso");
                    game.winHand(winnerHandOb);
                    lastMsgInHand= await lastMsgInHand.reply({
                        content:`La mano finalizó.\nGanó ${winnerHandUs}\n+${pointsInGame} puntos!!\nSIGUIENTE MANO!!`,
                        components:[],
                        embeds:[]
                    })
                }else{
                    let winnerHandOb = salir.us == user?rivalOb:userOb;
                    let winnerHandUs = salir.us == user?rival:user;
                    pointsInGame = game.getPointsRound;
                    winnerHandOb.addPoints(pointsInGame);
                    console.log(pointsInGame + " pnso");
                    game.winHand(winnerHandOb);
                    lastMsgInHand= await lastMsgInHand.reply({
                        content:`La mano finalizó.\nGanó ${winnerHandUs}\n+${pointsInGame} puntos!!\nSIGUIENTE MANO!!`,
                        components:[],
                        embeds:[]
                    })
                }
                game.setWinTrack = [];
                game.setPointsEnvido = 0;
                game.setPointsRoundIG = 1;
                game.setFirstStageWon = null;
                game.setRound = 0;
                userOb.resetCoincidences();
                userOb.resetHand();
                rivalOb.resetCoincidences();
                rivalOb.resetHand();
                salir = {"ob":null,"us":null,"val":false};
                rechazoTruco = {"ob":null,"us":null,"val":false};
                jugarEnvido = true;
                truco = true;
                retruco = false;
                vale4 = false;
                iHand++;
                [userOb,rivalOb] = [rivalOb, userOb];
                [user,rival] = [rival,user];
            }catch(e){
                console.log(e);
                await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
            }
        }
    }
}
