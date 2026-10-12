import { Accessor } from "ags"

/** 0.42 -> "42%" */
export const percent = (fraction: number) => `${Math.round(fraction * 100)}%`

/** Lets components take either a plain value or an accessor. */
export function toAccessor<T>(value: T | Accessor<T>): Accessor<T> {
    return value instanceof Accessor ? value : new Accessor(() => value)
}
