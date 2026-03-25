/**
 * ── Sci-Fi Menu Button Bar ────────────────────────────────────────────
 * Vertical strip of menu buttons on the right side of the bottom HUD.
 * Uses the craftpix Icons spritesheet (9 framed icon buttons).
 */

import React from 'react';
import { ICONS, MENU_ICON_CLIPS } from './scifi-gui-assets';

interface MenuAction {
  id: string;
  label: string;
  icon: keyof typeof MENU_ICON_CLIPS;
  hotkey?: string;
}

const MENU_ACTIONS: MenuAction[] = [
  { id: 'starmap', label: 'Star Map', icon: 'starmap', hotkey: 'M' },
  { id: 'inventory', label: 'Fleet', icon: 'inventory', hotkey: 'I' },
  { id: 'log', label: 'Log', icon: 'log', hotkey: 'L' },
  { id: 'commander', label: 'Commander', icon: 'social' },
  { id: 'tech', label: 'Tech', icon: 'settings' },
  { id: 'save', label: 'Save', icon: 'save' },
  { id: 'checklist', label: 'Orders', icon: 'checklist' },
  { id: 'mail', label: 'AI Chat', icon: 'mail' },
  { id: 'databook', label: 'Codex', icon: 'databook' },
];

interface MenuButtonBarProps {
  onAction: (actionId: string) => void;
}

export function MenuButtonBar({ onAction }: MenuButtonBarProps) {
  const spriteW = 1440;
  const spriteH = 960;
  const btnSize = 44;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 4,
      }}
    >
      {MENU_ACTIONS.map((action) => {
        const clip = MENU_ICON_CLIPS[action.icon];
        // Render a button-sized view clipped from the spritesheet
        const scaleX = btnSize / clip.w;
        const scaleY = btnSize / clip.h;
        return (
          <div
            key={action.id}
            onClick={() => onAction(action.id)}
            title={`${action.label}${action.hotkey ? ` (${action.hotkey})` : ''}`}
            style={{
              width: btnSize,
              height: btnSize,
              overflow: 'hidden',
              cursor: 'pointer',
              borderRadius: 6,
              position: 'relative',
              transition: 'filter 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
            }}
          >
            <img
              src={ICONS.green}
              alt={action.label}
              style={{
                position: 'absolute',
                width: spriteW * scaleX,
                height: spriteH * scaleY,
                left: -clip.x * scaleX,
                top: -clip.y * scaleY,
                imageRendering: 'auto',
                pointerEvents: 'none',
              }}
            />
            {/* Hotkey badge */}
            {action.hotkey && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 1,
                  right: 2,
                  fontSize: 7,
                  fontWeight: 700,
                  color: '#44ffaa',
                  textShadow: '0 0 3px #000, 0 1px 1px #000',
                }}
              >
                {action.hotkey}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
