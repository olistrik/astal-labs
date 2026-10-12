import { createBinding, createComputed } from "ags"
import AstalMpris from "gi://AstalMpris?version=0.1"
import BarItem, { type ItemOptions } from "./BarItem"

/**
 * The first mpris player: "title - artist" next to a play/pause icon.
 * Right click toggles playback, left click opens the `panel`, e.g. a `MediaPanel`.
 */
export default function Media(options: ItemOptions) {
    const players = createBinding(AstalMpris.get_default(), "players")
    const player = players((all) => all[0] ?? null)

    // title, artist and status belong to whichever player is first right now
    const text = createComputed(() => {
        const p = player()
        if (!p) return "Nothing playing"

        const [title, artist] = [createBinding(p, "title")(), createBinding(p, "artist")()]
        return [title, artist].filter(Boolean).join(" - ") || "Unknown Track"
    })

    return (
        <BarItem
            onSecondaryClicked={() => player.peek()?.play_pause()}
            labelMode="always"
            {...options}
            classes="Media"
            icon={player((p) => (p ? "multimedia-player-symbolic" : "media-playback-stop-symbolic"))}
            label={text}
            tooltip={text}
        />
    )
}
