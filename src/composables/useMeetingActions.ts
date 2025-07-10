import { usePeopleStore } from '@/stores/people';  // Update the import path

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

  return {
    updateMeetingCompletion,
    removeMeeting,
    reassignMeetingShepherd
  };

}
