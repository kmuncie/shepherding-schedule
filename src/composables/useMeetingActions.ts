import { usePeopleStore } from '@/stores/people';  // Update the import path

export function useMeetingActions() {
  const peopleStore = usePeopleStore();

  const updateMeetingCompletion = (personId: string, meetingId: string, completed: boolean) => {
    peopleStore.updateMeetingCompletion(personId, meetingId, completed);
  };

  const removeMeeting = (shepherdId: string, meetingId: string) => {
    peopleStore.removeMeeting(shepherdId, meetingId);
  };

  return {
    updateMeetingCompletion,
    removeMeeting
  };
}
