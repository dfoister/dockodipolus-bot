import 'dotenv/config';

import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const commands = [
  new SlashCommandBuilder()
    .setName('get-matches')
    .setDescription('Get matches'),
  new SlashCommandBuilder()
    .setName('standings')
    .setDescription('See current standings'),
].map(command => command.toJSON());


const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

await rest.put(
  Routes.applicationCommands(process.env.APP_ID),
  { body: commands }
);

console.log('Commands registered');


client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});


client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'get-matches') {

    const response = await fetch('https://api.ukicircuit.com/leagues/2c55c3f9-c491-44d6-94e3-1b87d0be8650/fixtures');
    const TEAM_ID = 'e89507b8-6c46-4e1a-8d6a-393f1a865526';
    const matches = await response.json();

    const filteredMatches = matches.filter(match =>
        match.team_a_id === TEAM_ID ||
        match.team_b_id === TEAM_ID
    );

    const embeds = filteredMatches.map(match => {
        const isTeamA = match.team_a_id === TEAM_ID;
        const opponent = isTeamA ? match.team_b : match.team_a;

      const formattedTime = new Date(match.match_time)
        .toLocaleString('en-GB', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/London',
        });

      return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(
          `${match.team_a.name} vs ${match.team_b.name}`)
        .setURL(`https://www.faceit.com/en/cs2/room/${match.match_id}`)
        .setDescription(`🕒 ${formattedTime}`)
        .setThumbnail(opponent.avatar);
    });

    await interaction.reply({
      embeds,
    });
  }

  if (interaction.commandName === 'standings') {

    const response = await fetch('https://api.ukicircuit.com/leagues/2c55c3f9-c491-44d6-94e3-1b87d0be8650');
    const standingsJson = await response.json();
    const standings = standingsJson[0];

    const standingsText = standings.map(team => {
      const rank = String(team.rank).padStart(2);
      const name = team.name.padEnd(20);
      const record = `${team.wins}-${team.losses}`.padEnd(5);

      const rd = (
        Number(team.round_difference) > 0
          ? `+${team.round_difference}`
          : team.round_difference
      ).padStart(4);

      return `${rank}  ${name}  ${record}  ${rd}`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('UKIC Rising Standings')
      .setURL('https://ukicircuit.com/leagues/2c55c3f9-c491-44d6-94e3-1b87d0be8650')
      .setDescription(
        '```' +
        '\n    TEAM                  W-L      RD\n' +
        standingsText +
        '\n```'
    );

  await interaction.reply({
    embeds: [embed],
  });
  }
});

client.login(process.env.DISCORD_TOKEN);