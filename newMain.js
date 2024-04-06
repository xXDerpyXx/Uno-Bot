var TOKEN = require("./token.js");
var CLIENT_ID = "334106485535539212"
var fs = require("fs")

var decks = {}

fs.readdirSync("./decks/").forEach(file => {
  console.log("loading "+file);
  decks[file.split(".")[0]] = require("./decks/"+file)
});

function listdecks(){
  var s = ""
  for(var k in decks){
    s += k+"\n"
  }
  return s;
}

var colors = [
  "red",
  "green",
  "blue",
  "yellow"
]

var evilcolors = [
  "red",
  "green",
  "blue",
  "yellow",
  "pink",
  "lime",
  "cyan",
  "white",
  "black",
  "brown"
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
      if(i < this.hand.length-1){
          temp+=", "
      }
      else if(i <= this.hand.length){
        temp+=" "
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
      this.deckOptions = deckOptions
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
.addStringOption(option =>
  option.setName('input')
      .setDescription('deck to be used for this game')
      .setRequired(false));

commands.push(c)

c = new SlashCommandBuilder()
.setName('enduno')
.setDescription('closes the uno lobby instantly, killing all inhabitants')

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
.setName('listdecks')
.setDescription('shows all decks you can use for card games')

commands.push(c)

c = new SlashCommandBuilder()
.setName('draw')
.setDescription('draws a card from the deck in case you need one')

commands.push(c)

c = new SlashCommandBuilder()
.setName('showhand')
.setDescription('shows your hand (only you will be able to see the message)')

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

const { Client, GatewayIntentBits, Intents } = require('discord.js');
const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
]
 });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

function getUserFromMention(mention) {
	if (!mention) return false;

	if (mention.startsWith('<@') && mention.endsWith('>')) {
		mention = mention.slice(2, -1);

		if (mention.startsWith('!')) {
			mention = mention.slice(1);
		}

		return mention;
	}
}

client.on('messageCreate', (msg) => {

  var chid = msg.channelId;

  if(games[chid] != null){
    if(games[chid].running){
      var id = games[chid].players[games[chid].turn].id;
      var p = games[chid].turn;
      if(id == msg.member.id){
        if(games[chid].colorPicking == true){
          if(games[chid].deckOptions.variants.includes(msg.content)){
            games[chid].lastCard.color = msg.content
            games[chid].colorPicking = false
            
            if(!games[chid].targetPicking){
              games[chid].nextTurn();
              msg.reply("# the color is now "+msg.content+"\n"+("it's <@"+games[chid].players[games[chid].turn].id+">'s turn!"))
              
            }else{
              msg.reply("# the color is now "+msg.content+", also pick a target")
            }
          }else{
            if(!getUserFromMention(msg.content))
              msg.reply("pick a color")
          }
        }

        if(games[chid].targetPicking == true){
          var target = getUserFromMention(msg.content)
          var targetExists = false;
          
          if(target){
            for(var k = 0; k < games[chid].players.length; k++){
              if(games[chid].players[k].id == target){
                  targetExists = true
              }
            }
            if(!targetExists){
              msg.reply("they aren't playing the game, they can't draw cards")
              return;
            }else{
              var tempMessage = "# they now draw "+games[chid].draw+" cards"
              var p = 0;
              for(var k = 0; k < games[chid].players.length; k++){
                  if(games[chid].players[k].id == target){
                      p = k;
                  }
              }
              var temp = "";
              for(var i = 0; i < games[chid].draw; i++){
                  temp += games[chid].deck[0].color+" "+games[chid].deck[0].name+", "
                  games[chid].giveCard(p,0);
              }
              games[chid].targetPicking = false
              games[chid].notifyunocards(games[chid].players[p].id,"[forced to draw "+temp+" unocards]",msg)
              games[chid].draw = 0;
              if(!games[chid].colorPicking){
                games[chid].nextTurn();
                msg.reply(tempMessage + ("\nit's <@"+games[chid].players[games[chid].turn].id+">'s turn!"))
              }else{
                msg.reply(tempMessage+"\npick a color")
              }
            }
          }else{
            msg.reply("not a target")
          }
        }
      }
    }
  }
});

