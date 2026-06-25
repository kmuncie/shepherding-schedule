<template>
   <span class="middle-truncate" :title="text"><span class="middle-truncate__lead">{{ lead }}</span><span v-if="tail" class="middle-truncate__tail">{{ tail }}</span></span>
</template>

<script lang="ts">
// Renders text on a single line and, when it is too wide for its container,
// truncates it with an ellipsis in the MIDDLE, keeping the last few characters
// visible (e.g. "Christ…merson"). Pure CSS, so it adapts as the container resizes.
import { defineComponent, computed } from 'vue';

// Non-breaking space (U+00A0).
const NBSP = String.fromCharCode(160);

export default defineComponent({
   name: 'MiddleTruncate',
   props: {
      text: { type: String, required: true },
      tailChars: { type: Number, default: 6 },
   },
   setup(props) {
      // The lead and tail render as two adjacent inline-flex pieces; a normal
      // space at either edge would be collapsed by the browser and visually
      // merge two words. Substitute non-breaking spaces so every space survives.
      // The hover tooltip (:title) still uses the original text with real spaces.
      const keepSpaces = (s: string) => s.replace(/ /g, NBSP);
      const split = computed(() => props.text.length > props.tailChars + 1);
      const lead = computed(() =>
         keepSpaces(
            split.value
               ? props.text.slice(0, props.text.length - props.tailChars)
               : props.text
         )
      );
      const tail = computed(() =>
         split.value ? keepSpaces(props.text.slice(props.text.length - props.tailChars)) : ''
      );
      return { lead, tail };
   },
});
</script>

<style scoped>
.middle-truncate {
   display: inline-flex;
   min-width: 0;
   max-width: 100%;
   overflow: hidden;
   vertical-align: bottom;
}

.middle-truncate__lead {
   overflow: hidden;
   text-overflow: ellipsis;
   white-space: nowrap;
}

.middle-truncate__tail {
   white-space: nowrap;
   flex: 0 0 auto;
}
</style>
