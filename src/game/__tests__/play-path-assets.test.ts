import { describe, expect, it } from 'vitest';
import { assertPlayPathGlb, toGlbPath } from '../model-loader';
import { resolveModelUrl } from '../asset-loader';

describe('play path GLB remap', () => {
  it('rewrites OBJ and FBX model keys to GLB', () => {
    expect(toGlbPath('/assets/space/models/ships/RedFighter.obj')).toBe(
      '/assets-glb/ships/RedFighter.glb',
    );
    expect(toGlbPath('/assets/space/models/hero.fbx')).toBe('/assets-glb/hero.glb');
    expect(assertPlayPathGlb('fleet/carrier.glb')).toBe('fleet/carrier.glb');
  });

  it('resolveModelUrl never keeps an OBJ/FBX extension', () => {
    expect(resolveModelUrl('/assets/space/models/turret.obj').endsWith('.obj')).toBe(false);
    expect(resolveModelUrl('/assets/space/models/turret.fbx').endsWith('.fbx')).toBe(false);
    expect(resolveModelUrl('/assets/space/models/turret.obj')).toContain('.glb');
  });
});
