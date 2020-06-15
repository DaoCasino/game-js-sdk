import { AuthData } from './types';

// Here are listed all available events
type EventType = {
    tokensUpdate: AuthData;
};

type Callback<Type> = (value: Type) => unknown;
type AnyEvent = EventType[keyof EventType];

export class EventEmitter {
    private subscribers: {
        [EvName in keyof EventType]?: {
            cb: Callback<EventType[EvName]>;
            once: boolean;
        }[];
    } = {};

    public once<EvName extends keyof EventType>(
        eventName: EvName,
        cb: Callback<EventType[EvName]>
    ) {
        if (this.subscribers[eventName] == undefined)
            this.subscribers[eventName] = [];
        this.subscribers[eventName].push({
            cb: cb as Callback<AnyEvent>,
            once: true,
        });
        return this;
    }

    public off<EvName extends keyof EventType>(
        eventName: EvName,
        cb: Callback<EventType[EvName]>
    ) {
        if (this.subscribers[eventName] == undefined) return this;
        this.subscribers[eventName] = this.subscribers[eventName].filter(
            s => s.cb != cb
        );
        return this;
    }

    public on<EvName extends keyof EventType>(
        eventName: EvName,
        cb: Callback<EventType[EvName]>
    ) {
        if (this.subscribers[eventName] == undefined)
            this.subscribers[eventName] = [];
        this.subscribers[eventName].push({
            cb: cb as Callback<AnyEvent>,
            once: false,
        });
        return this;
    }

    /** @internal */
    public emit<EvName extends keyof EventType>(
        eventName: EvName,
        value: EventType[EvName]
    ) {
        const subs = this.subscribers[eventName];
        if (subs) {
            for (let i = 0; i < subs.length; i++) {
                const sub = subs[i];
                sub.cb(value);
                if (sub.once) {
                    subs.splice(i, 1);
                    i--;
                }
            }
        }
    }
}
