"use client";

import React from "react";
import { createDataProvider } from "@/lib/dash/data";
import { CrudPage } from "@/lib/dash/CrudPage";

type Employee = {
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

const employees = createDataProvider<Employee>({
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
      type: "date",
    },
  ],
});

export default function Page() {
  return <CrudPage dataProvider={employees} />;
}
