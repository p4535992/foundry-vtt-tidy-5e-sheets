<script lang="ts">
  import { CONSTANTS } from 'src/constants';

  export let hidden: boolean = false;
  export let rowContainerClass: string = '';
  export let rowClass: string = '';
</script>

<div
  class="tidy-table-row-container {rowContainerClass ?? ''}"
  class:hidden
  aria-hidden={hidden}
>
  <div
    class="tidy-table-row {rowClass ?? ''}"
    data-tidy-table-row
    data-tidy-sheet-part={CONSTANTS.SHEET_PARTS.TABLE_ROW}
  >
    <slot />
  </div>
</div>
