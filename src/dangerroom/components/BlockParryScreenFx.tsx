import { useEffect, useRef, useState } from "react";
import { blockScreenFx } from "../state/blockParryVfx";
import { combatClash } from "../state/combatClash";

/**
 * Full-screen anime burst on parry rebound + clash blink on block/parry connect.
 */
export function BlockParryScreenFx() {
  const tokenRef = useRef(blockScreenFx.token);
  const clashTokenRef = useRef(combatClash.token);
  const [reboundBurst, setReboundBurst] = useState(0);
  const [clashBlink, setClashBlink] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (blockScreenFx.token !== tokenRef.current) {
        tokenRef.current = blockScreenFx.token;
        if (blockScreenFx.success && blockScreenFx.kind === "rebound") {
          setReboundBurst((n) => n + 1);
        }
      }
      if (combatClash.token !== clashTokenRef.current) {
        clashTokenRef.current = combatClash.token;
        setClashBlink((n) => n + 1);
      }
    }, 16);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {reboundBurst > 0 && (
        <div key={`rb-${reboundBurst}`} className="dr-block-screen-fx" aria-hidden>
          <div className="dr-block-speed-lines" />
          <div className="dr-block-flash" />
        </div>
      )}
      {clashBlink > 0 && (
        <div key={`cl-${clashBlink}`} className="dr-clash-blink" aria-hidden />
      )}
    </>
  );
}