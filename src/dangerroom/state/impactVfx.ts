export const groundImpactVfx = {
  token: 0,
  x: 0,
  y: 0,
  z: 0,
  power: 1,
};

export const wallImpactVfx = {
  token: 0,
  x: 0,
  y: 0,
  z: 0,
  nx: 0,
  nz: 0,
  power: 1,
};

export function fireGroundImpactVfx(x: number, y: number, z: number, power = 1): void {
  groundImpactVfx.x = x;
  groundImpactVfx.y = y;
  groundImpactVfx.z = z;
  groundImpactVfx.power = power;
  groundImpactVfx.token++;
}

export function fireWallImpactVfx(
  x: number,
  y: number,
  z: number,
  nx: number,
  nz: number,
  power = 1,
): void {
  wallImpactVfx.x = x;
  wallImpactVfx.y = y;
  wallImpactVfx.z = z;
  wallImpactVfx.nx = nx;
  wallImpactVfx.nz = nz;
  wallImpactVfx.power = power;
  wallImpactVfx.token++;
}