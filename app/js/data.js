// Loads the three local data files. Everything is static JSON inside app/ —
// this app never fetches anything from the network.
export async function loadAll() {
  const [trophies, panels, eggs] = await Promise.all([
    fetch('data/trophies.json').then((r) => r.json()),
    fetch('data/panels.json').then((r) => r.json()),
    fetch('data/easter-eggs.json').then((r) => r.json()),
  ]);
  return { trophies: trophies.trophies, trophyMeta: trophies, panels, eggs: eggs.items, eggMeta: eggs };
}

export const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
export const KIND_LABEL = {
  story: 'Story', stranger: 'Strangers', crime: 'Crime', activities: 'Activities',
  collectibles: 'Collectibles', misc: 'Misc',
};
export const VERIFIED_LABEL = { confirmed: 'Confirmed', reported: 'Reported', unknown: 'Unknown' };
export const OVERLAP_LABEL = {
  auto: 'Auto with 100%', partial: 'Partly with 100%', separate: 'Separate from 100%',
};
