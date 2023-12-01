const {SlashCommandBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder, UserFlags, time } = require("discord.js");

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
        const eliminated = this.hand.unused.splice(card,1);
        this.hand.used.concat(eliminated);
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
        this.image = `./images/cards/${palo}/${value}`;
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

        for (const palo in palos){
            for(const valor in valores){
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

        const cortarInteraction = await rivalresponse.awaitMessageComponent({ collectorRivalFilter, time: 60000 });

        const respCortar = cortarInteraction.customId;

        if(respCortar == "cortar"){
            game.startGame(true);
        }else{
            game.startGame(false);
        }
    }
}