// src/stores/people.ts
import { defineStore } from 'pinia';
import { reactive, markRaw } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export interface Meeting {
  id: string;
  partnerId: string;
  quarter: number;
  year: number;
  completed: boolean;
}

export interface Person {
  id: string;
  name: string;
  location: string;
  role: string;
  confirmRemoval?: boolean;
  meetings: Meeting[];
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
          meetings: [],
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
    addMeeting(personId: string, partnerId: string, quarter: number, year: number) {
      const meeting: Meeting = {
        id: uuidv4(),
        partnerId,
        quarter,
        year,
        completed: false,
      };
  
      const person = this.people.find((p) => p.id === personId);
      if (person) {
        person.meetings.push(meeting);
        localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(markRaw(this.people)));
      }
    },
    updateMeetingCompletion(personId: string, meetingId: string, completed: boolean) {
      const person = this.people.find((p) => p.id === personId);
      const meeting = person?.meetings.find((m) => m.id === meetingId);
      if (meeting) {
        meeting.completed = completed;
        localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(markRaw(this.people)));
      }
    },
    exportPeopleData() {
      const data = JSON.stringify(markRaw(this.people));
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      return url;
    },
    importPeopleData(file: File) {
      const reader = new FileReader();
      reader.onload = () => {
        const data = JSON.parse(reader.result as string);
        this.people = reactive(data);
        localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(markRaw(this.people)));
      };
      reader.readAsText(file);
    },    
  },
});

