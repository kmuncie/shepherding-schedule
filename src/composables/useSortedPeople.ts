import { computed } from 'vue';
import { usePeopleStore } from '@/stores/people';  // Update the import path

export function useSortedPeople(role?: string) {
  const peopleStore = usePeopleStore();

  const sortedPeople = computed(() => {
    let people = peopleStore.$state.people;
    if (role) {
      people = people.filter((person) => person.role === role);
    }
    return people.slice().sort((a, b) => a.name.localeCompare(b.name));
  });

  return {
    sortedPeople
  };
}
