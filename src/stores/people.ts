// src/stores/people.ts
import { defineStore } from "pinia";
import { reactive, markRaw } from "vue";
import { v4 as uuidv4 } from "uuid";

export interface Meeting {
   id: string;
   shepherdId: string;
   sheepId: string;
   quarter: number;
   year: number;
   completed: boolean;
   completedDate?: string;
}

export interface Person {
   id: string;
   name: string;
   location: string;
   role: string;
   confirmRemoval?: boolean;
   meetings: Meeting[];
   latestCompletedMeeting?: Meeting;
}

const PEOPLE_STORAGE_KEY = "people";

const getStoredPeople = (): Person[] => {
   const storedPeople = localStorage.getItem(PEOPLE_STORAGE_KEY);
   return storedPeople ? JSON.parse(storedPeople) : [];
};

// This helper function will update 'latestCompletedMeeting' for a given person
function updateLatestCompletedMeeting(person: Person) {
   const completedMeetings = person.meetings.filter((m) => m.completed);

   // If there are no completed meetings, set latestCompletedMeeting to null
   if (completedMeetings.length === 0) {
      person.latestCompletedMeeting = undefined;
      return;
   }
   // Sort the completed meetings by completedDate
   const sortedCompletedMeetings = completedMeetings.sort(
      (a, b) =>
         new Date(b.completedDate!).getTime() -
         new Date(a.completedDate!).getTime()
   );

   // Update the latestCompletedMeeting to the one with the most recent completedDate
   person.latestCompletedMeeting = sortedCompletedMeetings[0];
}

export const usePeopleStore = defineStore("people", {
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
         localStorage.setItem(
            PEOPLE_STORAGE_KEY,
            JSON.stringify(markRaw(this.people))
         );
      },
      deletePerson(id: string) {
         const index = this.people.findIndex((person) => person.id === id);
         if (index !== -1) {
            this.people.splice(index, 1);
            localStorage.setItem(
               PEOPLE_STORAGE_KEY,
               JSON.stringify(markRaw(this.people))
            );
         }
      },
      addMeeting(
         shepherdId: string,
         sheepId: string,
         quarter: number,
         year: number
      ) {
         const meeting: Meeting = {
            id: uuidv4(),
            shepherdId,
            sheepId,
            quarter,
            year,
            completed: false,
         };

         const shepherd = this.people.find(
            (person) => person.id === shepherdId
         );
         const sheep = this.people.find((person) => person.id === sheepId);

         if (shepherd && sheep) {
            if (!shepherd.meetings) {
               shepherd.meetings = [];
            }
            if (!sheep.meetings) {
               sheep.meetings = [];
            }

            shepherd.meetings.push(meeting);
            sheep.meetings.push(meeting);

            localStorage.setItem(
               PEOPLE_STORAGE_KEY,
               JSON.stringify(markRaw(this.people))
            );
         }
      },
      removeMeeting(shepherdId: string, meetingId: string) {
         const shepherd = this.people.find(
            (person) => person.id === shepherdId
         );
         let meeting: Meeting | undefined;
         let sheepId: string | undefined;

         if (shepherd) {
            meeting = shepherd.meetings.find((m) => m.id === meetingId);
            if (meeting) {
               sheepId = meeting.sheepId;
            }
         }

         const sheep = this.people.find((person) => person.id === sheepId);

         if (shepherd && meeting) {
            shepherd.meetings = shepherd.meetings.filter(
               (m) => m.id !== meetingId
            );
            updateLatestCompletedMeeting(shepherd);
         }
         if (sheep && meeting) {
            sheep.meetings = sheep.meetings.filter((m) => m.id !== meetingId);
            updateLatestCompletedMeeting(sheep);
         }

         // Save updated state to local storage
         localStorage.setItem("people", JSON.stringify(this.people));
      },
      updateMeetingCompletion(
         shepherdId: string,
         meetingId: string,
         completed: boolean
      ) {
         const currentDate = new Date().toISOString();

         const relevantPeople = this.people.filter((person) =>
            person.meetings.some((m) => m.id === meetingId)
         );

         relevantPeople.forEach((person) => {
            const meeting = person.meetings.find((m) => m.id === meetingId);

            if (meeting) {
               meeting.completed = completed;

               if (completed) {
                  meeting.completedDate = currentDate;
               }
            }

            // Filter only completed meetings where the person is a sheep.
            const completedMeetings = person.meetings
               .filter((m) => m.completed && m.sheepId === person.id)
               .sort(
                  (a, b) =>
                     new Date(b.completedDate || "").getTime() -
                     new Date(a.completedDate || "").getTime()
               );

               if (completedMeetings.length > 0) {
                  console.log(`Setting latestCompletedMeeting for sheep ${person.id}`);
                  person.latestCompletedMeeting = completedMeetings[0];
              } else {
                  console.log(`Unsetting latestCompletedMeeting for sheep ${person.id}`);
                  person.latestCompletedMeeting = undefined;
              }

         });

         localStorage.setItem(
            PEOPLE_STORAGE_KEY,
            JSON.stringify(markRaw(this.people))
         );
      },
      exportPeopleData() {
         const data = JSON.stringify(markRaw(this.people));
         const blob = new Blob([data], { type: "application/json" });
         const url = URL.createObjectURL(blob);
         return url;
      },
      importPeopleData(file: File) {
         const reader = new FileReader();
         reader.onload = () => {
            const data = JSON.parse(reader.result as string);
            this.people = reactive(data);
            localStorage.setItem(
               PEOPLE_STORAGE_KEY,
               JSON.stringify(markRaw(this.people))
            );
         };
         reader.readAsText(file);
      },
      clearPeopleData() {
         this.people = [];
         localStorage.removeItem(PEOPLE_STORAGE_KEY);
      },
   },
});
