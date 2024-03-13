"use client";

import React from "react";
import { CrudPage } from "@/lib/dash/CrudPage";
import { employees } from "./data";

export default function Page() {
  return <CrudPage dataProvider={employees} />;
}
