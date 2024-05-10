import { useState } from 'react';

function init(meta: any) {

}

function inject() {
    const [state, setState] = useState();
    console.warn("calling from inside the snooze extension");
    return (<>
        <span style={{ color: "red" }}>error while loading something!</span>
    </>)
}

export {
    init,
    inject,
}