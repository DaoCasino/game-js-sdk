import { AuthData } from './types';

// Here are listed all available events
type EventType = {
    tokensUpdate: AuthData;
};

type Callback<Type> = (value: Type) => unknown;
type AnyEvent = EventType[keyof EventType];

export class EventEmitter {
    private subscribers: {
        [EvName in keyof EventType]?: Callback<EventType[EvName]>[];
    } = {};

    public on<EvName extends keyof EventType>(
        eventName: EvName,
        cb: Callback<EventType[EvName]>
    ) {
        if (this.subscribers[eventName] == undefined)
            this.subscribers[eventName] = [];
        this.subscribers[eventName].push(cb as Callback<AnyEvent>);
    }

    /** @internal */
    public emit<EvName extends keyof EventType>(
        eventName: EvName,
        value: EventType[EvName]
    ) {
        if (this.subscribers[eventName]) {
            this.subscribers[eventName].forEach(subscriber => {
                subscriber(value);
            });
        }
    }
}
