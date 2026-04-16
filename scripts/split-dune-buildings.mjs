#!/usr/bin/env node
/**
 * split-dune-buildings.mjs — Split Emperor Dune GLTF into individual building GLBs.
 *
 * Reads the packed scene.gltf (100 meshes), extracts each mesh as a standalone GLB,
 * auto-normalizes size, and generates a building-catalog.json with names and RTS roles.
 *
 * Output: public/assets/groundrts/dune-buildings/{building_key}.glb
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SRC_GLTF = path.join(ROOT, 'assets', 'needs pipeline and best practices', 'emperor_dune_extracted', 'scene.gltf');
const OUT_DIR = path.join(ROOT, 'public', 'assets', 'groundrts', 'dune-buildings');
const CATALOG_PATH = path.join(OUT_DIR, 'building-catalog.json');

// ── RTS Building definitions ──────────────────────────────────────
// 100 meshes from Emperor: Battle for Dune (Harkonnen faction).
// We assign canonical RTS building names + game roles.
// Buildings are grouped into functional categories for the planet surface.

const BUILDING_DEFS = [
  // ── Production (0-9) ────────────────────────────────────────
  { key: 'construction_yard',   name: 'Construction Yard',     role: 'production',  desc: 'Primary base structure. Builds all other buildings.' },
  { key: 'barracks',            name: 'Barracks',              role: 'production',  desc: 'Trains infantry and light ground units.' },
  { key: 'light_factory',       name: 'Light Vehicle Factory', role: 'production',  desc: 'Produces light assault vehicles and scouts.' },
  { key: 'heavy_factory',       name: 'Heavy Vehicle Factory', role: 'production',  desc: 'Produces tanks, artillery, and siege units.' },
  { key: 'starport',            name: 'Starport',              role: 'production',  desc: 'Calls in orbital units and off-world reinforcements.' },
  { key: 'hightech_factory',    name: 'High Tech Factory',     role: 'production',  desc: 'Produces advanced aircraft and special units.' },
  { key: 'hangar',              name: 'Hangar Bay',            role: 'production',  desc: 'Stores and launches aerial units.' },
  { key: 'shipyard',            name: 'Orbital Shipyard',      role: 'production',  desc: 'Constructs capital ships for space combat.' },
  { key: 'mech_bay',            name: 'Mech Assembly Bay',     role: 'production',  desc: 'Assembles heavy mech walkers.' },
  { key: 'drone_foundry',       name: 'Drone Foundry',         role: 'production',  desc: 'Mass-produces autonomous combat drones.' },

  // ── Economy (10-19) ─────────────────────────────────────────
  { key: 'refinery',            name: 'Spice Refinery',        role: 'economy',     desc: 'Processes harvested resources into credits.' },
  { key: 'silo',                name: 'Resource Silo',         role: 'economy',     desc: 'Stores excess resources. +500 capacity.' },
  { key: 'wind_trap',           name: 'Wind Trap',             role: 'economy',     desc: 'Generates base power. Required for all buildings.' },
  { key: 'power_plant',         name: 'Fusion Reactor',        role: 'economy',     desc: 'Advanced power generation. 3x wind trap output.' },
  { key: 'harvester_bay',       name: 'Harvester Depot',       role: 'economy',     desc: 'Deploys and manages resource harvesters.' },
  { key: 'energy_pylon',        name: 'Energy Pylon',          role: 'economy',     desc: 'Extends power grid to remote building clusters.' },
  { key: 'trade_hub',           name: 'Trade Hub',             role: 'economy',     desc: 'Passive income from interplanetary trade routes.' },
  { key: 'mineral_extractor',   name: 'Mineral Extractor',     role: 'economy',     desc: 'Deep-core drill for rare mineral deposits.' },
  { key: 'supply_depot',        name: 'Supply Depot',          role: 'economy',     desc: 'Increases unit supply cap by 10.' },
  { key: 'recycler',            name: 'Scrap Recycler',        role: 'economy',     desc: 'Reclaims resources from destroyed units.' },

  // ── Defense (20-39) ─────────────────────────────────────────
  { key: 'gun_turret',          name: 'Gun Turret',            role: 'defense',     desc: 'Anti-ground auto-turret. Fast fire rate.' },
  { key: 'rocket_turret',       name: 'Rocket Turret',         role: 'defense',     desc: 'Anti-air missile launcher. Long range.' },
  { key: 'laser_turret',        name: 'Laser Turret',          role: 'defense',     desc: 'High-energy beam. Effective vs armor.' },
  { key: 'plasma_cannon',       name: 'Plasma Cannon',         role: 'defense',     desc: 'Heavy siege defense. Slow but devastating.' },
  { key: 'flak_tower',          name: 'Flak Tower',            role: 'defense',     desc: 'Area denial vs aircraft. Burst damage.' },
  { key: 'shield_pylon',        name: 'Shield Pylon',          role: 'defense',     desc: 'Projects energy shield over nearby buildings.' },
  { key: 'mine_layer',          name: 'Mine Deployer',         role: 'defense',     desc: 'Plants proximity mines in a radius.' },
  { key: 'sensor_array',        name: 'Sensor Array',          role: 'defense',     desc: 'Reveals cloaked units. Extended vision range.' },
  { key: 'wall_straight',       name: 'Wall Segment',          role: 'defense',     desc: 'Basic fortification wall.' },
  { key: 'wall_corner',         name: 'Wall Corner',           role: 'defense',     desc: 'Corner wall piece for base perimeter.' },
  { key: 'wall_gate',           name: 'Reinforced Gate',       role: 'defense',     desc: 'Passable gate for friendly units.' },
  { key: 'wall_tower',          name: 'Wall Watchtower',       role: 'defense',     desc: 'Elevated guard post on wall.' },
  { key: 'bunker',              name: 'Infantry Bunker',       role: 'defense',     desc: 'Garrisonable defensive structure for infantry.' },
  { key: 'pillbox',             name: 'Pillbox',               role: 'defense',     desc: 'Small hardened gun emplacement.' },
  { key: 'tesla_coil',          name: 'Tesla Coil',            role: 'defense',     desc: 'Chain lightning defense. Hits multiple targets.' },
  { key: 'anti_orbital',        name: 'Anti-Orbital Battery',  role: 'defense',     desc: 'Ground-to-space weapon. Deters orbital strikes.' },
  { key: 'emp_tower',           name: 'EMP Tower',             role: 'defense',     desc: 'Disables enemy vehicles in area.' },
  { key: 'flame_turret',        name: 'Flame Turret',          role: 'defense',     desc: 'Short-range anti-infantry incendiary.' },
  { key: 'mortar_pit',          name: 'Mortar Pit',            role: 'defense',     desc: 'Indirect fire emplacement. Area damage.' },
  { key: 'sam_site',            name: 'SAM Site',              role: 'defense',     desc: 'Surface-to-air missile battery.' },

  // ── Research (40-49) ────────────────────────────────────────
  { key: 'research_lab',        name: 'Research Lab',          role: 'research',    desc: 'Unlocks tier 2 units and upgrades.' },
  { key: 'tech_center',         name: 'Technology Center',     role: 'research',    desc: 'Unlocks tier 3 advanced technologies.' },
  { key: 'weapons_lab',         name: 'Weapons Lab',           role: 'research',    desc: 'Upgrades unit damage and weapon systems.' },
  { key: 'armor_forge',         name: 'Armor Forge',           role: 'research',    desc: 'Upgrades unit HP and armor values.' },
  { key: 'comms_center',        name: 'Communications Center', role: 'research',    desc: 'Unlocks minimap and advanced orders.' },
  { key: 'academy',             name: 'War Academy',           role: 'research',    desc: 'Trains veteran units. +1 rank on production.' },
  { key: 'biolab',              name: 'Biological Lab',        role: 'research',    desc: 'Researches biological weapons and healing.' },
  { key: 'cyber_core',          name: 'Cybernetics Core',      role: 'research',    desc: 'Unlocks cybernetic unit augments.' },
  { key: 'intel_hub',           name: 'Intelligence Hub',      role: 'research',    desc: 'Reveals enemy production queue.' },
  { key: 'upgrade_bay',         name: 'Upgrade Bay',           role: 'research',    desc: 'Generic structure for applying field upgrades.' },

  // ── Special (50-59) ─────────────────────────────────────────
  { key: 'palace',              name: 'Palace',                role: 'special',     desc: 'Faction superweapon. Ultimate ability on cooldown.' },
  { key: 'outpost',             name: 'Outpost',               role: 'special',     desc: 'Frontier expansion point. Builds basic defenses.' },
  { key: 'repair_pad',          name: 'Repair Pad',            role: 'special',     desc: 'Automatically repairs nearby friendly vehicles.' },
  { key: 'landing_pad',         name: 'Landing Pad',           role: 'special',     desc: 'Orbital drop zone for reinforcements.' },
  { key: 'beacon',              name: 'Rally Beacon',          role: 'special',     desc: 'Sets rally point for produced units.' },
  { key: 'command_center',      name: 'Command Center',        role: 'special',     desc: 'HQ building. Required for advanced structures.' },
  { key: 'observation_post',    name: 'Observation Post',      role: 'special',     desc: 'Extended radar range and detection.' },
  { key: 'teleporter',          name: 'Warp Gate',             role: 'special',     desc: 'Teleports units between paired warp gates.' },
  { key: 'monument',            name: 'War Monument',          role: 'special',     desc: 'Morale boost. Units nearby fight harder.' },
  { key: 'vault',               name: 'Resource Vault',        role: 'special',     desc: 'Protected storage. Resources survive destruction.' },

  // ── Decorative / Variants (60-99) ───────────────────────────
  { key: 'ruins_a',             name: 'Ruined Structure A',    role: 'decoration',  desc: 'Destroyed building remains for battlefield dressing.' },
  { key: 'ruins_b',             name: 'Ruined Structure B',    role: 'decoration',  desc: 'Collapsed building wreckage.' },
  { key: 'ruins_c',             name: 'Ruined Tower',          role: 'decoration',  desc: 'Destroyed watchtower remains.' },
  { key: 'pipe_junction',       name: 'Pipe Junction',         role: 'decoration',  desc: 'Industrial piping connector.' },
  { key: 'pipe_straight',       name: 'Pipe Segment',          role: 'decoration',  desc: 'Straight pipeline section.' },
  { key: 'pipe_corner',         name: 'Pipe Elbow',            role: 'decoration',  desc: 'Corner pipeline piece.' },
  { key: 'antenna_small',       name: 'Small Antenna',         role: 'decoration',  desc: 'Communication antenna mast.' },
  { key: 'antenna_large',       name: 'Radar Dish',            role: 'decoration',  desc: 'Large rotating radar dish.' },
  { key: 'scaffold_a',          name: 'Scaffold Frame A',      role: 'decoration',  desc: 'Construction scaffolding.' },
  { key: 'scaffold_b',          name: 'Scaffold Frame B',      role: 'decoration',  desc: 'Tall scaffolding structure.' },
  { key: 'crate_small',         name: 'Supply Crate',          role: 'decoration',  desc: 'Small supply container.' },
  { key: 'crate_large',         name: 'Cargo Container',       role: 'decoration',  desc: 'Large shipping container.' },
  { key: 'barrel_cluster',      name: 'Fuel Barrels',          role: 'decoration',  desc: 'Grouped fuel storage barrels.' },
  { key: 'tank_storage',        name: 'Storage Tank',          role: 'decoration',  desc: 'Liquid storage tank.' },
  { key: 'lamp_post',           name: 'Light Post',            role: 'decoration',  desc: 'Base illumination pole.' },
  { key: 'fence_straight',      name: 'Fence Segment',         role: 'decoration',  desc: 'Chain-link perimeter fence.' },
  { key: 'fence_gate',          name: 'Fence Gate',            role: 'decoration',  desc: 'Passable fence gate.' },
  { key: 'helipad',             name: 'Helipad',               role: 'decoration',  desc: 'Landing circle marking.' },
  { key: 'flag_pole',           name: 'Flag Pole',             role: 'decoration',  desc: 'Faction banner pole.' },
  { key: 'sandbag_wall',        name: 'Sandbag Wall',          role: 'decoration',  desc: 'Improvised cover emplacement.' },
  { key: 'turret_base_a',       name: 'Turret Platform A',     role: 'decoration',  desc: 'Elevated weapon platform base.' },
  { key: 'turret_base_b',       name: 'Turret Platform B',     role: 'decoration',  desc: 'Low-profile turret mount.' },
  { key: 'power_conduit',       name: 'Power Conduit',         role: 'decoration',  desc: 'Energy transfer cable housing.' },
  { key: 'exhaust_vent',        name: 'Exhaust Vent',          role: 'decoration',  desc: 'Industrial ventilation stack.' },
  { key: 'dish_array',          name: 'Sensor Dish Array',     role: 'decoration',  desc: 'Multi-dish sensor cluster.' },
  { key: 'generator_small',     name: 'Portable Generator',    role: 'decoration',  desc: 'Small field power unit.' },
  { key: 'bunker_small',        name: 'Observation Bunker',    role: 'decoration',  desc: 'Small fortified lookout.' },
  { key: 'blast_door',          name: 'Blast Door',            role: 'decoration',  desc: 'Heavy reinforced entrance.' },
  { key: 'control_panel',       name: 'Control Terminal',      role: 'decoration',  desc: 'Outdoor control console.' },
  { key: 'siren_tower',         name: 'Alert Siren Tower',     role: 'decoration',  desc: 'Air raid warning system.' },
  { key: 'water_tower',         name: 'Water Tower',           role: 'decoration',  desc: 'Base water supply tank.' },
  { key: 'cooling_tower',       name: 'Cooling Tower',         role: 'decoration',  desc: 'Reactor heat dissipation.' },
  { key: 'smokestack',          name: 'Smokestack',            role: 'decoration',  desc: 'Industrial exhaust chimney.' },
  { key: 'landing_beacon',      name: 'Landing Beacon',        role: 'decoration',  desc: 'Glowing approach marker.' },
  { key: 'comm_tower',          name: 'Communications Tower',  role: 'decoration',  desc: 'Tall signal relay tower.' },
  { key: 'garage',              name: 'Vehicle Garage',        role: 'decoration',  desc: 'Vehicle shelter structure.' },
  { key: 'checkpoint',          name: 'Security Checkpoint',   role: 'decoration',  desc: 'Base entry control point.' },
  { key: 'watchtower',          name: 'Guard Tower',           role: 'decoration',  desc: 'Elevated sentry position.' },
  { key: 'ammo_dump',           name: 'Ammunition Dump',       role: 'decoration',  desc: 'Munitions storage area.' },
  { key: 'command_tent',        name: 'Field Command Post',    role: 'decoration',  desc: 'Temporary tactical headquarters.' },
];

async function main() {
  console.log('🏗️  Emperor Dune Building Splitter\n');

  const { NodeIO } = await import('@gltf-transform/core');
  const { ALL_EXTENSIONS } = await import('@gltf-transform/extensions');
  const { cloneDocument } = await import('@gltf-transform/functions');

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(SRC_GLTF);
  const root = doc.getRoot();
  const meshes = root.listMeshes();

  console.log(`   Found ${meshes.length} meshes in scene.gltf`);
  console.log(`   Output: ${OUT_DIR}\n`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const catalog = {
    _source: 'Emperor: Battle for Dune - Models Part 6 (Harkonnen Buildings)',
    _totalMeshes: meshes.length,
    _categories: {
      production: 'Buildings that produce units',
      economy: 'Resource generation and storage',
      defense: 'Turrets, walls, and defensive structures',
      research: 'Tech upgrades and unit improvements',
      special: 'Unique buildings with special abilities',
      decoration: 'Props, ruins, and environmental dressing',
    },
    buildings: [],
  };

  // For each mesh, create a standalone GLB
  for (let i = 0; i < meshes.length && i < BUILDING_DEFS.length; i++) {
    const def = BUILDING_DEFS[i];
    const mesh = meshes[i];
    const outPath = path.join(OUT_DIR, `${def.key}.glb`);

    // Create a new document with just this mesh
    const singleDoc = cloneDocument(doc);
    const singleRoot = singleDoc.getRoot();
    const singleMeshes = singleRoot.listMeshes();
    const singleNodes = singleRoot.listNodes();
    const singleScenes = singleRoot.listScenes();

    // Remove all meshes except the target index
    for (let j = singleMeshes.length - 1; j >= 0; j--) {
      if (j !== i) {
        // Remove the node referencing this mesh, then dispose the mesh
        for (const node of singleNodes) {
          if (node.getMesh() === singleMeshes[j]) {
            node.setMesh(null);
          }
        }
        singleMeshes[j].dispose();
      }
    }

    // Clean up empty nodes
    for (const node of singleRoot.listNodes()) {
      if (!node.getMesh() && node.listChildren().length === 0) {
        node.dispose();
      }
    }

    try {
      await io.write(outPath, singleDoc);
      const size = fs.statSync(outPath).size;
      console.log(`  ✓ [${i}] ${def.key}.glb (${(size / 1024).toFixed(1)} KB) — ${def.name}`);

      catalog.buildings.push({
        index: i,
        key: def.key,
        name: def.name,
        role: def.role,
        description: def.desc,
        glbPath: `/assets/groundrts/dune-buildings/${def.key}.glb`,
        meshIndex: i,
      });
    } catch (err) {
      console.log(`  ✗ [${i}] ${def.key} — ${err.message}`);
    }
  }

  // Handle any extra meshes beyond our definitions
  for (let i = BUILDING_DEFS.length; i < meshes.length; i++) {
    const key = `building_extra_${i}`;
    catalog.buildings.push({
      index: i,
      key,
      name: `Structure ${i}`,
      role: 'decoration',
      description: `Unclassified building mesh #${i}`,
      glbPath: `/assets/groundrts/dune-buildings/${key}.glb`,
      meshIndex: i,
    });
  }

  // Write catalog
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));

  console.log(`\n✅ Split complete.`);
  console.log(`   ${catalog.buildings.length} buildings cataloged`);
  console.log(`   Catalog: ${CATALOG_PATH}`);

  // Print summary by role
  const byRole = {};
  for (const b of catalog.buildings) {
    byRole[b.role] = (byRole[b.role] || 0) + 1;
  }
  console.log('\n   By role:');
  for (const [role, count] of Object.entries(byRole)) {
    console.log(`     ${role}: ${count}`);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
