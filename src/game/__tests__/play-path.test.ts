import { describe, expect, it } from 'vitest';
import { toRuntimeGlbPath } from '../model-loader';
import { PLAY_PATH_INTRO_TARGET, shouldDismissIntroOnKey } from '../play-path';

describe('play path entry', () => {
  it('opens commander select as soon as the splash is dismissed', () => {
    expect(PLAY_PATH_INTRO_TARGET).toEqual({
      screen: 'menu',
      commanderSelectOpen: true,
    });
  });

  it('accepts any key to dismiss the splash', () => {
    expect(shouldDismissIntroOnKey({ key: 'a' })).toBe(true);
    expect(shouldDismissIntroOnKey({ key: 'Escape' })).toBe(true);
    expect(shouldDismissIntroOnKey({ key: ' ' })).toBe(true);
  });

  it('ignores modifier-only keys', () => {
    expect(shouldDismissIntroOnKey({ key: 'Shift' })).toBe(false);
    expect(shouldDismissIntroOnKey({ key: 'Control' })).toBe(false);
    expect(shouldDismissIntroOnKey({ key: 'Alt' })).toBe(false);
    expect(shouldDismissIntroOnKey({ key: 'Meta' })).toBe(false);
  });
});

describe('space runtime model assets', () => {
  it('keeps GLB assets on the play path', () => {
    expect(toRuntimeGlbPath('/assets/space/models/planets/planet_main.glb')).toBe('/assets/space/models/planets/planet_main.glb');
  });

  it('maps legacy space OBJ/FBX references to converted GLB mirrors', () => {
    expect(toRuntimeGlbPath('/assets/space/models/ships/MicroRecon/MicroRecon.obj')).toBe('/assets-glb/ships/MicroRecon/MicroRecon.glb');
    expect(toRuntimeGlbPath('/assets/space/models/battle-ships/Corvette_01.fbx')).toBe('/assets-glb/battle-ships/Corvette_01.glb');
  });

  it('maps all legacy model formats to GLB runtime paths', () => {
    expect(toRuntimeGlbPath('/assets/space/models/example/scene.gltf')).toBe('/assets-glb/example/scene.glb');
    expect(toRuntimeGlbPath('/models/legacy/ship.fbx')).toBe('/models/legacy/ship.glb');
  });
});
