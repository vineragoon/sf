<script lang="ts">
  import { DEFAULT_VALUES, expected_from_config } from "./calcs";
  import type { Result } from "./calcs";
  import type { Config } from "./types";

  export let config: Config;

  const round_to = (num: number, precision: number) => {
    const factor = 10 ** precision;
    return Math.round(num * factor) / factor;
  };

  const display_cost = (num: number) => {
    if (Number.isNaN(num)) {
      return "";
    }

    const nf = Intl.NumberFormat();
    if (num < 1_000_000_000) {
      return `${nf.format(round_to(num / 1e6, 2))}m`;
    } else if (num < 1_000_000_000_000) {
      return `${nf.format(round_to(num / 1e9, 2))}b`;
    } else {
      return `${nf.format(round_to(num / 1e12, 2))}t`;
    }
  };

  const display_booms = (num: number) => {
    if (Number.isNaN(num)) {
      return "";
    }

    return round_to(num, 2);
  };

  const display_percent = (num: number) => {
    if (Number.isNaN(num)) {
      return "0%";
    }

    return `${round_to(num * 100, 1)}%`;
  };

  const to_readable_label = (key: string) => {
    switch (key) {
      case "event_thirty_off":
        return "30% off";
      case "event_five_ten":
        return "5/10/15";
      case "event_no_boom":
        return "12-15 no boom";
      case "event_one_plus_one":
        return "1+1 up to 10";
      case "mvp_discount":
        return "MVP discount";
      case "starcatch":
        return "Starcatch";
      default:
        return "programmer error";
    }
  };

  let result: Result;
  $: result = expected_from_config(config);
  let base: Result;
  $: base = expected_from_config({ ...config, ...DEFAULT_VALUES });
</script>

<output>
  <div class="header">
    <div class="summary mesos">
      <div class="description">Mesos</div>
      <div class="value">
        {display_cost(result.cost)}
        <span class="base" title="off event, no mvp discount, no starcatch">
          / {display_cost(base.cost)}
        </span>
      </div>
    </div>
    <div class="summary booms">
      <div class="description">Booms</div>
      <div class="value">
        {display_booms(result.booms)}
        <span class="base" title="off event, no mvp discount, no starcatch">
          / {display_booms(base.booms)}
        </span>
      </div>
    </div>
  </div>
</output>

<style lang="postcss">
  @tailwind utilities;

  .header {
    display: flex;
    @apply my-12;
    @apply gap-x-4;

    .summary {
      flex: 1 1 0;

      .description {
        font-weight: 500;
        @apply text-2xl;
      }

      .value {
        @apply text-7xl;
      }

      .base {
        @apply text-4xl;
      }

      &.mesos {
        @apply text-amber-400;
        text-align: left;

        .base {
          @apply text-amber-700;
        }
      }

      &.booms {
        @apply text-red-600;
        text-align: right;

        .base {
          @apply text-red-900;
        }
      }
    }
  }
</style>
