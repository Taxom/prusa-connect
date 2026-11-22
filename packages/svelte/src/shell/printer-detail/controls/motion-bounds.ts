import type { Axis, Position } from './motion-coordinates';

export type AxisBounds = Readonly<
  Record<Axis, Readonly<{ min: number; max: number }>>
>;

/**
 * The build volume describes printable space, not always travel space.
 * Standard CORE One L firmware (v6.8.1, Configuration_COREONEL.h) has
 * X = [-2, 302], Y = [-8, 300] mm. Keep a 1 mm target margin.
 * The source reading may be on the actual endstop after homing, so
 * validating it against the inset target limits would strand the jogger.
 *
 * Do not apply these figures to INDX: its geometry is different.
 * Z is deliberately unchanged because its limit may come from EEPROM.
 */
export function motionBounds(
  model: string,
  volume: Position,
): { readonly travel: AxisBounds; readonly target: AxisBounds } {
  const coreOneL =
    model.toLowerCase().replace(/[^a-z0-9]/g, '') === 'coreonel';

  const travel: AxisBounds = {
    x: { min: coreOneL ? -2 : 0, max: volume.x + (coreOneL ? 2 : 0) },
    y: { min: coreOneL ? -8 : 0, max: volume.y },
    z: { min: 0, max: volume.z },
  };
  const target: AxisBounds = {
    x: { min: coreOneL ? -1 : 0, max: volume.x + (coreOneL ? 1 : 0) },
    y: { min: coreOneL ? -7 : 0, max: volume.y - (coreOneL ? 1 : 0) },
    z: { min: 0, max: volume.z },
  };

  return { travel, target };
}

export const inAxisBounds = (
  bounds: AxisBounds,
  axis: Axis,
  value: number | undefined,
): boolean =>
  value !== undefined &&
  Number.isFinite(value) &&
  value >= bounds[axis].min &&
  value <= bounds[axis].max;

/** Check a destination, including safe inward recovery from an endstop. */
export function canMoveTo(
  travel: AxisBounds,
  target: AxisBounds,
  axis: Axis,
  from: number | undefined,
  to: number,
): boolean {
  if (
    !inAxisBounds(travel, axis, from) ||
    !Number.isFinite(to) ||
    !inAxisBounds(travel, axis, to)
  ) return false;

  if (inAxisBounds(target, axis, to)) return true;
  const { min, max } = target[axis];
  return (from! < min && to > from! && to < min) ||
    (from! > max && to < from! && to > max);
}
