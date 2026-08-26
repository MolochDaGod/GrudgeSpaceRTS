import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { SHIP_AXES, autoOrientShip, findBoosterAnchors } from '../space-rig';

describe('ship XYZ (Carrier modelFit parity)', () => {
  it('exposes +Z nose / +X starboard / +Y up', () => {
    expect(SHIP_AXES.nose).toBe('z+');
    expect(SHIP_AXES.side).toBe('x+');
    expect(SHIP_AXES.up).toBe('y+');
    expect(SHIP_AXES.boosters).toBe('z-');
  });

  it('autoOrientShip maps the long tapered axis onto local +Z', () => {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(4, 0.6, 1));
    g.add(hull);
    autoOrientShip(g);
    g.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(g);
    const size = box.getSize(new THREE.Vector3());
    expect(size.z).toBeGreaterThan(size.x);
    expect(g.userData.shipAxes.nose).toBe('z+');
  });

  it('findBoosterAnchors sits on the −Z tail, not empty space', () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1, 0.4, 4)));
    autoOrientShip(g);
    const sockets = findBoosterAnchors(g);
    expect(sockets.length).toBeGreaterThan(0);
    for (const p of sockets) {
      expect(p.z).toBeLessThan(0);
    }
  });
});
