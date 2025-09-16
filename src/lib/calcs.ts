import type { Config } from "./types";

// Per official KMS site.
const STARCATCH_MULTI = 1.045;

// These are (success chance, fail chance given no success, boom chance given no success).
const PROBABILITIES: { [star: number]: [number, number, number] } = {
  0: [0.1, 0, 0],
  1: [0.1, 0, 0],
  2: [0.1, 0, 0],
  3: [0.1, 0, 0],
  4: [0.1, 0, 0],
  5: [0.1, 0, 0],
  6: [0.1, 0, 0],
  7: [0.1, 0, 0],
  8: [0.1, 0, 0],
  9: [0.1, 0, 0],
  10: [0.1, 0, 0],
  11: [0.9, 1, 0],
  12: [0.8, 1, 0],
  13: [0.7, 1, 0],
  14: [0.6, 1, 0],
  15: [0.6, 0.985, 0.015],
  16: [0.6, 0.985, 0.015],
  17: [0.6, 0.985, 0.015],
  18: [0.6, 0.98, 0.02],
  19: [0.6, 0.98, 0.02],
  20: [0.6, 0.995, 0.05],
  21: [0.6, 0.995, 0.05],
  22: [0.06, 0.9, 0.1],
  23: [0.04, 0.85, 0.15],
  24: [0.02, 0.8, 0.2],
};

// Starforce cost post-Savior.
const COST: { [star: number]: (level: number) => number } = {
  0: (level) => 100 * Math.round(10 + (level ** 3 * 1) / 2500),
  1: (level) => 100 * Math.round(10 + (level ** 3 * 2) / 2500),
  2: (level) => 100 * Math.round(10 + (level ** 3 * 3) / 2500),
  3: (level) => 100 * Math.round(10 + (level ** 3 * 4) / 2500),
  4: (level) => 100 * Math.round(10 + (level ** 3 * 5) / 2500),
  5: (level) => 100 * Math.round(10 + (level ** 3 * 6) / 2500),
  6: (level) => 100 * Math.round(10 + (level ** 3 * 7) / 2500),
  7: (level) => 100 * Math.round(10 + (level ** 3 * 8) / 2500),
  8: (level) => 100 * Math.round(10 + (level ** 3 * 9) / 2500),
  9: (level) => 100 * Math.round(10 + (level ** 3 * 10) / 2500),
  10: (level) => 100 * Math.round(10 + (level ** 3 * 11 ** 2.7) / 40000),
  11: (level) => 100 * Math.round(10 + (level ** 3 * 12 ** 2.7) / 22000),
  12: (level) => 100 * Math.round(10 + (level ** 3 * 13 ** 2.7) / 15000),
  13: (level) => 100 * Math.round(10 + (level ** 3 * 14 ** 2.7) / 11000),
  14: (level) => 100 * Math.round(10 + (level ** 3 * 15 ** 2.7) / 7500),
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
  event_one_plus_one: false,
  starcatch: [],
  mvp_discount: 0,
};

// Compile error if we add new fields to `Config` and forget to add them to `DEFAULT_VALUES` above.
(): Config => {
  return {
    item_level: 150,
    item_from_star: 12,
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
  } else if (config.safeguard && star >= 15 && star < 17) {
    c += COST[star](config.item_level);
    f = 1 - s;
    d = 0;
  } else {
    f = (1 - s) * PROBABILITIES[star][1];
    d = (1 - s) * PROBABILITIES[star][2];
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
  if (star < 15 || star - prev_checkpoint === 0) {
    return (c + d * (F + config.replacement_cost)) / s;
  } else if (star - prev_checkpoint === 1) {
    return (c + f * prior_costs[star - 1] + d * (F + config.replacement_cost)) / s;
  } else {
    const [c2, _s2, f2, d2] = cost_and_odds(config, star - 1);
    let [c3, _s3, _f3, _d3] = cost_and_odds(config, star - 2);
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
  if (star < 15 || star - prev_checkpoint === 0) {
    return (d * (1 + F)) / s;
  } else if (star - prev_checkpoint === 1) {
    return (f * prior_booms[star - 1] + d * (1 + F)) / s;
  } else {
    const [_c2, _s2, f2, d2] = cost_and_odds(config, star - 1);
    return (f * f2 * prior_booms[star - 1] + (f * d2 + d) * (1 + F)) / s;
  }
};

const prob_success_to_next = (config: Config, star: number, prior_prob_success: number[]) => {
  // Intuitively, the value we want to compute is:
  //     sum P(success from current star) * P(return to current star without booming) ^ n
  //     n = 0 to infinity
  // Because this is a geometric sum that always converges with the values we have, we easily have a
  // closed form of:
  //     P(success from current star) / (1 - P(return to current star without booming))
  const [_c, s, f, d] = cost_and_odds(config, star);

  const prev_checkpoint = Math.trunc(star / 5) * 5;
  if (star < 15 || star - prev_checkpoint === 0) {
    return s / (1 - f);
  } else if (star - prev_checkpoint === 1) {
    return s / (1 - f * prior_prob_success[star - 1]);
  } else {
    const [_c2, s2, f2, d2] = cost_and_odds(config, star - 1);
    return s / (1 - (f * s2 + f * f2 * prior_prob_success[star - 1]));
  }
};

export type Result = {
  cost: number;
  booms: number;
  prob_success: number;
};

export const expected_from_config = (config: Config): Result => {
  let cost_to_next_star: number[] = [];
  let booms_to_next_star: number[] = [];
  let prob_success_to_next_star: number[] = [];
  for (let i = 0; i < 25; i++) {
    cost_to_next_star[i] = expected_cost_to_next(config, i, cost_to_next_star);
    booms_to_next_star[i] = expected_booms_to_next(config, i, booms_to_next_star);
    prob_success_to_next_star[i] = prob_success_to_next(config, i, prob_success_to_next_star);
  }

  let cost = 0;
  let booms = 0;
  let prob_success = 1;
  for (let i = config.item_from_star; i < config.item_to_star; i++) {
    if (config.event_one_plus_one && i <= 11 && (i - config.item_from_star) % 2 === 1) {
      // Skip the cost of every other star if 1 + 1.
      continue;
    }
    cost += cost_to_next_star[i];
    booms += booms_to_next_star[i];
    prob_success *= prob_success_to_next_star[i];
  }

  return { cost, booms, prob_success };
};
