import { UnitStats } from './types';

export const COMMONER: UnitStats = {
  name: "Commoner",
  count: 20,
  hp: 4,
  ac: 10,
  attackBonus: 2,
  damageDiceAvg: 2.5, // 1d4
  damageMod: 0
};

export const GUARD: UnitStats = {
  name: "Guard",
  count: 5,
  hp: 11,
  ac: 16,
  attackBonus: 3,
  damageDiceAvg: 4.5, // 1d8
  damageMod: 1
};

export const VETERAN: UnitStats = {
  name: "Veteran",
  count: 3,
  hp: 58,
  ac: 17,
  attackBonus: 5,
  damageDiceAvg: 7, // avg of (1d8+3)x2 + (1d6+3) simplified for sim
  damageMod: 3
};

export const GOBLIN: UnitStats = {
  name: "Goblin",
  count: 15,
  hp: 7,
  ac: 15,
  attackBonus: 4,
  damageDiceAvg: 3.5, // 1d6
  damageMod: 2
};