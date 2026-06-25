<template>
   <div>
      <h3>Uncompleted Meetings</h3>

      <div class="row items-center q-gutter-sm q-mb-md">
         <q-btn-toggle
            v-model="currentView"
            :options="[
               { label: 'By Quarter', value: 'quarter' },
               { label: 'By Shepherd', value: 'shepherd' }
            ]"
         />
         <q-btn
            outline
            color="primary"
            :icon="copied ? 'check' : 'content_copy'"
            :label="copied ? 'Copied!' : 'Copy as text'"
            @click="copy"
         />
      </div>

      <!-- Plain text so it pastes cleanly into an email (no chips/styling). -->
      <pre class="plaintext">{{ plainText }}</pre>
   </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { usePeopleStore } from '@/stores/people';

interface Meeting {
   id: string;
   quarter: number;
   year: number;
   partnerName?: string;
   partnerLocation?: string;
}

interface Shepherd {
   id: string;
   name: string;
   uncompletedMeetings: Meeting[];
}

export default defineComponent({
   setup() {
      const peopleStore = usePeopleStore();
      const currentView = ref('quarter');
      const copied = ref(false);

      const shepherds = computed(() => {
         return peopleStore.people
            .filter((person) => person.role === 'shepherd')
            .map((shepherd) => {
               const uncompletedMeetings = shepherd.meetings
                  .filter((meeting) => !meeting.completed && meeting.shepherdId === shepherd.id)
                  .map((meeting) => {
                     const partner = peopleStore.people.find((person) => person.id === meeting.sheepId);
                     return {
                        ...meeting,
                        partnerName: partner?.name,
                        partnerLocation: partner?.location,
                     };
                  });

               return {
                  ...shepherd,
                  uncompletedMeetings,
               };
            });
      });

      const quarterKeySort = (a: string, b: string) => {
         const [aQ, aY] = a.split(' ');
         const [bQ, bY] = b.split(' ');
         return aY === bY ? aQ.localeCompare(bQ) : Number(aY) - Number(bY);
      };

      const groupedByQuarter = computed(() => {
         const grouped: { [key: string]: Shepherd[] } = {};

         shepherds.value.forEach((shepherd) => {
            shepherd.uncompletedMeetings.forEach((meeting) => {
               const quarterYear = `Q${meeting.quarter} ${meeting.year}`;
               if (!grouped[quarterYear]) {
                  grouped[quarterYear] = [];
               }
               let existingShepherd = grouped[quarterYear].find(s => s.id === shepherd.id);
               if (!existingShepherd) {
                  existingShepherd = { ...shepherd, uncompletedMeetings: [] };
                  grouped[quarterYear].push(existingShepherd);
               }
               existingShepherd.uncompletedMeetings.push(meeting);
            });
         });

         const sortedGrouped: { [key: string]: Shepherd[] } = {};
         Object.keys(grouped).sort(quarterKeySort).forEach((key) => {
            sortedGrouped[key] = grouped[key];
         });

         return sortedGrouped;
      });

      const groupedByShepherd = computed(() => {
         return shepherds.value.map(shepherd => {
            const meetingsByQuarter: { [key: string]: Meeting[] } = {};

            shepherd.uncompletedMeetings.forEach(meeting => {
               const quarterYear = `Q${meeting.quarter} ${meeting.year}`;
               if (!meetingsByQuarter[quarterYear]) {
                  meetingsByQuarter[quarterYear] = [];
               }
               meetingsByQuarter[quarterYear].push(meeting);
            });

            const sortedMeetingsByQuarter: { [key: string]: Meeting[] } = {};
            Object.keys(meetingsByQuarter).sort(quarterKeySort).forEach(quarter => {
               sortedMeetingsByQuarter[quarter] = meetingsByQuarter[quarter];
            });

            return {
               ...shepherd,
               meetingsByQuarter: sortedMeetingsByQuarter
            };
         }).filter(shepherd => Object.keys(shepherd.meetingsByQuarter).length > 0);
      });

      const partnerLine = (meeting: Meeting) => {
         const name = meeting.partnerName ?? 'Unknown';
         return meeting.partnerLocation ? `${name} (${meeting.partnerLocation})` : name;
      };

      const plainText = computed(() => {
         const lines: string[] = [];

         if (currentView.value === 'quarter') {
            const groups = groupedByQuarter.value;
            Object.keys(groups).forEach((quarterYear) => {
               lines.push(quarterYear);
               groups[quarterYear].forEach((shepherd) => {
                  lines.push(`  ${shepherd.name}:`);
                  shepherd.uncompletedMeetings.forEach((meeting) => {
                     lines.push(`    - ${partnerLine(meeting)}`);
                  });
               });
               lines.push('');
            });
         } else {
            groupedByShepherd.value.forEach((shepherd) => {
               lines.push(shepherd.name);
               Object.keys(shepherd.meetingsByQuarter).forEach((quarterYear) => {
                  lines.push(`  ${quarterYear}:`);
                  shepherd.meetingsByQuarter[quarterYear].forEach((meeting) => {
                     lines.push(`    - ${partnerLine(meeting)}`);
                  });
               });
               lines.push('');
            });
         }

         return lines.join('\n').trim() || 'No uncompleted meetings.';
      });

      const copy = async () => {
         try {
            await navigator.clipboard.writeText(plainText.value);
            copied.value = true;
            setTimeout(() => { copied.value = false; }, 2000);
         } catch {
            // Clipboard unavailable; the text is still selectable in the block.
         }
      };

      return {
         currentView,
         copied,
         plainText,
         copy,
      };
   },
});
</script>

<style scoped>
.plaintext {
   font-family: inherit;
   white-space: pre-wrap;
   word-break: break-word;
   margin: 0;
   padding: 0.75rem 1rem;
   background: #f8f9fa;
   border: 1px solid #e0e0e0;
   border-radius: 6px;
   font-size: 0.95rem;
   line-height: 1.45;
   user-select: text;
}
</style>
