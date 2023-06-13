export function createFormState() {
    const state = {};

    return {
        get: (key) => state[key],
        set: (key, value) => {
            state[key] = value;
        },
        reset: () => {
            Object.keys(state).forEach((key) => {
                state[key] = null;
            });
        }
    };
}