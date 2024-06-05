import { createRoot } from 'react-dom/client';
import { type OpenAPIV3_1 } from 'openapi-types';
import {
  Accordion,
  Badge,
  Select,
} from "flowbite-react";
import { useState } from 'react';

function capitalize(a: string): string {
  return a.charAt(0).toUpperCase() + a.slice(1);
}

interface FormObject {
  name: string,
  description: string | undefined,
  type: string,
  isRequired: boolean | undefined
  in: string
}

/**
 * gets parameters for an API like headers, path param or query
 * 
 * @param pathItem the main root object of the API
 * @param fieldsRef received object by reference for storing default field values
 * @param validationRef received object by reference for storing field validations
 * @returns array of FieldObject
 */
function getParamFields(pathItem: OpenAPIV3_1.OperationObject, fieldsRef: any, validationRef: any): FormObject[] {
  let formFields: FormObject[] = [];
  if (!pathItem.parameters) return formFields;

  for (let param of pathItem.parameters as OpenAPIV3_1.ParameterObject[]) {
    fieldsRef[param.name] = ""
    const ff = {
      name: param.name,
      description: param.description,
      type: 'string',
      isRequired: param.required,
      in: param.in
    };
    formFields.push(ff);

    if (ff.isRequired) {
      validationRef[ff.name] = (value: string) => value.length > 0 ? null : `${ff.name} is required`
    }
  }

  return formFields;
}


/**
 * gets request body of the API.
 * 
 *  ```FIXME: it should also return the media and media-type for use while making
 * API request.```
 * 
 * @param pathItem the main root object of the API
 * @param fieldsRef received object by reference for storing default field values
 * @param validationRef received object by reference for storing field validations
 * @returns array of FieldObject
 */
function getBodyFields(pathItem: OpenAPIV3_1.OperationObject, fieldsRef: any, validationRef: any): FormObject[] {
  let formFields: FormObject[] = [];
  if (!pathItem.requestBody) return formFields;


  let reqbody = pathItem.requestBody as OpenAPIV3_1.RequestBodyObject;

  // FIXME: here also there can be multiple media bodies
  const mediakey = Object.keys(reqbody.content).at(0)!;
  const media = reqbody.content[mediakey];
  const schema = media.schema as OpenAPIV3_1.SchemaObject;

  switch (schema.type) {
    case "object":
      for (const prop of Object.keys(schema.properties as OpenAPIV3_1.SchemaObject)) {
        fieldsRef[prop] = '';

        const ff = {
          name: prop,
          description: schema.properties![prop]?.description, // TODO: proper null check here
          type: schema.type,
          isRequired: schema.required?.includes(prop),
          in: 'body'
        };
        formFields.push(ff);

        if (ff.isRequired) {
          validationRef[ff.name] = (value: string) => value.length > 0 ? null : `${ff.name} is required`
        }
      }
      break;
    // TODO: case "array":
    default:
      break;
  }

  return formFields;
}

function FormLabelComponent(props: { name: string, in: string, isRequired: boolean | undefined }) {
  return (<p>
    {props.name}
    <span style={{ fontSize: '10px' }}>
      <i>({props.in})</i>
      {props.isRequired && <span style={{ color: 'red' }}>*</span>}
    </span>
  </p>)
}

function RequestComponent(props: { req: OpenAPIV3_1.PathsObject }) {
  const formFields: FormObject[] = [];

  // FIXME: ideally: we should not pick the first object and process it, we should
  // process all the keys inside the path object
  const path = Object.keys(props.req)[0];
  const req = props.req[path]!;
  const method = Object.keys(req)[0];
  let pathItemObject: OpenAPIV3_1.OperationObject;
  let bgColor = 'warning';
  switch (method) {
    case "get":
      pathItemObject = req.get!;
      break;
    case "post":
      bgColor = 'pink';
      pathItemObject = req.post!;
      break;
    case "put":
      bgColor = 'success';
      pathItemObject = req.put!;
      break;
    case "delete":
      bgColor = 'failure';
      pathItemObject = req.delete!;
      break;
    case "patch":
      bgColor = 'purple';
      pathItemObject = req.patch!;
      break;
    default:
      return <ErrorComponent msg='unknown HTTP method' />
  }

  let fields = {},
    validation = {};
  // these are non-body inputs, like headers, params and query
  const paramFields = getParamFields(pathItemObject, fields, validation);
  formFields.push(...paramFields);

  const bodyFields = getBodyFields(pathItemObject, fields, validation);
  formFields.push(...bodyFields);


  const [selectedServer, setServer] = useState(pathItemObject?.servers?.at(0)?.url);
  const [response, setResponse] = useState("");

  const startFetching = async (payload: any) => {
    // TODO: remove this!!
    let media = {};
    switch (method) {
      // TODO: support other methods
      case 'get':
      default:
        switch (media) {
          // TODO: support other medias
          default:
            const params = new URLSearchParams();
            for (let key in payload) { params.set(key, payload[key]) }
            let res = await fetch(`${selectedServer}${path}?${params.toString}`);
            if (!pathItemObject?.responses) {
              // assume that response is a JSON one
              res = await res.json();
              let displayRes = JSON.stringify(res, null, 2);
              setResponse(displayRes);
              return;
            }

            res = await res.json();
            let displayRes = JSON.stringify(res, null, 2);
            setResponse(displayRes);
          // let responseCodes = Object.keys(pathItemObject?.responses).map(r => Number(r));
        }
    }
  };

  // TODO: hardcoded value of 1 accordian to be fixed
  return (
    <>
      <Accordion collapseAll>
        <Accordion.Panel>
          <Accordion.Title>
            <div className="flex flex-wrap gap-2">
              <Badge color={bgColor}>{method}</Badge> <code>{path}</code>
            </div>

          </Accordion.Title>

          <Accordion.Content>
            <div className="max-w-md">
              <div className="mb-2 block">
              </div>
              <Select id="servers" required>
                {pathItemObject?.servers?.length && pathItemObject?.servers?.map(s => <option>{s.url}</option>)}
              </Select>
            </div>

            {pathItemObject?.description}

            <div style={{ padding: '1em' }}>

            </div>


            {response != "" ? <pre style={{ maxHeight: '200px', overflow: 'scroll' }}>
              {response}
            </pre> : <></>}
          </Accordion.Content>

        </Accordion.Panel>
      </Accordion>
    </>)
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