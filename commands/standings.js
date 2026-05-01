import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('standings')
  .setDescription('See current standings');

export async function execute(interaction) {
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

  console.log('Standings retrieved');
  await interaction.reply({
    embeds: [embed],
  });
}