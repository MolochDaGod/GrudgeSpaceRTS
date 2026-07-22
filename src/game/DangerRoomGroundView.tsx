/**
 * DangerRoomGroundView — R3F dangerroom combat sandbox for /ground.
 * Poly Haven terrain, soft lock, RMB focus, block/parry, MM movement.
 */

import { GameProvider, useGame } from "../dangerroom/state/gameStore";
import { NexusToonSelect } from "../dangerroom/components/NexusToonSelect";
import { GameCanvas } from "../dangerroom/GameCanvas";

interface Props {
  planetName?: string;
  onExit: (result: "win" | "lose" | "retreat") => void;
}

function SandboxRoot() {
  const { classDef } = useGame();
  return classDef ? <GameCanvas /> : <NexusToonSelect />;
}

export function DangerRoomGroundView({ planetName = "Training Grounds", onExit }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 150,
        background: "#0c0f0a",
      }}
    >
      <button
        type="button"
        onClick={() => onExit("retreat")}
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          padding: "8px 16px",
          background: "rgba(0,0,0,0.78)",
          color: "#88ccaa",
          border: "1px solid rgba(136,204,170,0.55)",
          borderRadius: 6,
          fontFamily: "'Segoe UI', monospace",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1.5,
          cursor: "pointer",
          zIndex: 200,
          textTransform: "uppercase",
        }}
      >
        ← ARMADA
      </button>
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 200,
          pointerEvents: "none",
          fontFamily: "ui-monospace, Consolas, monospace",
          fontSize: 10,
          letterSpacing: 2,
          color: "rgba(160,200,255,0.45)",
          textTransform: "uppercase",
        }}
      >
        Nexus Ground · {planetName}
      </div>
      <div style={{ position: "absolute", inset: 0 }}>
        <GameProvider>
          <SandboxRoot />
        </GameProvider>
      </div>
    </div>
  );
}