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