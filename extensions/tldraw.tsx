import { useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DefaultMainMenu, Editor, Tldraw, TldrawUiMenuGroup, TldrawUiMenuItem, createTLStore, defaultShapeUtils, throttle, type StoreSnapshot, type TLComponents, type TLRecord, type TLUiEventSource } from 'tldraw';

type TLUiMenuSelectFn = (source: TLUiEventSource) => Promise<void> | void;

async function copyClipboard(drawData: string) {
    await navigator.clipboard.writeText(drawData);

}

// There's a guide at the bottom of this file!

const PERSISTENCE_KEY = 'example-3'

export default function DrawingComponent(props: { initialData: string }) {
    let drawingSnapshot = props.initialData;
    //[1]
    const [store] = useState(() => createTLStore({ shapeUtils: defaultShapeUtils }))
    //[2]
    const [loadingState, setLoadingState] = useState<
        { status: 'loading' } | { status: 'ready' } | { status: 'error'; error: string }
    >({
        status: 'loading',
    })
    //[3]
    useLayoutEffect(() => {
        setLoadingState({ status: 'loading' })

        // Get persisted data from local storage
        if (drawingSnapshot != "") {
            try {
                const snapshot = JSON.parse(drawingSnapshot)
                store.loadSnapshot(snapshot)
                setLoadingState({ status: 'ready' })
            } catch (error: any) {
                setLoadingState({ status: 'error', error: error.message }) // Something went wrong
            }
        } else {
            setLoadingState({ status: 'ready' }) // Nothing persisted, continue with the empty store
        }

        // Each time the store changes, run the (debounced) persist function
        const cleanupFn = store.listen(
            throttle(() => {
                drawingSnapshot = JSON.stringify(store.getSnapshot());
            }, 500)
        )

        return () => {
            cleanupFn()
        }
    }, [store])

    // [4]
    if (loadingState.status === 'loading') {
        return (
            <div className="tldraw__editor">
                <h2>Loading...</h2>
            </div>
        )
    }

    if (loadingState.status === 'error') {
        return (
            <div className="tldraw__editor">
                <h2>Error!</h2>
                <p>{loadingState.error}</p>
            </div>
        )
    }

    const selectFn: TLUiMenuSelectFn = async () => {
        await copyClipboard(JSON.stringify(store.getSnapshot()));
        alert("copied data to clipboard. paste it inside your markdown file");
    };

    let isReadOnly = true;
    let ed: Editor;
    const selectToggleFn: TLUiMenuSelectFn = async () => {
        isReadOnly = !isReadOnly;
        ed?.updateInstanceState({ isReadonly: isReadOnly });
    };

    const CustomMainMenu = function () {
        return (
            <DefaultMainMenu>
                <div>
                    <TldrawUiMenuGroup id="example">
                        <TldrawUiMenuItem
                            id="copy-drawing"
                            label="Copy Data"
                            icon="external-link"
                            readonlyOk
                            onSelect={selectFn}
                        />
                        <TldrawUiMenuItem
                            id="toggle-drawing"
                            label="Toggle Drawing"
                            icon="external-link"
                            readonlyOk
                            onSelect={selectToggleFn}
                        />
                    </TldrawUiMenuGroup>
                </div>
            </DefaultMainMenu>
        )
    }

    const components: TLComponents = {
        MainMenu: CustomMainMenu,
        ZoomMenu: null,
        ActionsMenu: null,
        HelpMenu: null,
        DebugMenu: null,
        DebugPanel: null,
        PageMenu: null
    }

    return (
        <div style={{ height: '500px' }} className="tldraw__editor">
            <Tldraw
                components={components}
                store={store}
                onMount={(editor) => {
                    ed = editor;
                    ed?.updateInstanceState({ isReadonly: isReadOnly });
                }}
            />
        </div>
    )
}

// function DrawingComponent(props: { containerKey: string, initialData: string }) {
//     console.log(props);
//     const [store] = useState(() => createTLStore({
//         shapeUtils: defaultShapeUtils,
//     }))
//     let ed: Editor;
//     let isReadOnly = true;

//     if (props.initialData != "") {
//         store.loadSnapshot(JSON.parse(props.initialData));
//     }

//     store.listen(
//         throttle(() => {
//             console.log(store.getSnapshot());
//         }, 500)
//     );


//     const selectFn: TLUiMenuSelectFn = async () => {
//         await copyClipboard(JSON.stringify(store.getSnapshot()));
//         alert("copied data to clipboard. paste it inside your markdown file");
//     };

//     const selectToggleFn: TLUiMenuSelectFn = async () => {
//         isReadOnly = !isReadOnly;
//         ed.updateInstanceState({ isReadonly: isReadOnly })
//     };

//     const CustomMainMenu = function () {
//         return (
//             <DefaultMainMenu>
//                 <div style={{ backgroundColor: 'thistle' }}>
//                     <TldrawUiMenuGroup id="example">
//                         <TldrawUiMenuItem
//                             id="copy-drawing"
//                             label="Copy Drawing"
//                             icon="external-link"
//                             readonlyOk
//                             onSelect={selectFn}
//                         />
//                         <TldrawUiMenuItem
//                             id="toggle-drawing"
//                             label="Toggle Drawing"
//                             icon="external-link"
//                             readonlyOk
//                             onSelect={selectToggleFn}
//                         />
//                     </TldrawUiMenuGroup>
//                 </div>
//                 <DefaultMainMenuContent />
//             </DefaultMainMenu>
//         )
//     }

//     const components: TLComponents = {
//         MainMenu: CustomMainMenu
//     }

//     return (<div className="tldraw__editor" style={{ height: '500px' }}>
//         <Tldraw
//             components={components}
//             // inferDarkMode
//             // persistenceKey="example"
//             onMount={(editor) => {
//                 ed = editor;
//                 // ed.current = editor;
//                 ed.updateInstanceState({ isReadonly: true })
//             }}
//         />
//     </div>)

// }

function render(container: HTMLElement, data: string) {
    const root = createRoot(container);
    root.render(
        <DrawingComponent initialData={data} />
    );
}

export {
    render
}