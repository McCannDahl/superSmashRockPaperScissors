import { ArenaConfig } from '../types.js';

export const DEFAULT_ARENA: ArenaConfig = {
  id: 'standard_arena',
  name: 'The Core Stage',
  width: 1200,
  height: 800,
  platforms: [
    // Main ground platform
    {
      id: 'main_ground',
      x: 300,
      y: 520,
      width: 600,
      height: 35,
      isOneWay: false,
    },
    // Left floating platform
    {
      id: 'float_left',
      x: 240,
      y: 390,
      width: 190,
      height: 14,
      isOneWay: true,
    },
    // Right floating platform
    {
      id: 'float_right',
      x: 770,
      y: 390,
      width: 190,
      height: 14,
      isOneWay: true,
    },
    // Top floating platform
    {
      id: 'float_top',
      x: 480,
      y: 280,
      width: 240,
      height: 14,
      isOneWay: true,
    },
  ],
  blastZones: {
    minX: -200,
    maxX: 1400,
    minY: -250,
    maxY: 900,
  },
  spawnPoints: [
    { x: 420, y: 440 },
    { x: 780, y: 440 },
    { x: 300, y: 320 },
    { x: 860, y: 320 },
  ],
};
