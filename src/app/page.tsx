import { Container } from "./muiMaterialClient";
import HelloWorld from "./page.mdx";

export default function Home() {
  return (
    <Container sx={{ pt: 5 }}>
      <HelloWorld />
    </Container>
  );
}
