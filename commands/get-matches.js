import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('get-matches')
  .setDescription('Get matches');

export async function execute(interaction) {
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
      .setTitle(`${match.team_a.name} vs ${match.team_b.name}`)
      .setURL(`https://www.faceit.com/en/cs2/room/${match.match_id}`)
      .setDescription(`🕒 ${formattedTime}`)
      .setThumbnail(opponent.avatar);
  });

  console.log(`${filteredMatches.length} matches retrieved`);
  await interaction.reply({
    embeds,
  });
}