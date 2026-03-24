// SVG icon paths for each disaster type
const ICON_SVGS = {
  flood: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`,

  landslide: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20L12 4l10 16H2z"/><path d="M8 20l4-8 4 8"/></svg>`,

  fire: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>`,

  earthquake: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l3-9 4 18 3-9h6"/></svg>`,

  typhoon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 017 7"/><path d="M12 22a7 7 0 01-7-7"/><path d="M12 2c-2.5 2.5-4 5.5-4 8a7 7 0 1014 0c0-2.5-1.5-5.5-4-8"/><path d="M12 22v-4"/><path d="M9 20l3-2"/><path d="M15 20l-3-2"/></svg>`,

  health: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6v0a6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3"/><path d="M8 15v1a6 6 0 006 6v0a6 6 0 006-6v-4"/><circle cx="20" cy="10" r="2"/></svg>`,

  road_incident: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14v-5l-2-4H7l-2 4v5z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/><path d="M5 12h14"/></svg>`,

  infrastructure: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,

  environmental: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,

  security: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,

  other: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,

  pending: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
};

export const DISASTER_TYPES = [
  {
    id: 'flood',
    label: 'Flooding',
    icon: ICON_SVGS.flood,
    color: '#3b82f6',
    description: 'Flash floods, river overflow, urban flooding',
    tags: ['impassable', 'rescue-needed', 'evacuation', 'power-outage', 'stranded-vehicles'],
  },
  {
    id: 'landslide',
    label: 'Landslide',
    icon: ICON_SVGS.landslide,
    color: '#a16207',
    description: 'Mudslides, rockfalls, road blockages',
    tags: ['road-blocked', 'houses-buried', 'rescue-needed', 'evacuation'],
  },
  {
    id: 'fire',
    label: 'Fire',
    icon: ICON_SVGS.fire,
    color: '#ef4444',
    description: 'House fires, forest fires, building fires',
    tags: ['spreading', 'trapped-people', 'bfp-responding', 'evacuation'],
  },
  {
    id: 'earthquake',
    label: 'Earthquake',
    icon: ICON_SVGS.earthquake,
    color: '#7c3aed',
    description: 'Structural damage, ground shaking',
    tags: ['collapsed-structure', 'trapped-people', 'aftershock', 'cracked-roads'],
  },
  {
    id: 'typhoon',
    label: 'Typhoon',
    icon: ICON_SVGS.typhoon,
    color: '#06b6d4',
    description: 'Strong winds, storm damage, roof damage',
    tags: ['roof-damage', 'trees-down', 'power-outage', 'flooding', 'storm-surge'],
  },
  {
    id: 'health',
    label: 'Health',
    icon: ICON_SVGS.health,
    color: '#ec4899',
    description: 'Disease outbreak, medical emergency',
    tags: ['outbreak', 'medical-emergency', 'hospital-needed', 'quarantine'],
  },
  {
    id: 'road_incident',
    label: 'Road Incident',
    icon: ICON_SVGS.road_incident,
    color: '#f97316',
    description: 'Collisions, accidents, vehicle malfunctions',
    tags: ['collision', 'road-blocked', 'injuries', 'pnp-responding'],
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    icon: ICON_SVGS.infrastructure,
    color: '#64748b',
    description: 'Road damage, bridge collapse, power outage',
    tags: ['road-damage', 'bridge-collapse', 'power-outage', 'water-supply'],
  },
  {
    id: 'environmental',
    label: 'Environmental',
    icon: ICON_SVGS.environmental,
    color: '#10b981',
    description: 'Pollution, chemical spill, hazardous waste',
    tags: ['pollution', 'chemical-spill', 'hazardous-waste', 'water-contamination'],
  },
  {
    id: 'security',
    label: 'Security',
    icon: ICON_SVGS.security,
    color: '#f59e0b',
    description: 'Crime, violence, safety threats',
    tags: ['crime', 'violence', 'theft', 'pnp-responding'],
  },
  {
    id: 'other',
    label: 'Other',
    icon: ICON_SVGS.other,
    color: '#6b7280',
    description: 'Uncategorized emergencies',
    tags: ['urgent', 'needs-attention'],
  },
  {
    id: 'pending',
    label: 'Unclassified',
    icon: ICON_SVGS.pending,
    color: '#9ca3af',
    description: 'Awaiting classification by admin',
    tags: [],
  },
];

export function getDisasterType(id) {
  return DISASTER_TYPES.find((type) => type.id === id) || DISASTER_TYPES[DISASTER_TYPES.length - 1];
}

export function getDisasterIcon(id) {
  const type = getDisasterType(id);
  return type.icon;
}

export function getDisasterColor(id) {
  const type = getDisasterType(id);
  return type.color;
}
