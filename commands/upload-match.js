import { SlashCommandBuilder } from 'discord.js';
import { pool } from '../db.js';

const ADMIN_USERS = [
  '897193606866169927'
];

export const data = new SlashCommandBuilder()
  .setName('upload-match')
  .setDescription('Upload FACEIT match')
  .addStringOption(option =>
    option
      .setName('match_id')
      .setDescription('FACEIT match ID')
      .setRequired(true)
  );

export async function execute(interaction) {
  if (!ADMIN_USERS.includes(interaction.user.id)) {
    console.warn(`Unauthorized user ${interaction.user.tag} tried to upload a match`);
    return interaction.reply({
      content: 'If you try to use this command again, I will do horrible things to you',
      ephemeral: true,
    });
  }

  const matchId = interaction.options.getString('match_id');

  var response = await fetch(`https://open.faceit.com/data/v4/matches/${matchId}`, { headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` } });
  const matchData = await response.json();

  response = await fetch(`https://open.faceit.com/data/v4/matches/${matchId}/stats`, { headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` } });
  const data = await response.json();
  const match = data.rounds[0];

  const rounds = match.round_stats["Rounds"];
  const teamA = match.teams[0].team_stats["Team"];

  await pool.query(`
    INSERT INTO matches (
      match_id,
      match_data,
      uploaded_at,
      team_a,
      team_a_score,
      team_b,
      team_b_score,
      map,
      demo_link,
      match_date
    )
    VALUES ($1,$2,NOW(),$3,$4,$5,$6,$7,$8,$9)`, [
    matchId,
    match,
    teamA,
    match.teams[0].team_stats["Final Score"],
    match.teams[1].team_stats["Team"],
    match.teams[1].team_stats["Final Score"],
    match.round_stats["Map"],
    matchData.demo_url[0],
    new Date(matchData.started_at * 1000)
  ]);

  const teamIndex = teamA == "Dockodipolus" ? 0 : 1;
  const playerData = match.teams[teamIndex].players;

  for (const player of playerData) {
    await pool.query(`
      UPDATE player_stats
      SET
        kills = kills + $1,
        deaths = deaths + $2,
        assists = assists + $3,
        damage = damage + $4,
        total_rounds = total_rounds + $5
      WHERE player_id = $6`,
      [
        player.player_stats["Kills"],
        player.player_stats["Deaths"],
        player.player_stats["Assists"],
        player.player_stats["Damage"],
        rounds,
        player.player_id,
      ]
    );
  }

  console.log(`Match ${matchId} uploaded`);
  await interaction.reply({
    content: 'Match uploaded',
    ephemeral: true,
  });
}