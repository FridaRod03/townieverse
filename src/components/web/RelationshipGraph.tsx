import { memo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type {
  CharacterNode,
  Connection,
  RelationshipWeb,
} from '../../types/web';
import { connectionGroup } from '../../utils/web';
interface Props {
  web: RelationshipWeb;
  nodes: CharacterNode[];
  edges: Connection[];
  selected: string;
  disabled: boolean;
  onSelect: (id: string, edge?: boolean) => void;
  onPosition: (id: string, x: number, y: number) => void;
  onView: (view: RelationshipWeb['view']) => void;
  onReset: () => void;
  worlds: Map<string, string>;
}
const NodeCard = memo(function NodeCard({
  node,
  simple,
  selected,
  disabled,
  world,
  onSelect,
  onPosition,
  zoom,
}: {
  node: CharacterNode;
  simple: boolean;
  selected: boolean;
  disabled: boolean;
  world?: string;
  zoom: number;
  onSelect: Props['onSelect'];
  onPosition: Props['onPosition'];
}) {
  const drag = useRef<{
      x: number;
      y: number;
      nx: number;
      ny: number;
      pointer: number;
    } | null>(null),
    [offset, setOffset] = useState({ x: 0, y: 0 });
  const finish = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const x = (e.clientX - d.x) / zoom,
      y = (e.clientY - d.y) / zoom;
    setOffset({ x: 0, y: 0 });
    if (Math.abs(x) + Math.abs(y) > 3)
      onPosition(node.id, node.x + x, node.y + y);
    else onSelect(node.id);
  };
  return (
    <button
      className={`character-node ${selected ? 'selected' : ''}`}
      style={{
        left: node.x + offset.x,
        top: node.y + offset.y,
        borderTopColor: node.color || undefined,
      }}
      aria-label={`Select ${node.label} · ${node.householdName || 'Standalone Sim'}`}
      aria-pressed={selected}
      onClick={(e) => {
        if (e.detail === 0) onSelect(node.id);
      }}
      onPointerDown={(e) => {
        if (disabled) return;
        e.stopPropagation();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        drag.current = {
          x: e.clientX,
          y: e.clientY,
          nx: node.x,
          ny: node.y,
          pointer: e.pointerId,
        };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (d)
          setOffset({
            x: (e.clientX - d.x) / zoom,
            y: (e.clientY - d.y) / zoom,
          });
      }}
      onPointerUp={finish}
      onPointerCancel={() => {
        drag.current = null;
        setOffset({ x: 0, y: 0 });
      }}
      onKeyDown={(e) => {
        const direction: { [key: string]: [number, number] } = {
          ArrowLeft: [-20, 0],
          ArrowRight: [20, 0],
          ArrowUp: [0, -20],
          ArrowDown: [0, 20],
        };
        const d = direction[e.key];
        if (d && !disabled) {
          e.preventDefault();
          onPosition(node.id, node.x + d[0], node.y + d[1]);
        }
      }}
    >
      <strong>
        {node.icon && <span aria-hidden="true">{node.icon} </span>}
        {node.label}
      </strong>
      <span>{node.householdName || 'Standalone Sim'}</span>
      {!simple && (
        <>
          <span>
            {node.age || 'Life stage unknown'}
            {node.favorite ? ' · Favorite' : ''}
          </span>
          {world && <span>{world}</span>}
          {node.aesthetic && <span>{node.aesthetic}</span>}
        </>
      )}
    </button>
  );
});
export function RelationshipGraph({
  web,
  nodes,
  edges,
  selected,
  disabled,
  onSelect,
  onPosition,
  onView,
  onReset,
  worlds,
}: Props) {
  const canvas = useRef<HTMLDivElement>(null),
    pan = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
      null,
    ),
    [offset, setOffset] = useState({ x: 0, y: 0 });
  const view = web.view,
    nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const fit = () => {
    if (!nodes.length) return;
    const minX = Math.min(...nodes.map((n) => n.x)),
      minY = Math.min(...nodes.map((n) => n.y)),
      maxX = Math.max(...nodes.map((n) => n.x)) + 210,
      maxY = Math.max(...nodes.map((n) => n.y)) + 125;
    const rect = canvas.current?.getBoundingClientRect();
    const zoom = Math.max(
      0.2,
      Math.min(
        2,
        ((rect?.width ?? 800) - 40) / (maxX - minX),
        ((rect?.height ?? 500) - 40) / (maxY - minY),
      ),
    );
    onView({ ...view, zoom, panX: 20 - minX * zoom, panY: 20 - minY * zoom });
  };
  return (
    <section aria-label="Visual relationship graph">
      <div className="web-toolbar">
        <button
          className="secondary-button"
          disabled={disabled}
          onClick={() =>
            onView({ ...view, zoom: Math.min(3, view.zoom + 0.2) })
          }
        >
          Zoom in
        </button>
        <button
          className="secondary-button"
          disabled={disabled}
          onClick={() =>
            onView({ ...view, zoom: Math.max(0.2, view.zoom - 0.2) })
          }
        >
          Zoom out
        </button>
        <span>{Math.round(view.zoom * 100)}%</span>
        <button className="secondary-button" disabled={disabled} onClick={fit}>
          Fit graph
        </button>
        <button
          className="secondary-button"
          disabled={disabled}
          onClick={onReset}
        >
          Reset layout…
        </button>
        {(['Left', 'Right', 'Up', 'Down'] as const).map((d, i) => (
          <button
            key={d}
            className="secondary-button"
            disabled={disabled}
            aria-label={`Pan ${d.toLowerCase()}`}
            onClick={() =>
              onView({
                ...view,
                panX: view.panX + (i === 0 ? 80 : i === 1 ? -80 : 0),
                panY: view.panY + (i === 2 ? 80 : i === 3 ? -80 : 0),
              })
            }
          >
            {['←', '→', '↑', '↓'][i]}
          </button>
        ))}
      </div>
      <p className="helper-text">
        Drag cards or use their arrow keys to move them. Drag empty board space
        to pan. The list below provides all actions without dragging.
      </p>
      <div
        className="relationship-canvas"
        ref={canvas}
        onPointerDown={(e) => {
          if (disabled || e.target !== e.currentTarget) return;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          pan.current = {
            x: e.clientX,
            y: e.clientY,
            panX: view.panX,
            panY: view.panY,
          };
        }}
        onPointerMove={(e) => {
          if (pan.current)
            setOffset({
              x: e.clientX - pan.current.x,
              y: e.clientY - pan.current.y,
            });
        }}
        onPointerUp={(e) => {
          if (!pan.current) return;
          const d = pan.current;
          pan.current = null;
          setOffset({ x: 0, y: 0 });
          onView({
            ...view,
            panX: d.panX + e.clientX - d.x,
            panY: d.panY + e.clientY - d.y,
          });
        }}
        onPointerCancel={() => {
          pan.current = null;
          setOffset({ x: 0, y: 0 });
        }}
      >
        <div
          className="graph-transform"
          style={{
            transform: `translate(${view.panX + offset.x}px, ${view.panY + offset.y}px) scale(${view.zoom})`,
          }}
        >
          <svg
            className="relationship-lines"
            aria-label="Relationship connections"
          >
            {edges.map((e) => {
              const a = nodeMap.get(e.from),
                b = nodeMap.get(e.to);
              if (!a || !b) return null;
              const x1 = a.x + 105,
                y1 = a.y + 60,
                x2 = b.x + 105,
                y2 = b.y + 60,
                group = connectionGroup(e);
              return (
                <g
                  key={e.id}
                  className={`connection-line ${group.toLowerCase()} ${selected === e.id ? 'selected' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${a.label} — ${e.label} — ${b.label}`}
                  onClick={() => onSelect(e.id, true)}
                  onKeyDown={(event) => {
                    if (['Enter', ' '].includes(event.key)) {
                      event.preventDefault();
                      onSelect(e.id, true);
                    }
                  }}
                >
                  <title>
                    {a.label} — {e.label} — {b.label} · {e.status}
                  </title>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} />
                </g>
              );
            })}
          </svg>
          {nodes.map((n) => (
            <NodeCard
              key={n.id}
              node={n}
              simple={view.simplified || view.zoom < 0.6 || nodes.length > 100}
              selected={selected === n.id}
              disabled={disabled}
              world={worlds.get(n.worldId)}
              zoom={view.zoom}
              onSelect={onSelect}
              onPosition={onPosition}
            />
          ))}
          {!(view.simplified || view.zoom < 0.6 || nodes.length > 100) && (
            <svg className="relationship-labels" aria-hidden="true">
              {edges.map((e) => {
                const a = nodeMap.get(e.from),
                  b = nodeMap.get(e.to);
                if (!a || !b) return null;
                const label =
                    e.label.length > 24 ? `${e.label.slice(0, 23)}…` : e.label,
                  width = label.length * 7 + 18,
                  x = (a.x + b.x) / 2 + 105,
                  y = (a.y + b.y) / 2 + 45;
                return (
                  <g
                    className="connection-label"
                    key={e.id}
                    onClick={() => onSelect(e.id, true)}
                  >
                    <rect
                      x={x - width / 2}
                      y={y - 17}
                      width={width}
                      height={26}
                      rx={8}
                    />
                    <text textAnchor="middle" x={x} y={y}>
                      {label}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>
      <p className="graph-legend">
        Line legend: Family — solid · Romance ═ double-width · Friendship - -
        dashed · Conflict ··· dotted · Other — thin. Select a connection for
        full details.
      </p>
    </section>
  );
}
