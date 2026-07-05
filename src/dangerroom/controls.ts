export enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
  jump = "jump",
  descend = "descend",
  roll = "roll",
  sprint = "sprint",
  dodge = "dodge",
  crouch = "crouch",
}

export const keyMap = [
  { name: Controls.forward, keys: ["ArrowUp", "KeyW"] },
  { name: Controls.back, keys: ["ArrowDown", "KeyS"] },
  { name: Controls.left, keys: ["ArrowLeft", "KeyA"] },
  { name: Controls.right, keys: ["ArrowRight", "KeyD"] },
  { name: Controls.jump, keys: ["Space"] },
  { name: Controls.descend, keys: ["ControlLeft", "ControlRight"] },
  { name: Controls.roll, keys: ["AltLeft", "AltRight"] },
  { name: Controls.sprint, keys: ["ShiftLeft", "ShiftRight"] },
  { name: Controls.dodge, keys: ["KeyC"] },
  { name: Controls.crouch, keys: ["KeyX"] },
];
