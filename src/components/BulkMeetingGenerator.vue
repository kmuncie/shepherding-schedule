<template>
  <q-card class="q-mb-md">
    <q-card-section>
      <div class="text-h6 q-mb-md">📅 Bulk Meeting Generator</div>

      <div class="row q-gutter-md items-end">
        <div class="col-auto">
          <q-option-group
            v-model="quarterPair"
            :options="quarterPairOptions"
            color="primary"
            inline
          />
        </div>

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

        <div class="col-auto">
          <q-btn
            @click="generate"
            color="primary"
            size="lg"
            :disable="!canGenerate"
            icon="auto_fix_high"
            label="Generate Draft"
          />
        </div>

        <div class="col-auto" v-if="draft">
          <q-btn
            @click="reoptimize"
            color="secondary"
            size="lg"
            icon="refresh"
            label="Re-optimize"
          />
        </div>
      </div>

      <div v-if="!canGenerate" class="q-mt-sm text-caption text-grey-7">
        {{ blockedReason }}
      </div>

      <!-- Draft summary -->
      <div v-if="draft" class="q-mt-md">
        <q-banner dense class="bg-grey-2">
          <span class="text-weight-medium">{{ draft.visits.length }}</span> visits ·
          <span :class="repeatCount > 0 ? 'text-orange-9' : 'text-green-9'">
            {{ repeatCount }} repeat{{ repeatCount === 1 ? '' : 's' }}
          </span>
          · load {{ loadSummary }}
          <span v-if="draft.unassigned.length" class="text-negative">
            · {{ draft.unassigned.length }} unassigned
          </span>
        </q-banner>

        <q-markup-table flat dense class="q-mt-sm">
          <thead>
            <tr>
              <th class="text-left">Person</th>
              <th class="text-left">Shepherd</th>
              <th class="text-left">Quarter</th>
              <th class="text-left">Status</th>
              <th class="text-center">Lock</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="visit in draft.visits" :key="visit.sheepId">
              <td class="text-left">{{ personNameById(visit.sheepId) }}</td>
              <td class="text-left" style="min-width: 160px">
                <q-select
                  dense
                  options-dense
                  emit-value
                  map-options
                  :model-value="visit.shepherdId"
                  :options="shepherdOptions"
                  @update:model-value="(id) => swapShepherd(visit, id)"
                />
              </td>
              <td class="text-left">Q{{ visit.quarter }}</td>
              <td class="text-left">
                <span :class="visit.reason.startsWith('Fresh') ? 'text-green-9' : 'text-orange-9'">
                  {{ visit.reason }}
                </span>
              </td>
              <td class="text-center">
                <q-btn
                  flat
                  round
                  dense
                  :icon="visit.locked ? 'lock' : 'lock_open'"
                  :color="visit.locked ? 'primary' : 'grey-5'"
                  @click="toggleLock(visit)"
                />
              </td>
            </tr>
          </tbody>
        </q-markup-table>

        <div class="q-mt-md">
          <q-btn
            @click="onCommit"
            color="positive"
            icon="event_available"
            label="Commit Schedule"
            :loading="isCommitting"
          />
          <q-btn
            flat
            class="q-ml-sm"
            color="grey"
            label="Discard Draft"
            @click="draft = null"
          />
        </div>
      </div>

      <div v-if="lastResult" class="q-mt-md">
        <q-banner :class="lastResult.success ? 'bg-positive text-white' : 'bg-negative text-white'">
          <template v-slot:avatar>
            <q-icon :name="lastResult.success ? 'check_circle' : 'error'" />
          </template>
          {{ lastResult.message }}
        </q-banner>
      </div>
    </q-card-section>
  </q-card>

  <!-- Replace-or-augment dialog when the block already has meetings -->
  <q-dialog v-model="showCommitDialog">
    <q-card style="min-width: 360px">
      <q-card-section>
        <div class="text-h6">Block already has meetings</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        {{ existingCount }} meeting{{ existingCount === 1 ? '' : 's' }} already exist for
        {{ quarterPair === 'q1-q2' ? 'Q1 & Q2' : 'Q3 & Q4' }} {{ selectedYear }}.
        Replace them with this draft, or add the draft alongside them?
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="grey" v-close-popup />
        <q-btn flat label="Add alongside" color="primary" @click="commit(false)" v-close-popup />
        <q-btn label="Replace" color="negative" @click="commit(true)" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { usePeopleStore } from '@/stores/people';
import { usePeopleById } from '@/composables/usePeopleById';
import { generateSchedule, type LockedVisit } from '@/scheduling/scheduler';
import type { ScheduleDraft, ProposedVisit } from '@/scheduling/types';

interface GenerationResult {
  success: boolean;
  message: string;
}

