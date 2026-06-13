// Computes group-stage standings from finished matches in matches.json,
// using groups.json only for the team list (code/name/flag/group assignment).

export function computeGroupStandings(groupsData, matches) {
  return groupsData.groups.map(group => {
    const teams = group.teams.map(t => ({
      ...t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0,
    }));
    const byCode = Object.fromEntries(teams.map(t => [t.code, t]));

    matches
      .filter(m => m.group === group.id && m.stage === 'Group Stage' && m.status === 'finished')
      .forEach(m => {
        const home = byCode[m.homeCode];
        const away = byCode[m.awayCode];
        if (!home || !away) return;

        const hs = m.homeScore ?? 0;
        const as = m.awayScore ?? 0;

        home.played++; away.played++;
        home.gf += hs; home.ga += as;
        away.gf += as; away.ga += hs;

        if (hs > as)      { home.won++;  away.lost++; home.points += 3; }
        else if (hs < as) { away.won++;  home.lost++; away.points += 3; }
        else              { home.drawn++; away.drawn++; home.points++; away.points++; }
      });

    teams.forEach(t => { t.gd = t.gf - t.ga; });

    return { ...group, teams };
  });
}
