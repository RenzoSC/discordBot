const {SlashCommandBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder } = require("discord.js");

class Table{
    constructor(user, rival){
        this.user = user;
        this.rival = rival;
        this.round = 0;
        this.firstStageWon = user;
    }
}

class Player{
    constructor(player, iconImg){
        this.player = player;
        this.icon = iconImg;
        this.hand = [];
        this.points = 0;
    }

    addCard(card){
        this.hand.push(card);
    }
}

class Card{
    constructor(palo,value){
        this.type = palo;
        this.value = value;
        this.image = `./images/cards/${palo}/${value}`;
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

module.exports = {
    data: new SlashCommandBuilder()
    .setName('truco')
    .setDescription('Arrobá a algun wachin para jugar al truco pa')
    .addUserOption((option)=>option.setName("friend").setDescription("Pana para jugar al truco").setRequired(true)),

    async execute(interaction){
        
    }
}