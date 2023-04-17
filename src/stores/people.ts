// src/store/people.ts
import { defineStore } from 'pinia';

interface Person {
  id: number;
  name: string;
  role: string;
}

const PEOPLE_STORAGE_KEY = 'people';

function getStoredPeople(): Person[] {
  const storedPeople = localStorage.getItem(PEOPLE_STORAGE_KEY);
  return storedPeople ? JSON.parse(storedPeople) : [];
}

export const usePeopleStore = defineStore({
  id: 'people',

  state: () => ({
    people: getStoredPeople(),
  }),

  actions: {
    loadPeople() {
      this.people = getStoredPeople();
    },

    addPerson(person: Person) {
      this.people.push(person);
      localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(this.people));
    },

    updatePerson(updatedPerson: Person) {
      const index = this.people.findIndex((person) => person.id === updatedPerson.id);

      if (index !== -1) {
        this.people[index] = updatedPerson;
        localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(this.people));
      }
    },

    deletePerson(personId: number) {
      this.people = this.people.filter((person) => person.id !== personId);
      localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(this.people));
    },
  },
});

