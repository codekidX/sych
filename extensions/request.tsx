import { createRoot } from 'react-dom/client';
import type { OpenAPIV3_1 } from 'openapi-types';
import { Accordion, MantineProvider } from "@mantine/core";

function RequestComponent(props: { req: OpenAPIV3_1.PathsObject }) {
  const path = Object.keys(props.req)[0];
  const req = props.req[path]!;
  return (
    <MantineProvider>
      <Accordion variant='separated' radius='lg' defaultValue={'1'}>
        <Accordion.Item key={'1'} value='1'>
          <Accordion.Control>{path}</Accordion.Control>
          <Accordion.Panel>
            {req.get?.description}
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </MantineProvider>)
}

function ErrorComponent(props: { msg: string }) {
  return (<>
    <span style={{ color: 'red' }}>{props.msg}</span>
  </>)
}

function render(container: HTMLElement, data: string) {
  const root = createRoot(container);
  try {
    const singleRequest = JSON.parse(data) as OpenAPIV3_1.PathsObject;
    root.render(<RequestComponent req={singleRequest} />);
  } catch (e: any) {
    root.render(<ErrorComponent msg={e.message} />);
  }
}

export {
  render
}