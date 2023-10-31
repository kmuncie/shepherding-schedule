import { usePeopleStore } from "@/stores/people";

export function usePeopleById() {
  const peopleStore = usePeopleStore();

  const personNameById = (id: string) => {
    const person = peopleStore.$state.people.find(
      (person) => person.id === id
    );
    return person ? person.name : "";
  };

  return {
    personNameById,
  };
}
