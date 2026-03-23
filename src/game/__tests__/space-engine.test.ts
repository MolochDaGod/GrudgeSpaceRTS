import { describe, it, expect, beforeEach } from 'vitest';
import { SpaceEngine } from '../space-engine';
import { SHIP_DEFINITIONS } from '../space-config';

describe('SpaceEngine', () => {
  let engine: SpaceEngine;

  beforeEach(() => {
    engine = new SpaceEngine();
    engine.initGame('1v1');
  });

  it('initializes without error and creates game state', () => {
    expect(engine.state).toBeDefined();
    expect(engine.state.gameMode).toBe('1v1');
    expect(engine.state.planets.length).toBeGreaterThan(0);
    expect(engine.state.ships.size).toBeGreaterThan(0);
    expect(engine.state.stations.size).toBeGreaterThan(0);
  });

  it('spawns a ship with correct stats from SHIP_DEFINITIONS', () => {
    const ship = engine.spawnShip('red_fighter', 1, 100, 200);
    const def = SHIP_DEFINITIONS['red_fighter'];
    expect(ship).toBeDefined();
    expect(ship.shipType).toBe('red_fighter');
    expect(ship.shipClass).toBe(def.class);
    // At upgrade level 0, stats should equal base stats
    expect(ship.maxHp).toBe(def.stats.maxHp);
    expect(ship.attackDamage).toBe(def.stats.attackDamage);
    expect(ship.speed).toBe(def.stats.speed);
    expect(ship.team).toBe(1);
    expect(ship.x).toBe(100);
    expect(ship.y).toBe(200);
  });

  it('resource tick increments credits/energy/minerals for owned planets', () => {
    const res = engine.state.resources[1];
    const before = { credits: res.credits, energy: res.energy, minerals: res.minerals };

    // Simulate 1.1 seconds (resource tick fires at 1s intervals)
    engine.update(1.1);

    expect(res.credits).toBeGreaterThan(before.credits);
    expect(res.energy).toBeGreaterThan(before.energy);
    expect(res.minerals).toBeGreaterThan(before.minerals);
  });

  it('purchaseUpgrade deducts resources and increments level', () => {
    // Give team 1 plenty of resources
    const res = engine.state.resources[1];
    res.credits = 10000;
    res.energy = 10000;
    res.minerals = 10000;

    const upgBefore = engine.state.upgrades[1].attack;
    const creditsBefore = res.credits;

    const ok = engine.purchaseUpgrade(1, 'attack');
    expect(ok).toBe(true);
    expect(engine.state.upgrades[1].attack).toBe(upgBefore + 1);
    expect(res.credits).toBeLessThan(creditsBefore);
  });

  it('purchaseUpgrade fails when resources are insufficient', () => {
    const res = engine.state.resources[1];
    res.credits = 0;
    res.energy = 0;
    res.minerals = 0;

    const ok = engine.purchaseUpgrade(1, 'attack');
    expect(ok).toBe(false);
    expect(engine.state.upgrades[1].attack).toBe(0);
  });

  it('captures a neutral planet when friendly ships are nearby', () => {
    // Find a neutral planet
    const neutral = engine.state.planets.find((p) => p.owner === 0);
    if (!neutral) return; // skip if no neutrals

    // Kill all neutral defenders so capture can proceed
    for (const [, s] of engine.state.ships) {
      if (s.team === 0 && s.orbitTarget === neutral.id) s.dead = true;
    }

    // Place a friendly ship within capture radius
    const ship = engine.spawnShip('red_fighter', 1, neutral.x, neutral.y);
    ship.holdPosition = true;

    // Tick enough for some capture progress
    for (let i = 0; i < 10; i++) engine.update(0.5);

    expect(neutral.captureProgress).toBeGreaterThan(0);
    expect(neutral.captureTeam).toBe(1);
  });
});
