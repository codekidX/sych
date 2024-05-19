import { createRoot } from 'react-dom/client';
import { type OpenAPIV3_1 } from 'openapi-types';
import { Accordion, Button, Group, Input, MantineProvider, NativeSelect, Pill, TextInput } from "@mantine/core";
import { useForm } from '@mantine/form';
import { useState } from 'react';

function capitalize(a: string): string {
  return a.charAt(0).toUpperCase() + a.slice(1);
}

function RequestComponent(props: { req: OpenAPIV3_1.PathsObject }) {

  // FIXME: ideally: we should not pick the first object and process it, we should
  // process all the keys inside the path object
  const path = Object.keys(props.req)[0];
  const req = props.req[path]!;
  const method = Object.keys(req)[0];
  let pathItemObject: OpenAPIV3_1.OperationObject | undefined;
  switch (method) {
    case "get":
      pathItemObject = req.get!;
      break;
    case "post":
      pathItemObject = req.post!;
      break;
    case "put":
      pathItemObject = req.put!;
      break;
    case "delete":
      pathItemObject = req.delete!;
      break;
    case "patch":
      pathItemObject = req.patch!;
      break;
    default:
      break;
  }


  let reqbody = pathItemObject?.requestBody as OpenAPIV3_1.RequestBodyObject;

  // FIXME: here also there can be multiple media bodies
  const mediakey = Object.keys(reqbody.content).at(0)!;
  const media = reqbody.content[mediakey];
  const schema = media.schema as OpenAPIV3_1.SchemaObject;

  const fields: any = {};
  const validation: any = {};
  const formFields = [];
  switch (schema.type) {
    case "object":
      for (const prop of Object.keys(schema.properties as OpenAPIV3_1.SchemaObject)) {
        fields[prop] = '';

        const ff = {
          name: prop,
          description: schema.properties![prop]?.description, // TODO: proper null check here
          type: schema.type,
          isRequired: schema.required?.includes(prop),
        };
        formFields.push(ff);

        if (ff.isRequired) {
          validation[ff.name] = (value: string) => value.length > 0 ? null : `${ff.name} is required`
        }
      }
      break;
    default:
      break;
  }

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: fields,
    validate: validation
  });

  const [selectedServer, setServer] = useState(pathItemObject?.servers?.at(0));


  const startFetching = async (payload: any) => {
    switch (method) {
      // TODO: support other methods
      case 'get':
      default:
        switch (media) {
          // TODO: support other medias
          default:
            const params = new URLSearchParams();
            for (let key in payload) { params.set(key, payload[key]) }
            fetch(`${selectedServer}${path}?${params.toString}`)
        }
    }
  };

  // TODO: hardcoded value of 1 accordian to be fixed
  return (
    <MantineProvider>
      <Accordion variant='separated' radius='lg' defaultValue={'1'}>
        <Accordion.Item key={'1'} value='1'>
          <Accordion.Control>
            <Pill>{method}</Pill> {path}

            <div style={{ margin: '1em' }}>
              {pathItemObject?.servers?.length && <NativeSelect
                value={selectedServer?.url}
                data={pathItemObject?.servers?.map(s => s.url)}
              />}
            </div>
          </Accordion.Control>
          <Accordion.Panel>
            {pathItemObject?.description}

            <div style={{ padding: '1em' }}>
              <form onSubmit={form.onSubmit(async (values) => { startFetching(values) })}>
                {formFields.map(ff => <TextInput
                  withAsterisk={ff.isRequired}
                  label={capitalize(ff.name)}
                  placeholder={ff.description}
                  key={form.key(ff.name)}
                  {...form.getInputProps(ff.name)}
                />)}

                <Group justify="flex-end" mt="md">
                  <Button type='submit'>Send</Button>
                </Group>
              </form>
            </div>


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