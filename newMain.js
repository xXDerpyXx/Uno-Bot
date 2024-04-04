var TOKEN = require("./token.js");
var CLIENT_ID = "334106485535539212"
var fs = require("fs")


const { REST, Routes,SlashCommandBuilder } = require('discord.js');

var commands = [
    
];

// Shuffle your cards
function shuffle (array){
  const arrayLength = array.length;

  for (let i = array.length; i > 0; ){
    // We pick a remaining element
    randI = Math.floor(Math.random() * i);
    i--;

    //Swap it with the current element
    let temp = array[i]
    array[i] = array[randI]
    array[randI] = temp
  }

  return array
}

class player{
  constructor(id){
      this.id = id;
      this.hand = [];
  }

  stringHand(m){
      var temp = "";
      for(var i = 0; i < this.hand.length; i++){
          temp += this.hand[i].color+" "+this.hand[i].name
          if(i <= this.hand.length){
              temp+=", "
          }
      }
      return temp+" "+m;
  }
}

class game{
  constructor(type,deckOptions){
      this.players = [];
      this.type = type;
      this.deck = makeDeck(deckOptions.types,deckOptions.variant,deckOptions.variants);
      this.deck = shuffle(this.deck);
      this.running = false;
      this.turn = 0;
      this.turnCounter = 1;
      this.colorPicking = false;
      this.targetPicking = false;
      this.draw = 0;
      this.lastCard = null;

  }

  addPlayer(id){
      this.players.push(new player(id))
  }

  notifyunocards(id,m){
      duckling.fetchUser(id).then((user) => {
          var i = 0;
          for(var k = 0; k < this.players.length;k++){
              if(this.players[k].id == id){
                  i = k;
                  break;
              }
          }
          user.send(this.players[i].stringHand(m));
      });
  }

  giveCard(p,i){ //i == card index
      var c = this.deck.splice(i,1)[0]
      if(c.type == "color"){
          c.color = "wild";
      }
      this.players[p].hand.push(c);
  }

  returnCard(p,i){ //i == card index
      var c = this.players[p].hand.splice(i,1)[0]
      if(c.type == "color"){
          c.color = "wild";
      }
      this.deck.push(c);
  }

  nextTurn(){
      this.turn += this.turnCounter;
      if(this.turn < 0){
          this.turn = this.players.length-1;
      }else if(this.turn >= this.players.length){
          this.turn = 0;
      }
  }
}

var games = {};

var c = new SlashCommandBuilder()
.setName('define')
.setDescription('defines a word (word:definition)')
.addStringOption(option =>
    option.setName('input')
        .setDescription('word:definition')
        .setRequired(true));

commands.push(c)

const rest = new REST({ version: '10' }).setToken(TOKEN);
  
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
  
    if (interaction.commandName === 'define') {
      raw = interaction.options.getString("input")
      if(raw.includes(":")){
        parts = raw.split(":");
        interaction.reply(parts[0]+"\n"+parts[1]);
        dict[parts[0]] = parts[1];
        save()
      }else{
        interaction.reply("you need a : between the word and its definition");
      }
    }
  
    if (interaction.commandName === 'atomize') {
      raw = interaction.options.getString("input");
      interaction.reply(atomize(raw));
      
    }
  });
  
  client.login(TOKEN);