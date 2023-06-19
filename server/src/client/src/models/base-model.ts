export class BaseModel<T> {
    callback: (state: T) => void;

    setState(state: T) {
        this.callback(state);
    }

    subscribe(callback: typeof BaseModel.prototype.callback) {
        this.callback = callback;
    }
}
