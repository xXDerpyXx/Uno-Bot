var TOKEN = require("./token.js");
var CLIENT_ID = "334106485535539212"
var fs = require("fs")

unocards = require("./unoCards.js")
unocardtypes = require("./unoCardTypes.js")

var colors = [
  "red",
  "green",
  "blue",
  "yellow"
]

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

function makeDeck(types,variant,variants){
  var d = [];
  for(var i = 0; i < variants.length; i++){
      for(var k in types){
          var c = {};
          Object.assign(c,types[k]);
          if(types[k][variant] == "random"){
              c[variant] = variants[i];
          }
          c.name = k;
          d.push(c);
      }
  }
  return d;
}

class player{
  constructor(id){
      this.id = id;
      this.hand = [];
  }

  /**
   * Take a player's entire hand and then convert it into string form
   * (To be legible)
   * **/
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

// Main game state
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

  // Add player to the game
  addPlayer(playerId){
      this.players.push(new player(playerId))
  }

  /**
   * Notify a user of their uno cards
   * @param playerId : int : a player's user id
   * @param message : string : message to be sent
   * */
  async notifyunocards(playerId, message,tempinteraction){
    var guild = tempinteraction.guild;
    var user = await guild.members.fetch(playerId)
    
    if (user!==undefined) {
      for(let k = 0; k < this.players.length; k++){
          if(this.players[k].id === playerId){
              user.send(this.players[k].stringHand(message));
              break;
          }
      }
        
    }

      /*duckling.fetchUser(playerId).then(
          (user) => {
          //Iterate through all the players
          for(let k = 0; k < this.players.length; k++){
              if(this.players[k].id === playerId){
                  user.send()
                  break;
              }
          }
      });*/
  }

  giveCard(player,i){ //i == card index
      let card = this.deck.splice(i,1)[0]
      if(card.type === "color"){
          card.color = "wild";
      }
      this.players[player].hand.push(card);
  }

  returnCard(player,i){ //i == card index
      let card = this.players[player].hand.splice(i,1)[0]
      if(card.type === "color"){
          card.color = "wild";
      }
      this.deck.push(card);
  }

  // Increment the turns by the turn counter
  nextTurn(){
      this.turn += this.turnCounter;
      if (this.turn < 0){
          this.turn = this.players.length - 1;
      } else if (this.turn >= this.players.length){
          this.turn = 0;
      }
  }
}

var games = {};

var c = new SlashCommandBuilder()
.setName('startuno')
.setDescription('opens a lobby for uno that anyone else can `/join`')

commands.push(c)

c = new SlashCommandBuilder()
.setName('join')
.setDescription('join a game of uno')

commands.push(c)

c = new SlashCommandBuilder()
.setName('begin')
.setDescription('actually starts the game')

commands.push(c)

c = new SlashCommandBuilder()
.setName('deck')
.setDescription('shows how many cards are left (it is possible to run out)')

commands.push(c)

c = new SlashCommandBuilder()
.setName('draw')
.setDescription('draws a card from the deck in case you need one')

commands.push(c)

