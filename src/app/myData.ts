import { faker } from "@faker-js/faker";
import {
  Collection,
  DeleteRowParams,
  ListRowsParams,
  UpdateRowParams,
} from "./types";

function createRandomUser() {
  return {
    id: faker.datatype.uuid(),
    username: faker.internet.userName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    password: faker.internet.password(),
    birthday: faker.date.birthdate(),
    registeredAt: faker.date.past(),
  };
}

type User = ReturnType<typeof createRandomUser>;

let USERS: User[] = [];

for (let i = 0; i <= 100000; i += 1) {
  USERS.push(createRandomUser());
}

const collator = new Intl.Collator();

async function listRows({
  page = 0,
  pageSize = 10,
  order,
}: ListRowsParams<User>) {
  "use server";

  const sorted =
    order.length > 0
      ? [...USERS].sort((a, b) => {
          const { field, sort } = order[0];
          const [left, right] = sort === "asc" ? [a, b] : [b, a];
          const leftField = left[field];
          const rightField = right[field];
          return collator.compare(leftField, rightField);
        })
      : USERS;

  const start = page * pageSize;
  const end = (page + 1) * pageSize;

  return {
    rows: sorted.slice(start, end),
  };
}

async function updateRow({ id, values }: UpdateRowParams<User>) {
  "use server";
  const user = USERS.find((user) => user.id === id);
  if (!user) {
    throw new Error(`Row "${id}" doesn't exist`);
  }
  Object.assign(user, values);
}

async function deleteRow({ id }: DeleteRowParams<User>) {
  "use server";
  const index = USERS.findIndex((user) => user.id === id);
  USERS.splice(index, 1);
}

export default {
  columns: [
    { field: "username", editable: true },
    { field: "email", editable: true },
    { field: "avatar", editable: true },
    {
      field: "birthday",
      editable: true,
      type: "date",
    },
    {
      field: "registeredAt",
      editable: true,
      type: "date",
    },
  ],
  list: listRows,
  update: updateRow,
  delete: deleteRow,
} satisfies Collection<User>;
