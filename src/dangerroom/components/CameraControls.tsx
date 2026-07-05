import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  cameraRig,
  CAMERA_DISTANCE_PRESETS,
  CAMERA_DEFAULT_PITCH,
  CAMERA_MIN_PITCH,
  CAMERA_MAX_PITCH,
  CAMERA_MIN_DISTANCE,
  CAMERA_MAX_DISTANCE,
} from "../state/world";
import { combatAim } from "../state/combatAim";

const LOOK_SENSITIVITY = 0.0045;

/**
 * Mouse-driven camera control, matching the original Dangerroom feel: hold the
 * right mouse button and drag to orbit (yaw/pitch), scroll to zoom, press R to
 * recenter behind the player, and V to cycle distance presets. Writes straight
 * to the shared `cameraRig`, which Player.tsx reads each frame. The rig no longer
 * auto-trails the player's facing, so the camera holds still instead of drifting.
 */
export function CameraControls() {
  const dragging = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const dragPixels = useRef(0);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 2) return;
      dragging.current = true;
      dragPixels.current = 0;
      lastX.current = e.clientX;
      lastY.current = e.clientY;
      cameraRig.freeLooking = true;
      combatAim.rmbHeld = true;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastX.current;
      const dy = e.clientY - lastY.current;
      dragPixels.current += Math.abs(dx) + Math.abs(dy);
      lastX.current = e.clientX;
      lastY.current = e.clientY;
      cameraRig.yaw -= dx * LOOK_SENSITIVITY;
      cameraRig.pitch = THREE.MathUtils.clamp(
        cameraRig.pitch + dy * LOOK_SENSITIVITY,
        CAMERA_MIN_PITCH,
        CAMERA_MAX_PITCH,
      );
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button !== 2) return;
      if (dragPixels.current < 6) {
        combatAim.focusEnabled = !combatAim.focusEnabled;
      }
      dragging.current = false;
      cameraRig.freeLooking = false;
      combatAim.rmbHeld = false;
    };
    const onBlur = () => {
      dragging.current = false;
      cameraRig.freeLooking = false;
      combatAim.rmbHeld = false;
    };
    const onWheel = (e: WheelEvent) => {
      cameraRig.distance = THREE.MathUtils.clamp(
        cameraRig.distance + Math.sign(e.deltaY) * 1.25,
        CAMERA_MIN_DISTANCE,
        CAMERA_MAX_DISTANCE,
      );
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "KeyR") {
        cameraRig.yaw = 0;
        cameraRig.pitch = CAMERA_DEFAULT_PITCH;
        cameraRig.recenterRequested = true;
      } else if (e.code === "KeyB") {
        const next = (cameraRig.presetIndex + 1) % CAMERA_DISTANCE_PRESETS.length;
        cameraRig.presetIndex = next;
        cameraRig.distance = CAMERA_DISTANCE_PRESETS[next];
      }
    };
    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("blur", onBlur);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("contextmenu", onContextMenu);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("contextmenu", onContextMenu);
    };
  }, []);

  return null;
}
