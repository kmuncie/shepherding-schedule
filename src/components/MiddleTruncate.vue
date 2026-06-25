<template>
   <span class="middle-truncate" :title="text"><span class="middle-truncate__lead">{{ lead }}</span><span v-if="tail" class="middle-truncate__tail">{{ tail }}</span></span>
</template>

<script lang="ts">
// Renders text on a single line and, when it is too wide for its container,
// truncates it with an ellipsis in the MIDDLE, keeping the last few characters
// visible (e.g. "Christ…merson"). Pure CSS, so it adapts as the container resizes.
import { defineComponent, computed } from 'vue';

export default defineComponent({
   name: 'MiddleTruncate',
   props: {
      text: { type: String, required: true },
      tailChars: { type: Number, default: 6 },
   },
   setup(props) {
      const lead = computed(() =>
         props.text.length > props.tailChars + 1
            ? props.text.slice(0, props.text.length - props.tailChars)
            : props.text
      );
      const tail = computed(() =>
         props.text.length > props.tailChars + 1
            ? props.text.slice(props.text.length - props.tailChars)
            : ''
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
