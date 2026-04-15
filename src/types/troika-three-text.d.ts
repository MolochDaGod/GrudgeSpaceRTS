declare module 'troika-three-text' {
  import { Mesh, Material } from 'three';

  export class Text extends Mesh {
    text: string;
    fontSize: number;
    color: string | number;
    anchorX: 'left' | 'center' | 'right' | number;
    anchorY: 'top' | 'middle' | 'bottom' | number;
    outlineWidth: number;
    outlineColor: string | number;
    material: Material;
    sync(callback?: () => void): void;
    dispose(): void;
  }
}
