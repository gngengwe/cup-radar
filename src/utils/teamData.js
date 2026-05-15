// Central team lookup — maps TLA codes to team-iq.json profiles.
// Only covers the 14 city teams (7 Seattle · 7 KC). Returns null for others.
import teamIQData from '../data/team-iq.json';

const allTeams = [...teamIQData.seattle, ...teamIQData.kansascity];
const TEAM_MAP  = Object.fromEntries(allTeams.map(t => [t.code, t]));

export const getTeam     = (code) => TEAM_MAP[code]  || null;
export const getJersey   = (code) => TEAM_MAP[code]?.jersey || null;
export const getNickname = (code) => TEAM_MAP[code]?.team?.nickname || null;
