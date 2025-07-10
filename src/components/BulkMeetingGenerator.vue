<template>
  <q-card class="q-mb-md">
    <q-card-section>
      <div class="text-h6 q-mb-md">📅 Bulk Meeting Generator</div>

      <div class="row q-gutter-md items-end">
        <!-- Quarter Pair Selection -->
        <div class="col-auto">
          <q-option-group
            v-model="quarterPair"
            :options="quarterPairOptions"
            color="primary"
            inline
          />
        </div>

        <!-- Year Input -->
        <div class="col-auto">
          <q-input
            v-model.number="selectedYear"
            type="number"
            :min="new Date().getFullYear()"
            step="1"
            label="Year"
            style="width: 100px"
          />
        </div>

        <!-- Generate Button -->
        <div class="col-auto">
          <q-btn
            @click="showConfirmDialog = true"
            color="primary"
            size="lg"
            :disable="!canGenerate"
            icon="event"
            label="Generate Meetings"
          />
        </div>
      </div>

      <!-- Preview Summary -->
      <div v-if="previewSummary" class="q-mt-md text-caption text-grey-7">
        {{ previewSummary }}
      </div>

      <!-- Results Display -->
      <div v-if="lastResult" class="q-mt-md">
        <q-banner :class="lastResult.success ? 'bg-positive text-white' : 'bg-negative text-white'">
          <template v-slot:avatar>
            <q-icon :name="lastResult.success ? 'check_circle' : 'error'" />
          </template>
          {{ lastResult.message }}
        </q-banner>
      </div>

      <!-- Generation Log Table -->
      <div v-if="generationLog.length" class="q-mt-md">
        <q-btn
          flat
          color="primary"
          :icon="showLog ? 'expand_less' : 'expand_more'"
          @click="showLog = !showLog"
          class="q-mb-sm"
        >
          {{ showLog ? 'Hide Log' : 'Show Log' }}
        </q-btn>
        <q-slide-transition>
          <div v-show="showLog">
            <q-table
              :rows="generationLog"
              :columns="[
                { name: 'person', label: 'Person', field: 'person', align: 'left' },
                { name: 'shepherd', label: 'Shepherd', field: 'shepherd', align: 'left' },
                { name: 'quarter', label: 'Quarter', field: 'quarter', align: 'left' },
                { name: 'year', label: 'Year', field: 'year', align: 'left' }
              ]"
              row-key="person+quarter+year"
              flat
              dense
              hide-bottom
              :pagination="{ rowsPerPage: 0 }"
            />
          </div>
        </q-slide-transition>
      </div>
    </q-card-section>
  </q-card>

  <!-- Confirmation Dialog -->
  <q-dialog v-model="showConfirmDialog">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Confirm Meeting Generation</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        {{ confirmationMessage }}
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="grey" v-close-popup />
        <q-btn
          @click="generateMeetings"
          label="Generate"
          color="primary"
          v-close-popup
          :loading="isGenerating"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { usePeopleStore, type Person } from '@/stores/people';

interface GenerationResult {
  success: boolean;
  message: string;
}

