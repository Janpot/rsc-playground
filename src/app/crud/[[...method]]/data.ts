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
  async createOne(values) {
    const newRow = { ...values, id: getNextId() };
    DATA.push(newRow);
    return newRow;
  },
  async getOne(id) {
    return DATA.find((row) => row.id === Number(id)) ?? null;
  },
  fields: [
    {
      field: "name",
    },
    {
      field: "age",
      type: "number",
    },
    {
      field: "active",
      type: "boolean",
    },
    {
      field: "lastContacted",
      label: "Last Contacted",
      type: "date",
    },
  ],
});
