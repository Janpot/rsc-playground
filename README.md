# rsc-playground

```
yarn install
yarn dev
```

`src/app/page.mdx` is the file to edit

data source:

- stateless object
- interface that abstracts a data collection
  - getRecords + paginate/filter/sort
  - updateRecord
  - ...
- defines roles on backend functions

data model

- stateful representation of a collection
- applies a user to the roles
- holds filtering/pagination/sorting state

=> data grid
=> chart
=> extra filters

```tsx
"use server";

const globalDataSource = createGoogleSheetSource({
  clientId: "...",
  clientSecret: process.env.GOOGLE_SECRET,
});

export default function MyPage() {
  const [filterModel, setFilterModel] = React.useState();

  const localDataSource = useLocalDataSource(globalDataSource, {
    filterModel,
  });

  const dateRangePickerProps = useDateRangeFilter({
    field: "createdAt",
    filterModel,
    setFilterModel,
  });

  return (
    <Container>
      <DateRangePicker {...datRangePickerProps} />
      <DataGrid
        dataSource={localDataSource}
        paginationMode="client"
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
      />
      <Chart dataSource={localDataSource} />
    </Container>
  );
}
```

```tsx
const dataSource = createFromPrisma(Prisma.myPrismaModel);

const dataSource = createFromPostgresql({
  connectionString: "postgres:...",
  getRows: "SELECT * from my_table",
});

const dataSource = createFromRest({
  baseUrl: 'https://my.api/'
  getRows: {
    method: 'GET',
    url: '/get/my/rows'
  },
  udpateRow: {
    // ...
  }
})

const dataSource = createFromGraphql({
  baseUrl: 'https://my.api/'
  getRows: `
    query myGqlQuery {
      ...
    }
  `
})
```