client.on('interactionCreate', async interaction => {

  var chid = interaction.channelId;

    
    if (!interaction.isChatInputCommand()) return;
    
    if(interaction.commandName === "listdecks"){
      interaction.reply("the decks avalible are:\n"+listdecks())
   }

    if(games[chid] != null){
      if(interaction.commandName === 'enduno'){
        interaction.reply("uno is over!")
        games[chid] = null;
        delete games[chid];
        return
      }

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

        if(interaction.commandName === "showhand"){
          var p = 0;
          for(var k = 0; k < games[chid].players.length; k++){
            if(games[chid].players[k].id == interaction.member.id){
                p = k
            }
          }
          await interaction.reply({
            content:games[chid].players[p].stringHand(""),
            ephemeral: true
          });
          
        }

        if(interaction.commandName === "deck"){
            if(!games[chid]){
                interaction.reply("there is no game in this channel")
                return;
            }
            interaction.reply("deck has "+games[chid].deck.length+" unocards left in it")
        }

        //If you want to draw a card
        if (interaction.commandName === "draw"){
          await interaction.reply("<@"+games[chid].players[games[chid].turn].id+"> drew a card!")
          var temp = games[chid].deck[0];
          games[chid].giveCard(games[chid].turn,0);
          games[chid].notifyunocards(interaction.user.id,"[decided to draw "+temp.color+" "+temp.name+"]",interaction);
          await interaction.followUp({
            content:"you drew a "+temp.color+" "+temp.name,
            ephemeral: true
          });
        }

        if (interaction.commandName === 'play') {
          var finalMessage = "" //goodbye

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

            finalMessage += ("you used the **"+content[0]+" "+content[1]+"** card")+"\n";
            
            

                  

            if(games[chid].lastCard == null || content[0] == "wild" || content[0] == games[chid].lastCard.color || content[1] == games[chid].lastCard.name){
              if(games[chid].players[p].hand[spot].type == "number" && games[chid].players[p].hand[spot].draw == 0){
                  if(games[chid].players[games[chid].turn].hand.length == 2){
                    finalMessage += ("Uno <@"+games[chid].players[games[chid].turn].id+">!")+"\n";
                  }
                  if(games[chid].players[games[chid].turn].hand.length == 1){
                    interaction.reply(finalMessage+"\n# <@"+games[chid].players[games[chid].turn].id+"> wins!");
                    games[chid] = null;
                    delete games[chid];
                    return;
                  }
                  games[chid].nextTurn();
                  finalMessage += (`it's <@${games[chid].players[games[chid].turn].id}> 's turn!`)+"\n";
              }
              else{
                  if(games[chid].players[p].hand[spot].type == "color"){
                      games[chid].colorPicking = true;
                  }

                  if(games[chid].players[p].hand[spot].type == "reverse"){
                      games[chid].turnCounter *= -1;
                      if(games[chid].players[games[chid].turn].hand.length == 2){
                        finalMessage += ("Uno <@"+games[chid].players[games[chid].turn].id+">!")+"\n";
                      }
                      if(games[chid].players[games[chid].turn].hand.length == 1){
                        interaction.reply(finalMessage+"\n# <@"+games[chid].players[games[chid].turn].id+"> wins!");
                        games[chid] = null;
                        delete games[chid];
                        return;
                      }
                      games[chid].nextTurn();
                      finalMessage +=("it's <@"+games[chid].players[games[chid].turn].id+">'s turn!")+"\n";
                  }
                  if(games[chid].players[p].hand[spot].type == "skip"){
                      if(games[chid].players[games[chid].turn].hand.length == 2){
                        finalMessage +=("Uno <@"+games[chid].players[games[chid].turn].id+">!")+"\n";
                      }
                      if(games[chid].players[games[chid].turn].hand.length == 1){
                        interaction.reply(finalMessage+"\n# <@"+games[chid].players[games[chid].turn].id+"> wins!");
                        games[chid] = null;
                        delete games[chid];
                        return;
                      }
                      games[chid].nextTurn();
                      games[chid].nextTurn();
                      finalMessage +=("it's <@"+games[chid].players[games[chid].turn].id+">'s turn!")+"\n";
                  }

              }
              
              console.log(games[chid].players[p].hand[spot]);
              games[chid].draw = games[chid].players[p].hand[spot].draw;
              if(games[chid].draw > 0){
                  games[chid].targetPicking = true;
                  finalMessage +=("ping a target")+"\n";
              }
              if(games[chid].colorPicking == true){
                finalMessage +=("choose a color")+"\n";
            }
              games[chid].lastCard = games[chid].players[p].hand[spot];
              games[chid].returnCard(p,spot);

              if(games[chid].players[games[chid].turn].hand.length == 1){
                finalMessage += ("Uno <@"+games[chid].players[games[chid].turn].id+">!");
              }
              games[chid].notifyunocards(id,"[used the "+content[0]+" "+content[1]+" card]",interaction);
              
              interaction.reply(finalMessage)
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
        var d = interaction.options.getString("input")
        if(d == null){
          d = "default"
        }
        if(decks[d] == null){
          interaction.reply("that deck does not exist, however you can use:\n"+listdecks())
          return;
        }

        interaction.reply("starting a game of uno, anyone can join by typing `/join` in this channel");
        games[chid] = new game("uno",{"types":decks[d].cards,"variant":"color","variants":decks[d].colors});
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