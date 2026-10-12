import { createBinding } from "ags"
import AstalWp from "gi://AstalWp?version=0.1"
import BarItem, { type ItemOptions } from "./BarItem"
import { percent } from "../util"

const STEP = 0.02

/** Shared by `Volume` (the default speaker) and `Microphone` (the default microphone). */
export default function EndpointItem({
    kind,
    ...options
}: ItemOptions & { kind: "speaker" | "microphone" }) {
    const audio = AstalWp.get_default()!.audio!
    const key = kind === "speaker" ? "defaultSpeaker" : "defaultMicrophone"
    const name = kind === "speaker" ? "Volume" : "Microphone"
    const endpoint = () => audio[key]!

    // the default endpoint can change at runtime, so bind through it
    const volume = createBinding(audio, key, "volume")
    const muted = createBinding(audio, key, "mute")

    return (
        <BarItem
            onSecondaryClicked={() => endpoint().set_mute(!endpoint().mute)}
            onScroll={(direction) => endpoint().set_volume(Math.min(1, Math.max(0, endpoint().volume - direction * STEP)))}
            {...options}
            classes={muted((m) => (m ? `${name} muted` : name))}
            icon={createBinding(audio, key, "volumeIcon")}
            label={volume(percent)}
            tooltip={volume((v) => `${name} ${percent(v)}`)}
        />
    )
}
