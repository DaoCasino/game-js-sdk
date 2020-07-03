import { AuthData } from './types';
import { GameSessionUpdate } from './models';

// Here are listed all available events
export type EventType = {
    tokensUpdate: AuthData;
    sessionUpdate: GameSessionUpdate<any>[];
    esc: undefined;
};

export type Callback<Type> = (value: Type) => unknown;
type UnionToIntersection<U> = (U extends any
  ? (k: U) => void
  : never) extends (k: infer I) => void
    ? I
    : never;
type AnyEvent = UnionToIntersection<EventType[keyof EventType]>;

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
        if (!(eventName in this.subscribers)) this.subscribers[eventName] = [];
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
        if (!(eventName in this.subscribers)) return this;
        const subs = this.subscribers[eventName];
        for (let i = 0; i < subs.length; i++) {
            if (subs[i].cb == cb) {
                this.subscribers[eventName].splice(i, 1);
                return this;
            }
        }
        return this;
    }

    public on<EvName extends keyof EventType>(
        eventName: EvName,
        cb: Callback<EventType[EvName]>
    ) {
        if (!(eventName in this.subscribers)) this.subscribers[eventName] = [];
        this.subscribers[eventName].push({
            cb: cb as Callback<AnyEvent>,
            once: false,
        });
        return this;
    }

    /** @internal */
    public emit<EvName extends keyof EventType>(
        eventName: EvName,
        value?: EventType[EvName]
    ) {
        const subs = this.subscribers[eventName];
        if (!subs) return;

        for (let i = 0; i < subs.length; i++) {
            const sub = subs[i];
            sub.cb(value as AnyEvent || undefined);
            if (sub.once) {
                subs.splice(i, 1);
                i--;
            }
        }
    }
}
