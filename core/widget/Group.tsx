/**
 * Puts items in a single pill, e.g. `<Group><Volume /><Microphone /></Group>`.
 * The items drop their own background and just sit next to each other.
 */
export default function Group({ children }: { children?: JSX.Element | Array<JSX.Element> }) {
    return <box class="BarGroup">{children}</box>
}