export default defineComponent({
  name: 'BulkMeetingGenerator',
  setup() {
    const peopleStore = usePeopleStore();
    const { personNameById } = usePeopleById();

    const quarterPair = ref('q1-q2');
    const selectedYear = ref(new Date().getFullYear() + 1);
    const draft = ref<ScheduleDraft | null>(null);
    const lastResult = ref<GenerationResult | null>(null);
    const isCommitting = ref(false);
    const showCommitDialog = ref(false);

    const quarterPairOptions = [
      { label: 'Q1 & Q2', value: 'q1-q2' },
      { label: 'Q3 & Q4', value: 'q3-q4' },
    ];

    const activePeople = computed(() =>
      peopleStore.people.filter((p) => !p.departed)
    );
    const activeShepherds = computed(() =>
      activePeople.value.filter((p) => p.role === 'shepherd')
    );
    const shepherdOptions = computed(() =>
      activeShepherds.value
        .map((s) => ({ label: s.name, value: s.id }))
        .sort((a, b) => a.label.localeCompare(b.label))
    );

    const canGenerate = computed(
      () => activePeople.value.length >= 2 && activeShepherds.value.length >= 1
    );
    const blockedReason = computed(() => {
      if (activePeople.value.length < 2) return 'Need at least 2 active people';
      if (activeShepherds.value.length < 1) return 'Need at least 1 shepherd';
      return '';
    });

    const quartersOf = (): [number, number] =>
      quarterPair.value === 'q1-q2' ? [1, 2] : [3, 4];

    const generate = () => {
      lastResult.value = null;
      draft.value = generateSchedule({
        people: peopleStore.people,
        year: selectedYear.value,
        quarters: quartersOf(),
      });
    };

    const locksFromDraft = (): LockedVisit[] => {
      if (!draft.value) return [];
      return draft.value.visits
        .filter((v) => v.locked)
        .map((v) => ({
          sheepId: v.sheepId,
          shepherdId: v.shepherdId,
          quarter: v.quarter,
        }));
    };

    const reoptimize = () => {
      lastResult.value = null;
      draft.value = generateSchedule({
        people: peopleStore.people,
        year: selectedYear.value,
        quarters: quartersOf(),
        locks: locksFromDraft(),
      });
    };

    const toggleLock = (visit: ProposedVisit) => {
      visit.locked = !visit.locked;
    };

    // Manual swap pins the choice so re-optimize keeps it.
    const swapShepherd = (visit: ProposedVisit, shepherdId: string) => {
      visit.shepherdId = shepherdId;
      visit.locked = true;
      visit.reason = 'Manual choice';
    };

    const repeatCount = computed(
      () => draft.value?.visits.filter((v) => !v.reason.startsWith('Fresh')).length ?? 0
    );

    const loadSummary = computed(() => {
      if (!draft.value) return '';
      const counts = new Map<string, number>();
      for (const v of draft.value.visits) {
        counts.set(v.shepherdId, (counts.get(v.shepherdId) ?? 0) + 1);
      }
      const values = [...counts.values()];
      if (values.length === 0) return '';
      return `${Math.min(...values)}–${Math.max(...values)} per shepherd`;
    });

    const existingCount = computed(() => {
      const [q1, q2] = quartersOf();
      const ids = new Set<string>();
      for (const person of peopleStore.people) {
        for (const m of person.meetings) {
          if (m.year === selectedYear.value && (m.quarter === q1 || m.quarter === q2)) {
            ids.add(m.id);
          }
        }
      }
      return ids.size;
    });

    const onCommit = () => {
      if (existingCount.value > 0) {
        showCommitDialog.value = true;
      } else {
        commit(false);
      }
    };

    const commit = (replace: boolean) => {
      if (!draft.value) return;
      isCommitting.value = true;
      try {
        if (replace) {
          peopleStore.removeMeetingsForBlock(selectedYear.value, quartersOf());
        }
        let created = 0;
        for (const v of draft.value.visits) {
          peopleStore.addMeeting(v.shepherdId, v.sheepId, v.quarter, v.year);
          created++;
        }
        lastResult.value = {
          success: true,
          message: `Committed ${created} meetings for ${
            quarterPair.value === 'q1-q2' ? 'Q1 & Q2' : 'Q3 & Q4'
          } ${selectedYear.value}`,
        };
        draft.value = null;
      } catch (error) {
        lastResult.value = {
          success: false,
          message: `Error committing: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        };
      } finally {
        isCommitting.value = false;
      }
    };

    return {
      quarterPair,
      quarterPairOptions,
      selectedYear,
      draft,
      lastResult,
      isCommitting,
      showCommitDialog,
      shepherdOptions,
      canGenerate,
      blockedReason,
      repeatCount,
      loadSummary,
      existingCount,
      personNameById,
      generate,
      reoptimize,
      toggleLock,
      swapShepherd,
      onCommit,
      commit,
    };
  },
});
</script>
