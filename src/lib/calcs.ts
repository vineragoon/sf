import type { Config } from "./types";

// Per official KMS site.
const STARCATCH_MULTI = 1.05;

// These are (success chance, fail chance given no success, boom chance given no success).
const PROBABILITIES: { [star: number]: [number, number, number] } = {
  10: [0.5, 1, 0],
  11: [0.45, 1, 0],
  12: [0.4, 0.99, 0.01],
  13: [0.35, 0.98, 0.02],
  14: [0.3, 0.98, 0.02],
  15: [0.3, 0.97, 0.03],
  16: [0.3, 0.97, 0.03],
  17: [0.3, 0.97, 0.03],
  18: [0.3, 0.96, 0.04],
  19: [0.3, 0.96, 0.04],
  20: [0.3, 0.9, 0.1],
  21: [0.3, 0.9, 0.1],
  22: [0.03, 0.8, 0.2],
  23: [0.02, 0.7, 0.3],
  24: [0.01, 0.6, 0.4],
};

// GMS starforce cost post-Destiny.
const COST: { [star: number]: (level: number) => number } = {
  10: (level) => 100 * Math.round(10 + (level ** 3 * 11 ** 2.7) / 40000),
  11: (level) => 100 * Math.round(10 + (level ** 3 * 12 ** 2.7) / 40000),
  12: (level) => 100 * Math.round(10 + (level ** 3 * 13 ** 2.7) / 40000),
  13: (level) => 100 * Math.round(10 + (level ** 3 * 14 ** 2.7) / 40000),
  14: (level) => 100 * Math.round(10 + (level ** 3 * 15 ** 2.7) / 40000),
  15: (level) => 100 * Math.round(10 + (level ** 3 * 16 ** 2.7) / 20000),
  16: (level) => 100 * Math.round(10 + (level ** 3 * 17 ** 2.7) / 20000),
  17: (level) => 100 * Math.round(10 + (level ** 3 * 18 ** 2.7) / 20000),
  18: (level) => 100 * Math.round(10 + (level ** 3 * 19 ** 2.7) / 20000),
  19: (level) => 100 * Math.round(10 + (level ** 3 * 20 ** 2.7) / 20000),
  20: (level) => 100 * Math.round(10 + (level ** 3 * 21 ** 2.7) / 20000),
  21: (level) => 100 * Math.round(10 + (level ** 3 * 22 ** 2.7) / 20000),
  22: (level) => 100 * Math.round(10 + (level ** 3 * 23 ** 2.7) / 20000),
  23: (level) => 100 * Math.round(10 + (level ** 3 * 24 ** 2.7) / 20000),
  24: (level) => 100 * Math.round(10 + (level ** 3 * 25 ** 2.7) / 20000),
};

export const DEFAULT_VALUES = {
  event_thirty_off: false,
  event_five_ten: false,
  event_no_boom: false,
  event_one_plus_one: false,
  starcatch: [],
  mvp_discount: 0,
};

// Compile error if we add new fields to `Config` and forget to add them to `DEFAULT_VALUES` above.
(): Config => {
  return {
    item_level: 150,
    item_from_star: 10,
    item_to_star: 17,
    replacement_cost: 0,
    safeguard: false,
    ...DEFAULT_VALUES,
  };
};

const cost_and_odds = (config: Config, star: number) => {
  let c = COST[star](config.item_level) * (config.event_thirty_off ? 0.7 : 1);
  if (star < 17) {
    c *= 1 - config.mvp_discount;
  }
  let s = PROBABILITIES[star][0] * (config.starcatch.includes(star) ? STARCATCH_MULTI : 1);
  let f: number, d: number;
  if (config.event_five_ten && [5, 10, 15].includes(star)) {
    s = 1;
    f = 0;
    d = 0;
  } else if (config.event_no_boom && star < 15) {
    f = 1 - s;
    d = 0;
  } else if (config.safeguard && star >= 12 && star < 17) {
    c += COST[star](config.item_level);
    f = 1 - s;
    d = 0;
  } else {
    f = (1 - s) * PROBABILITIES[star][1];
    d = (1 - s) * PROBABILITIES[star][2];
  }

  if (config.event_one_plus_one && star === 11) {
    // This one is a bit strange. If it's 1+1, then both success and failure
    // at 11 are guaranteed to get to 12. Note that, in this case, its still
    // true that `f = 1 - s`, so we're not skipping the cost from failing even
    // though `s = 1` here.
    s = 1;
  }

  return [c, s, f, d];
};

const expected_cost_to_next = (config: Config, star: number, prior_costs: number[]) => {
  const [c, s, f, d] = cost_and_odds(config, star);
  let F = 0;
  for (let i = 12; i < star; i++) {
    F += prior_costs[i];
  }

  const prev_checkpoint = Math.trunc(star / 5) * 5;
  if (star - prev_checkpoint === 0) {
    return (c + d * (F + config.replacement_cost)) / s;
  } else if (star - prev_checkpoint === 1) {
    return (c + f * prior_costs[star - 1] + d * (F + config.replacement_cost)) / s;
  } else {
    const [c2, _s2, f2, d2] = cost_and_odds(config, star - 1);
    let [c3, _s3, _f3, _d3] = cost_and_odds(config, star - 2);
    if (config.event_one_plus_one && star === 12) {
      // Failing back to 10 and chance timing gets us back up to 12
      // immediately during this event, so subtract this to offset the
      // addition later on.
      c3 -= prior_costs[star - 1];
    }
    return (
      (c +
        f * c2 +
        f * f2 * (c3 + prior_costs[star - 1]) +
        (f * d2 + d) * (F + config.replacement_cost)) /
      s
    );
  }
};

const expected_booms_to_next = (config: Config, star: number, prior_booms: number[]) => {
  const [_c, s, f, d] = cost_and_odds(config, star);
  let F = 0;
  for (let i = 12; i < star; i++) {
    F += prior_booms[i];
  }

  const prev_checkpoint = Math.trunc(star / 5) * 5;
  if (star - prev_checkpoint === 0) {
    return (d * (1 + F)) / s;
  } else if (star - prev_checkpoint === 1) {
    return (f * prior_booms[star - 1] + d * (1 + F)) / s;
  } else {
    const [_c2, _s2, f2, d2] = cost_and_odds(config, star - 1);
    let [_c3, _s3, _f3, _d3] = cost_and_odds(config, star - 2);
    return (f * f2 * prior_booms[star - 1] + (f * d2 + d) * (1 + F)) / s;
  }
};

export type Result = {
  cost: number;
  booms: number;
};

export const expected_from_config = (config: Config): Result => {
  let cost_to_next_star: number[] = [];
  let booms_to_next_star: number[] = [];
  for (let i = 10; i < 25; i++) {
    cost_to_next_star[i] = expected_cost_to_next(config, i, cost_to_next_star);
    booms_to_next_star[i] = expected_booms_to_next(config, i, booms_to_next_star);
  }

  let cost = 0;
  let booms = 0;
  for (let i = config.item_from_star; i < config.item_to_star; i++) {
    if (config.event_one_plus_one && config.item_from_star === 10 && i === 11) {
      // If we're starting at 10, we can skip 11 -> 12 in our state space.
      continue;
    }
    cost += cost_to_next_star[i];
    booms += booms_to_next_star[i];
  }

  return { cost, booms };
};
