# rsc-playground

```
yarn install
yarn dev
```

`src/app/page.mdx` is the file to edit

## shared state

a dataSource is stateless, only serves as an interface that defines interaction with a backend. Many use cases require syncing the data with multiple components. e.g. a chart that renders the data from the grid, or a date range filter that is defined outside of the grid. We could create a `useSharedDataSource` to wrap an existing datasource, but which adds filter state to it.

```tsx
"use server";

const globalDataSource = createGoogleSheetSource({
  clientId: "...",
  clientSecret: process.env.GOOGLE_SECRET,
});

export default function MyPage() {
  const [filterModel, setFilterModel] = React.useState();

  const sharedDataSource = useSharedDataSource(globalDataSource, {
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
        dataSource={sharedDataSource}
        // We want the full result in the datasource for the chart, but paginate it clientside
        paginationMode="client"
        // filter that acts on the shared dataSource
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
      />
      <Chart dataSource={sharedDataSource} />
    </Container>
  );
}
```

## Other out-of-the-box data source ideas

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
