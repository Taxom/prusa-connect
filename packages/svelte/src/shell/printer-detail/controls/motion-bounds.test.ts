import { describe, expect, it } from 'vitest';

import { canMoveTo, motionBounds } from './motion-bounds';

const bed = { x: 300, y: 300, z: 330 };

describe('CORE One L jog limits', () => {
  const { travel, target } = motionBounds('COREONEL', bed);

  it('uses the firmware XY travel range, inset by 1 mm for target moves', () => {
    expect(travel.x).toEqual({ min: -2, max: 302 });
    expect(travel.y).toEqual({ min: -8, max: 300 });
    expect(target.x).toEqual({ min: -1, max: 301 });
    expect(target.y).toEqual({ min: -7, max: 299 });
  });

  it('allows movement back into the safe region after homing to Y = -7', () => {
    expect(canMoveTo(travel, target, 'y', -7, -6)).toBe(true);
    expect(canMoveTo(travel, target, 'y', -7, -7.1)).toBe(false);
    expect(canMoveTo(travel, target, 'x', 220, 219)).toBe(true);
  });

  it('allows gradual inward recovery from the firmware endstop', () => {
    expect(canMoveTo(travel, target, 'y', -8, -7.9)).toBe(true);
    expect(canMoveTo(travel, target, 'y', -8, -8)).toBe(false);
    expect(canMoveTo(travel, target, 'y', -8, -8.1)).toBe(false);
    expect(canMoveTo(travel, target, 'x', -2, -1.9)).toBe(true);
    expect(canMoveTo(travel, target, 'x', -2, -2.1)).toBe(false);
  });

  it('rejects destinations that cross the inset limits', () => {
    expect(canMoveTo(travel, target, 'x', 300, 301.1)).toBe(false);
    expect(canMoveTo(travel, target, 'y', 298, 299.1)).toBe(false);
    expect(canMoveTo(travel, target, 'y', 299.5, 299.4)).toBe(true);
    expect(canMoveTo(travel, target, 'y', 299.5, 299.6)).toBe(false);
  });

  it('leaves Z and other printers unchanged', () => {
    expect(target.z).toEqual({ min: 0, max: 330 });
    const regular = motionBounds('MK4S', { x: 250, y: 210, z: 220 });
    expect(regular.target.y).toEqual({ min: 0, max: 210 });
    expect(motionBounds('CoreOneL_INDX', bed).target.y).toEqual({
      min: 0,
      max: 300,
    });
  });
});
