import React, { useMemo } from 'react';
import characterManifest from '../assets/characterManifest.json';

/* ================= SLOT STYLES ================= */
const ITEM_SCALE = 0.92;
const SLOTS = {
  base: {
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      zIndex: 0
    }
  },

  pants: {
    style: {
      position: 'absolute',
      top: '66%',
      left: '46%',
      width: '35%',
      transform: 'translateX(-50%)',
      zIndex: 4
    }
  },

  shoes: {
    style: {
      position: 'absolute',
      top: '95%',
      left: '46%',
      width: '32%',
      transform: 'translateX(-50%)',
      zIndex: 5
    }
  },

  shirts: {
    style: {
      position: 'absolute',
      top: '42%',
      left: '50%',
      width: '45%',
      transform: 'translateX(-50%)',
      zIndex: 6
    }
  },

  head: {
    style: {
      position: 'absolute',
      top: '9%',
      left: '50%',
      width: '38%',
      transform: 'translateX(-50%)',
      zIndex: 10
    }
  },

  hat: {
    style: {
      position: 'absolute',
      top: '6%',
      left: '50%',
      width: '45%',
      transform: 'translateX(-50%)',
      zIndex: 20
    }
  },

  bundle: {
    style: {
      position: 'absolute',
      top: '10%',
      left: '50%',
      width: '80%',
      height: '90%',
      transform: 'translateX(-50%)',
      zIndex: 8
    }
  }
};

/* ================= COMPONENT ================= */

const CharacterAvatar = ({ config, size = 200, className }) => {
  const activeConfig = {
    skin: 0,
    face: 0,
    hat: -1,
    shirts: 0,
    pants: -1,
    shoes: -1,
    bundle: -1,
    ...config
  };

  const defaultShirtIndex = useMemo(() => {
    return characterManifest.shirts.findIndex(
      s => s.filename === 'aohub.svg'
    );
  }, []);

  const layers = useMemo(() => {
    const list = [];

    /* ===== BASE BODY ===== */
    list.push({
      src: '/character/nochain_body.svg',
      type: 'base'
    });

    /* ===== CLOTHES OR BUNDLE ===== */
    if (activeConfig.bundle !== -1) {
      const bundle = characterManifest.bundle[activeConfig.bundle];
      if (bundle) {
        list.push({ src: bundle.path, type: 'bundle' });
      }
    } else {
      if (
        activeConfig.pants !== -1 &&
        characterManifest.pants[activeConfig.pants]
      ) {
        list.push({
          src: characterManifest.pants[activeConfig.pants].path,
          type: 'pants'
        });
      }

      if (
        activeConfig.shoes !== -1 &&
        characterManifest.shoes[activeConfig.shoes]
      ) {
        list.push({
          src: characterManifest.shoes[activeConfig.shoes].path,
          type: 'shoes'
        });
      }

      let shirtIdx = activeConfig.shirts;
      if (shirtIdx === -1 || shirtIdx == null) {
        shirtIdx = defaultShirtIndex;
      }

      if (shirtIdx !== -1 && characterManifest.shirts[shirtIdx]) {
        list.push({
          src: characterManifest.shirts[shirtIdx].path,
          type: 'shirts'
        });
      }
    }

    /* ===== HEAD (SEPARATED SVG) ===== */
    list.push({
      src: '/character/nochain_head.svg',
      type: 'head'
    });

    /* ===== HAT ===== */
    if (activeConfig.hat !== -1 && characterManifest.hat[activeConfig.hat]) {
      list.push({
        src: characterManifest.hat[activeConfig.hat].path,
        type: 'hat'
      });
    }

    return list;
  }, [activeConfig, defaultShirtIndex]);

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* SCALE NHÂN VẬT – KHÔNG SCALE KHUNG */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: 'scale(0.8)',
          transformOrigin: 'center top'
        }}
      >
        {layers.map((layer, idx) => {
          const style =
            SLOTS[layer.type]?.style || SLOTS.base.style;

          return (
            <img
              key={`${layer.type}-${idx}`}
              src={layer.src}
              alt={layer.type}
              style={style}
              draggable={false}
              className="pointer-events-none select-none"
            />
          );
        })}
      </div>
    </div>
  );
};

export default CharacterAvatar;
