"use client";

import { createDataProvider } from "@/lib/dash/data";

export type Employee = {
  id: number;
  name: string;
  age: number;
  active: boolean;
  lastContacted: Date;
};

let nextId = 1;
const getNextId = () => nextId++;
const DATA: Employee[] = [
  {
    id: getNextId(),
    name: "John Doe",
    age: 25,
    active: true,
    lastContacted: new Date(),
  },
  {
    id: getNextId(),
    name: "Jane Doe",
    age: 21,
    active: false,
    lastContacted: new Date(),
  },
];

export const employees = createDataProvider<Employee>({
  async getMany({ filter }) {
    return {
      rows: DATA,
    };
  },
  async getOne(id) {
    return DATA.find((row) => row.id === Number(id)) ?? null;
  },
  async createOne(values) {
    const newRow = { ...values, id: getNextId() };
    DATA.push(newRow);
    return newRow;
  },
  async updateOne(id, values) {
    const index = DATA.findIndex((row) => row.id === Number(id));
    if (index < 0) {
      throw new Error(`Employee with id ${id} not found`);
    }

    DATA[index] = { ...DATA[index], ...values };
    return DATA[index];
  },
  async deleteOne(id) {
    const index = DATA.findIndex((row) => row.id === Number(id));
    if (index >= 0) {
      DATA.splice(index, 1);
    }
  },
  fields: {
    name: {
      label: "Name",
    },
    age: {
      label: "Age",
      type: "number",
    },
    active: {
      label: "Active",
      type: "boolean",
    },
    lastContacted: {
      label: "Last Contacted",
      type: "date",
    },
  },
});