export default defineComponent({
  name: 'BulkMeetingGenerator',
  setup() {
  const showLog = ref(true);
    const peopleStore = usePeopleStore();
    const quarterPair = ref('q1-q2');
    const selectedYear = ref(new Date().getFullYear() + 1);
    const showConfirmDialog = ref(false);
    const isGenerating = ref(false);
    const lastResult = ref<GenerationResult | null>(null);
  // Log of generated meetings for user verification
  const generationLog = ref<Array<{ person: string; shepherd: string; quarter: number; year: number }>>([]);

    const quarterPairOptions = [
      { label: 'Q1 & Q2', value: 'q1-q2' },
      { label: 'Q3 & Q4', value: 'q3-q4' }
    ];

    const activePeople = computed(() =>
      peopleStore.people.filter(p => !p.departed)
    );

    const availableShepherds = computed(() =>
      activePeople.value.filter(p => p.role === 'shepherd')
    );

    const canGenerate = computed(() =>
      activePeople.value.length >= 2 &&
      availableShepherds.value.length >= 1 &&
      selectedYear.value >= new Date().getFullYear()
    );

    const previewSummary = computed(() => {
      if (!canGenerate.value) {
        if (activePeople.value.length < 2) return 'Need at least 2 active people';
        if (availableShepherds.value.length < 1) return 'Need at least 1 shepherd';
        return '';
      }

      const quarters = quarterPair.value === 'q1-q2' ? 'Q1 & Q2' : 'Q3 & Q4';
      return `Will create ${activePeople.value.length} meetings for ${quarters} ${selectedYear.value}`;
    });

    const confirmationMessage = computed(() => {
      const quarters = quarterPair.value === 'q1-q2' ? 'Q1 & Q2' : 'Q3 & Q4';
      return `Generate ${activePeople.value.length} meetings for ${quarters} ${selectedYear.value}?

This will assign each active person to exactly one meeting, evenly distributed between the two quarters.`;
    });

    // Build shepherd history map: personId -> Set of shepherdIds who've shepherded them
    const getShepherdHistory = (person: Person): Set<string> => {
      return new Set(
        person.meetings
          .filter(m => m.sheepId === person.id && m.completed)
          .map(m => m.shepherdId)
      );
    };

    // Shuffle array using Fisher-Yates algorithm
    const shuffleArray = (array: any[]): any[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    // Find best shepherd for a person, avoiding previous shepherds if possible
    const findBestShepherd = (person: Person, shepherdHistory: Set<string>, shepherdAssignmentCounts: Map<string, number>): string | null => {
      // Get shepherds who haven't shepherded this person before
      const newShepherds = availableShepherds.value.filter(s =>
        s.id !== person.id && !shepherdHistory.has(s.id)
      );

      let candidateShepherds = newShepherds.length > 0 ? newShepherds :
        availableShepherds.value.filter(s => s.id !== person.id);

      if (candidateShepherds.length === 0) return null;

      // Sort by fewest assignments in this generation, then randomly
      candidateShepherds.sort((a, b) => {
        const aCount = shepherdAssignmentCounts.get(a.id) || 0;
        const bCount = shepherdAssignmentCounts.get(b.id) || 0;
        if (aCount !== bCount) return aCount - bCount;
        return Math.random() - 0.5; // Random tiebreaker
      });

      return candidateShepherds[0].id;
    };

    const generateMeetings = async () => {
      isGenerating.value = true;
      lastResult.value = null;

      try {
        const quarters = quarterPair.value === 'q1-q2' ? [1, 2] : [3, 4];
        const shuffledPeople = shuffleArray(activePeople.value);

        // Split people evenly between quarters
        const halfPoint = Math.ceil(shuffledPeople.length / 2);
        const q1People = shuffledPeople.slice(0, halfPoint);
        const q2People = shuffledPeople.slice(halfPoint);

        const quarterAssignments = [
          { quarter: quarters[0], people: q1People },
          { quarter: quarters[1], people: q2People }
        ];

        let meetingsCreated = 0;
        let failedAssignments = 0;
        const shepherdAssignmentCounts = new Map<string, number>();

        // Clear previous log
        generationLog.value = [];

        // Generate meetings for each quarter
        for (const assignment of quarterAssignments) {
          for (const person of assignment.people) {
            const shepherdHistory = getShepherdHistory(person);
            const shepherdId = findBestShepherd(person, shepherdHistory, shepherdAssignmentCounts);

            if (shepherdId) {
              peopleStore.addMeeting(
                shepherdId,
                person.id,
                assignment.quarter,
                selectedYear.value
              );

              // Add to generation log
              const shepherd = availableShepherds.value.find(s => s.id === shepherdId);
              generationLog.value.push({
                person: person.name,
                shepherd: shepherd ? shepherd.name : shepherdId,
                quarter: assignment.quarter,
                year: selectedYear.value
              });

              // Update shepherd assignment count
              shepherdAssignmentCounts.set(
                shepherdId,
                (shepherdAssignmentCounts.get(shepherdId) || 0) + 1
              );

              meetingsCreated++;
            } else {
              failedAssignments++;
            }
          }
        }

        // Show results
        if (failedAssignments === 0) {
          lastResult.value = {
            success: true,
            message: `Successfully created ${meetingsCreated} meetings for ${quarterPair.value === 'q1-q2' ? 'Q1 & Q2' : 'Q3 & Q4'} ${selectedYear.value}`
          };
        } else {
          lastResult.value = {
            success: false,
            message: `Created ${meetingsCreated} meetings, but ${failedAssignments} assignments failed (no available shepherds)`
          };
        }

      } catch (error) {
        lastResult.value = {
          success: false,
          message: `Error generating meetings: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      } finally {
        isGenerating.value = false;
      }
    };

    return {
      quarterPair,
      quarterPairOptions,
      selectedYear,
      canGenerate,
      previewSummary,
      confirmationMessage,
      showConfirmDialog,
      isGenerating,
      lastResult,
      generateMeetings,
      activePeople,
      availableShepherds,
      generationLog,
      showLog
    };
  }
});
</script>
