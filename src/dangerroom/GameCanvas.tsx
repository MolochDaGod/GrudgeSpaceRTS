import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { Suspense } from "react";
import { Arena } from "./components/Arena";
import { Player } from "./components/Player";
import { VfxLayer } from "./components/Vfx";
import { BlockParryVfx } from "./components/BlockParryVfx";
import { BlockParryScreenFx } from "./components/BlockParryScreenFx";
import { ImpactVfx } from "./components/ImpactVfx";
import { DamageNumbers } from "./components/DamageNumbers";
import { MainPanelHud } from "./components/MainPanelHud";
import { WeaponSkillKeys } from "./components/WeaponSkillKeys";
import { PlayerInput } from "./components/PlayerInput";
import { TargetPicker } from "./components/TargetPicker";
import { CameraControls } from "./components/CameraControls";
import { CombatInput } from "./components/CombatInput";
import { WorldReticle } from "./components/WorldReticle";
import { TargetHighlight } from "./components/TargetHighlight";
import { keyMap } from "./controls";
import { DevCombatPanel } from "./components/DevCombatPanel";
import "./styles/dangerRoomHud.css";

export function GameCanvas() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#0c0f0a" }}>
      <KeyboardControls map={keyMap}>
        <WeaponSkillKeys />
        <PlayerInput />
        <CameraControls />
        <CombatInput />
        <Canvas
          shadows
          camera={{ position: [0, 8.5, 17.5], fov: 50 }}
          gl={{
            antialias: true,
            powerPreference: "default",
            failIfMajorPerformanceCaveat: false,
          }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.6} />
            <directionalLight
              position={[30, 45, 20]}
              intensity={1.25}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-camera-left={-40}
              shadow-camera-right={40}
              shadow-camera-top={40}
              shadow-camera-bottom={-40}
            />
            <hemisphereLight args={["#bcd4e8", "#3a2f22", 0.5]} />
            <fog attach="fog" args={["#bcd4e8", 55, 160]} />
            <Physics timeStep="vary" gravity={[0, -9.81, 0]} interpolate colliders={false}>
              <Arena />
              <Player />
              <TargetPicker />
            </Physics>
            <WorldReticle />
            <TargetHighlight />
            <VfxLayer />
            <BlockParryVfx />
            <ImpactVfx />
            <DamageNumbers />
          </Suspense>
        </Canvas>
        <BlockParryScreenFx />
        {import.meta.env.DEV && <DevCombatPanel />}
        <MainPanelHud />
      </KeyboardControls>
    </div>
  );
}
