import React from 'react';
import { GameResult } from '../../../types/CoveyTownSocket';

type PlayerStats = {
  name: string;
  wins: number;
  losses: number;
  ties: number;
};
/**
 * A component that renders a list of GameResult's as a leaderboard, formatted as a table with the following columns:
 * - Player: the name of the player
 * - Wins: the number of games the player has won
 * - Losses: the number of games the player has lost
 * - Ties: the number of games the player has tied
 * Each column has a header (a table header `th` element) with the name of the column.
 *
 *
 * The table is sorted by the number of wins, with the player with the most wins at the top.
 *
 * @returns
 */
export default function Leaderboard({ results }: { results: GameResult[] }): JSX.Element {
  const statsMap: Map<string, PlayerStats> = new Map();

  results.forEach(result => {
    const scores = result.scores;
    const players = Object.keys(scores);

    players.forEach(player => {
      const currentStats = statsMap.get(player) || { name: player, wins: 0, losses: 0, ties: 0 };
      const playerScore = scores[player];

      // Compare player's score with other players
      players.forEach(opponent => {
        if (player !== opponent) {
          if (playerScore > scores[opponent]) {
            currentStats.wins += 1;
          } else if (playerScore < scores[opponent]) {
            currentStats.losses += 1;
          } else {
            currentStats.ties += 1;
          }
        }
      });

      statsMap.set(player, currentStats);
    });
  });

  const sortedStats = Array.from(statsMap.values()).sort((a, b) => b.wins - a.wins);

  return (
    <table role='grid'>
      <thead>
        <tr>
          <th role='columnheader'>Player</th>
          <th role='columnheader'>Wins</th>
          <th role='columnheader'>Losses</th>
          <th role='columnheader'>Ties</th>
        </tr>
      </thead>
      <tbody>
        {sortedStats.map(player => (
          <tr key={player.name}>
            <td role='gridcell'>{player.name}</td>
            <td role='gridcell'>{player.wins}</td>
            <td role='gridcell'>{player.losses}</td>
            <td role='gridcell'>{player.ties}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