c = new SlashCommandBuilder()
.setName('play')
.setDescription('plays a card')
.addStringOption(option =>
    option.setName('input')
        .setDescription('your card')
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
    chid = interaction.channelId;

    if(games[chid] != null){
      if(interaction.commandName === 'join'){
        if(games[chid].running == false){
          games[chid].addPlayer(interaction.member.id);
          if(interaction.member.nickname != null){
            interaction.reply(interaction.member.nickname+" joined the game!")
          }else{
            interaction.reply(interaction.member.user.username+" joined the game!")
          }
        }else{
          interaction.reply("the game is already running, can't join until this game ends and a new one starts")
        }
      }
      if(games[chid].running == false){
        if(interaction.commandName === 'begin'){
          games[chid].running = true;
          interaction.reply("game started! it's <@"+games[chid].players[games[chid].turn].id+">'s turn!");
          var cardCount = 5;
          //if(content[0] != null){
              //cardCount = parseInt(content[0])
          //}
          for(var j = 0; j < cardCount;j++){
              for(var i = 0; i < games[chid].players.length; i++){
                  games[chid].giveCard(i,0);
              }
          }

          for(var i = 0; i < games[chid].players.length; i++){
              games[chid].notifyunocards(games[chid].players[i].id,"[game begun]",interaction);
          }
        }
      }else{
        if (interaction.commandName === 'play') {
          var id = games[chid].players[games[chid].turn].id;
          var p = games[chid].turn;
          if(id == interaction.user.id){
            pickedCard = interaction.options.getString("input")
            content = pickedCard.split(" ")
            var exists = false;
            var spot = 0;
            for(var i = 0; i < games[chid].players[p].hand.length;i++){
              if(games[chid].players[p].hand[i].color == content[0] && games[chid].players[p].hand[i].name == content[1]){
                exists = true;
                spot = i;
                break;
              }
            }
            if(!exists){
              interaction.reply("you dont have that card");
              return;
            }

            if(games[chid].lastCard == null || content[0] == "wild" || content[0] == games[chid].lastCard.color || content[1] == games[chid].lastCard.name){
              if(games[chid].players[p].hand[spot].type == "number" && games[chid].players[p].hand[spot].draw == 0){
                  if(games[chid].players[games[chid].turn].hand.length == 2){
                      interaction.reply("Uno <@"+games[chid].players[games[chid].turn].id+">!");
                  }
                  games[chid].nextTurn();
                  // interaction.reply("Bruh!")
                  console.log("game child")
                  console.log(games[chid])
                  console.log("game child turn")
                  console.log(games[chid].turn)
                  console.log("game child players(game child turn)")
                  console.log(games[chid].players[games[chid].turn])
                  console.log("the id")
                  console.log(games[chid].players[games[chid].turn].id)

                  console.log(games[chid].players[games[chid].turn].id)
                  // The code is fine up to this point!
                  interaction.reply(`it's <@${games[chid].players[games[chid].turn].id}> 's turn!`);
              }
              else{
                  if(games[chid].players[p].hand[spot].type == "color"){
                      games[chid].colorPicking = true;
                  }

                  if(games[chid].players[p].hand[spot].type == "reverse"){
                      games[chid].turnCounter *= -1;
                      if(games[chid].players[games[chid].turn].hand.length == 2){
                          interaction.reply("Uno <@"+games[chid].players[games[chid].turn].id+">!");
                      }
                      games[chid].nextTurn();
                      interaction.reply("it's <@"+games[chid].players[games[chid].turn].id+">'s turn!");
                  }
                  if(games[chid].players[p].hand[spot].type == "skip"){
                      if(games[chid].players[games[chid].turn].hand.length == 2){
                          interaction.reply("Uno <@"+games[chid].players[games[chid].turn].id+">!");
                      }
                      games[chid].nextTurn();
                      games[chid].nextTurn();
                      interaction.reply("it's <@"+games[chid].players[games[chid].turn].id+">'s turn!");
                  }

              }
              console.log(games[chid].players[p].hand[spot]);
              console.log("bruh")
              games[chid].draw = games[chid].players[p].hand[spot].draw;
              console.log("bruh 2")
              if(games[chid].draw > 0){
                  games[chid].targetPicking = true;
                  interaction.reply("ping a target");
              }
              console.log("bruh 3")
              games[chid].lastCard = games[chid].players[p].hand[spot];
              console.log("bruh 4")
              games[chid].returnCard(p,spot);
              console.log("bruh 5");

              // so apparently if you want to print this it crashes??????
              //interaction.reply("you used the "+content[0]+" "+content[1]+" card");
              if(games[chid].players[games[chid].turn].hand.length == 1){
                  interaction.reply("Uno <@"+games[chid].players[games[chid].turn].id+">!");
              }
              games[chid].notifyunocards(id,"[used the "+content[0]+" "+content[1]+" card]",interaction);

          }else{
              interaction.reply("you cant use that card")
          }
          }else{
            interaction.reply("not your turn!")
          }
        }
      }

    }else{
      if(interaction.commandName === 'startuno'){
        interaction.reply("starting a game of uno, anyone can join by typing `/join` in this channel");
        games[chid] = new game("uno",{"types":unocardtypes,"variant":"color","variants":colors});
        games[chid].addPlayer(interaction.member.id);
      }else{
        interaction.reply("there is no game of uno currently running in this channel, `/startuno` to change that");
      }
    }
  /*
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
      
    }*/
  });
  
  client.login(TOKEN);