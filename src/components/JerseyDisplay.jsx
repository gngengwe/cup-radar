/**
 * JerseyDisplay — renders a CSS soccer jersey shape with team colors.
 * Patterns: solid | vstripes (vertical) | hstripes (horizontal) | sash | halves
 */
import { useId } from 'react';

export default function JerseyDisplay({ colors = ['#cccccc', '#ffffff'], pattern = 'solid', size = 72 }) {
  const uid = useId();
  const pid = `jp-${uid.replace(/:/g, '')}`;
  const [c1, c2 = '#ffffff'] = colors;

  // Jersey outline path (viewBox 0 0 100 108)
  const SHIRT  = 'M34,6 Q50,20 66,6 L85,6 L99,21 L99,40 L78,33 L78,104 L22,104 L22,33 L1,40 L1,21 L15,6 Z';
  const COLLAR = 'M34,6 Q50,20 66,6 Q59,14 50,14 Q41,14 34,6 Z';

  const patternDef = (() => {
    switch (pattern) {
      case 'vstripes':
        return (
          <pattern id={pid} x="0" y="0" width="10" height="1" patternUnits="userSpaceOnUse">
            <rect width="5"  height="108" fill={c1} />
            <rect x="5" width="5" height="108" fill={c2} />
          </pattern>
        );
      case 'hstripes':
        return (
          <pattern id={pid} x="0" y="0" width="1" height="10" patternUnits="userSpaceOnUse">
            <rect width="100" height="5"  fill={c1} />
            <rect y="5" width="100" height="5" fill={c2} />
          </pattern>
        );
      case 'sash':
        return (
          <pattern id={pid} x="0" y="0" width="100" height="108" patternUnits="userSpaceOnUse">
            <rect width="100" height="108" fill={c1} />
            <polygon points="20,0 50,0 80,108 50,108" fill={c2} />
          </pattern>
        );
      case 'halves':
        return (
          <pattern id={pid} x="0" y="0" width="100" height="108" patternUnits="userSpaceOnUse">
            <rect width="50"  height="108" fill={c1} />
            <rect x="50" width="50" height="108" fill={c2} />
          </pattern>
        );
      default:
        return null; // solid — no pattern needed
    }
  })();

  const fill     = patternDef ? `url(#${pid})` : c1;
  const trimColor = pattern === 'solid' ? c2 : c1;

  return (
    <svg
      width={size}
      height={size * 1.08}
      viewBox="0 0 100 108"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}
    >
      {patternDef && <defs>{patternDef}</defs>}

      {/* Jersey body */}
      <path d={SHIRT} fill={fill} stroke="rgba(0,0,0,0.25)" strokeWidth="1" />

      {/* Collar fill */}
      <path d={COLLAR} fill={trimColor} />

      {/* Collar outline */}
      <path d={COLLAR} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
    </svg>
  );
}
