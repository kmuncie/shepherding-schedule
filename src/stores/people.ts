// src/stores/people.ts
import { defineStore } from 'pinia';
import { reactive, markRaw } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export interface Person {
   id: string;
   name: string;
   location: string;
   role: string;
   confirmRemoval?: boolean;
}

const PEOPLE_STORAGE_KEY = 'people';

const getStoredPeople = (): Person[] => {
  const storedPeople = localStorage.getItem(PEOPLE_STORAGE_KEY);
  return storedPeople ? JSON.parse(storedPeople) : [];
};

export const usePeopleStore = defineStore('people', {
  state: () => ({
    people: reactive(getStoredPeople()),
  }),
  actions: {
    addPerson(name: string, location: string, role: string) {
      const person: Person = {
          id: uuidv4(),
          name,
          location,
          role,
      };

      this.people.push(person);
      localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(markRaw(this.people)));
    },
    deletePerson(id: string) {
      const index = this.people.findIndex((person) => person.id === id);
      if (index !== -1) {
        this.people.splice(index, 1);
        localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(markRaw(this.people)));
      }
    },
  },
});

