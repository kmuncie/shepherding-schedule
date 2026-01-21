import { ref } from 'vue';
import { usePeopleStore } from '@/stores/people';

const pendingDeleteId = ref<string | null>(null);
let pendingDeleteTimeout: ReturnType<typeof setTimeout> | null = null;

export function useMeetingActions() {
   const peopleStore = usePeopleStore();

   const updateMeetingCompletion = (meetingId: string, completed: boolean) => {
      peopleStore.updateMeetingCompletion(meetingId, completed);
   };

   const removeMeeting = (shepherdId: string, meetingId: string) => {
      peopleStore.removeMeeting(shepherdId, meetingId);
   };

   const reassignMeetingShepherd = (meetingId: string, newShepherdId: string) => {
      peopleStore.reassignMeetingShepherd(meetingId, newShepherdId);
   };

   const isPendingDelete = (meetingId: string) => {
      return pendingDeleteId.value === meetingId;
   };

   const confirmDeleteMeeting = (shepherdId: string, meetingId: string) => {
      if (pendingDeleteId.value === meetingId) {
         if (pendingDeleteTimeout) {
            clearTimeout(pendingDeleteTimeout);
            pendingDeleteTimeout = null;
         }
         pendingDeleteId.value = null;
         removeMeeting(shepherdId, meetingId);
      } else {
         if (pendingDeleteTimeout) {
            clearTimeout(pendingDeleteTimeout);
         }
         pendingDeleteId.value = meetingId;
         pendingDeleteTimeout = setTimeout(() => {
            pendingDeleteId.value = null;
            pendingDeleteTimeout = null;
         }, 3000);
      }
   };

   const cancelPendingDelete = () => {
      if (pendingDeleteTimeout) {
         clearTimeout(pendingDeleteTimeout);
         pendingDeleteTimeout = null;
      }
      pendingDeleteId.value = null;
   };

   return {
      updateMeetingCompletion,
      removeMeeting,
      reassignMeetingShepherd,
      isPendingDelete,
      confirmDeleteMeeting,
      cancelPendingDelete,
      pendingDeleteId
   };
}
