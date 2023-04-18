// src/stores/people.ts
import { defineStore } from 'pinia';
import { reactive, markRaw } from 'vue';

export interface Person {
  id: string;
  name: string;
}

const PEOPLE_STORAGE_KEY = 'people';

const getStoredPeople = (): Person[] => {
  const storedPeople = localStorage.getItem(PEOPLE_STORAGE_KEY);
  return storedPeople ? JSON.parse(storedPeople) : [];
};

const generateId = (): string => {
  return `person-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
};

export const usePeopleStore = defineStore('people', {
  state: () => ({
    people: reactive(getStoredPeople()),
  }),
  actions: {
    addPerson(name: string) {
      const person: Person = {
        id: generateId(),
        name: name,
      };
      this.people.push(person);
      localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(markRaw(this.people)));
    },
    updatePerson(updatedPerson: Person) {
      const index = this.people.findIndex((person) => person.id === updatedPerson.id);
      if (index !== -1) {
        this.people[index] = updatedPerson;
        localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(markRaw(this.people)));
      }
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

