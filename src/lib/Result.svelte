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
    @apply flex-wrap gap-x-4 gap-y-8;

    .summary {
      flex: 1 1 auto;

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
