import * as THREE from 'three';
import type { SpaceShip } from './space-types';

const _euler = new THREE.Euler();

/** Apply procedural animation to a ship's 3D group based on its anim state */
export function applyShipAnimation(group: THREE.Group, ship: SpaceShip, dt: number) {
  const t = ship.animTimer;

  switch (ship.animState) {
    case 'idle': {
      // Gentle bob + slow yaw oscillation
      group.position.y += Math.sin(t * 1.5) * 0.02;
      group.rotation.z = Math.sin(t * 0.8) * 0.02;
      break;
    }
    case 'moving': {
      // Slight forward tilt + engine bob
      group.rotation.x = -0.08;
      group.position.y += Math.sin(t * 3) * 0.01;
      break;
    }
    case 'banking': {
      // Roll into turn direction
      const turnDir = ship.roll > 0 ? 1 : -1;
      group.rotation.z = turnDir * Math.min(Math.abs(ship.roll), 0.5);
      group.rotation.x = -0.05;
      break;
    }
    case 'barrel_roll': {
      // Full 360° roll on forward axis
      const rollProgress = t / 0.8; // duration of 0.8s
      group.rotation.z = rollProgress * Math.PI * 2;
      group.position.y += Math.sin(rollProgress * Math.PI) * 0.5;
      break;
    }
    case 'speed_boost': {
      // Ship tilts forward, vibrates slightly
      group.rotation.x = -0.2;
      group.position.y += Math.sin(t * 15) * 0.02;
      group.scale.z = 1.0 + Math.sin(t * 2) * 0.05; // subtle stretch
      break;
    }
    case 'warping': {
      // Ship stretches on Z-axis, scales out
      const warpProgress = Math.min(t / 2.0, 1.0);
      if (warpProgress < 0.3) {
        // Charge up: vibrate
        group.position.x += (Math.random() - 0.5) * 0.05;
        group.position.z += (Math.random() - 0.5) * 0.05;
      } else if (warpProgress < 0.5) {
        // Stretch
        group.scale.z = 1.0 + (warpProgress - 0.3) * 10;
        group.scale.x = 1.0 - (warpProgress - 0.3) * 2;
        group.scale.y = 1.0 - (warpProgress - 0.3) * 2;
      } else {
        // Gone
        group.scale.setScalar(0);
      }
      break;
    }
    case 'docking': {
      // Slow approach, alignment
      group.rotation.x = 0;
      group.rotation.z = 0;
      const dockBob = Math.sin(t * 2) * 0.01;
      group.position.y += dockBob;
      break;
    }
    case 'launching': {
      // Rise up, engines ignite
      const launchProgress = Math.min(t / 1.5, 1.0);
      group.position.y += launchProgress * 0.5;
      group.rotation.x = -launchProgress * 0.15;
      break;
    }
    case 'death_spiral': {
      // Random tumble + listing
      group.rotation.x += dt * (1 + Math.random() * 2);
      group.rotation.z += dt * (0.5 + Math.random());
      group.position.y -= dt * 0.5;
      break;
    }
    case 'cloaked': {
      // Fade effect (handled in renderer opacity), just slight shimmer
      group.position.y += Math.sin(t * 4) * 0.005;
      break;
    }
    case 'attacking': {
      // Quick recoil
      const recoil = Math.sin(t * 20) * 0.02 * Math.max(0, 1 - t * 2);
      group.position.z += recoil;
      break;
    }
  }

  // Damage listing: as damageLevel increases, ship lists to one side
  if (ship.damageLevel > 0.3) {
    const listing = (ship.damageLevel - 0.3) * 0.3;
    group.rotation.z += Math.sin(t * 0.5) * listing;
    group.rotation.x += Math.sin(t * 0.3) * listing * 0.5;
  }
}
