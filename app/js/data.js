// Data loading for Leonida Platinum Atlas. Everything is a local file under
// app/; the app makes no network request, ever. The three JSON files are the
// whole dataset: 55 trophies, the roadmap/panels, and the 86 easter-egg,
// bug and oddity items.
export async function loadAll() {
  const [trophiesRes, panelsRes, eggsRes] = await Promise.all([
    fetch('data/trophies.json'),
    fetch('data/panels.json'),
    fetch('data/easter-eggs.json'),
  ]);
  const trophies = await trophiesRes.json();
  const panels = await panelsRes.json();
  const eggs = await eggsRes.json();
  return {
    trophies: trophies.trophies,
    panels,
    eggs: eggs.items,
    eggMeta: { total: eggs.items.length, researched: eggs.researched },
  };
}

// A trophy's display name under the spoiler setting: story trophies the
// player has not earned yet stay hidden while spoilers are on.
export function displayName(trophy, spoilerOn, earned) {
  if (spoilerOn && trophy.kind === 'story' && !earned.has(trophy.name)) {
    return 'Hidden story trophy';
  }
  return trophy.name;
}

export function displayDescription(trophy, spoilerOn, earned) {
  if (spoilerOn && trophy.kind === 'story' && !earned.has(trophy.name)) {
    return 'Hidden — earn this trophy to reveal its description.';
  }
  return trophy.description;
}

// Steps and sources are hidden together with the name while masked: showing
// the steps would spoil the mission the trophy belongs to.
export function spoilerMasked(trophy, spoilerOn, earned) {
  return spoilerOn && trophy.kind === 'story' && !earned.has(trophy.name);
}
