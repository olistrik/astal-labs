import EndpointItem from "./EndpointItem"
import { type ItemOptions } from "./BarItem"

/**
 * Volume of the default microphone. Right click toggles mute, scroll changes the volume.
 * Left click opens the `panel`, e.g. an `AudioPanel`.
 */
export default function Microphone(options: ItemOptions) {
    return <EndpointItem kind="microphone" {...options} />
}
