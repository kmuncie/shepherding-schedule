import { computed } from 'vue';
import { usePeopleStore } from '@/stores/people';

export function useSortedPeople(role?: string, sortBy?: 'name' | 'latestCompletedMeeting') {
  const peopleStore = usePeopleStore();

  const sortedPeople = computed(() => {
    let people = peopleStore.$state.people;

    if (role) {
      people = people.filter((person) => person.role === role);
    }

    return people.slice().sort((a, b) => {
      if (sortBy === 'latestCompletedMeeting') {
        const aMeeting = a.latestCompletedMeeting;
        const bMeeting = b.latestCompletedMeeting;

        if (!aMeeting && !bMeeting) return 0;
        if (!aMeeting) return 1;
        if (!bMeeting) return -1;

        const aDate = `${aMeeting.year}${String(aMeeting.quarter).padStart(2, '0')}`;
        const bDate = `${bMeeting.year}${String(bMeeting.quarter).padStart(2, '0')}`;

        return bDate.localeCompare(aDate);
      }

      // Default to sorting by name
      return a.name.localeCompare(b.name);
    });
  });

  return {
    sortedPeople
  };
}
