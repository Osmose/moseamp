/**
 * Simple dispatcher to make triggering actions within the tree of
 * components easier.
 */
let actions = {};

export function register(action, handler) {
    if (!(action in actions)) {
        actions[action] = [];
    }

    actions[action].push(handler);
}

export function dispatch(action, ...args) {
    let handlers = actions[action] || [];
    for (let handler of handlers) {
        handler(...args);
    }
}

/** Shorthand for dispatching actions in JSX event attributes. */
export function thenDispatch(action, ...args) {
    return (event) => {
        event.preventDefault();
        dispatch(action, event, ...args);
    };
}
