import { createBinding } from "ags"
import { Gdk, Gtk } from "ags/gtk4"
import GdkPixbuf from "gi://GdkPixbuf?version=2.0"
import AstalMpris from "gi://AstalMpris?version=0.1"
import Pango from "gi://Pango?version=1.0"

/** Size of the cover art, in pixels. */
const COVER = 110

/**
 * Cover art scaled down when loading: a picture takes the natural size of its
 * image, so a large cover would otherwise blow up the whole panel.
 */
function cover(path: string | null): Gdk.Paintable | null {
    if (!path) return null

    try {
        return Gdk.Texture.new_for_pixbuf(GdkPixbuf.Pixbuf.new_from_file_at_scale(path, COVER, COVER, true))
    } catch {
        return null
    }
}

/** 83 -> "1:23" */
function duration(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const rest = Math.floor(seconds % 60)
    return `${minutes}:${rest < 10 ? "0" : ""}${rest}`
}

/** Cover art, title, artist, seek bar and controls of a single player. */
export default function MediaPlayerPanel({ player }: { player: AstalMpris.Player }) {
    const length = createBinding(player, "length")
    const seekable = length((l) => l > 0)
    const position = createBinding(player, "position")

    return (
        <box class="MediaPlayerPanel">
            <Gtk.Picture
                class="cover"
                widthRequest={COVER}
                heightRequest={COVER}
                contentFit={Gtk.ContentFit.COVER}
                paintable={createBinding(player, "coverArt")(cover)}
            />
            <box class="info" orientation={Gtk.Orientation.VERTICAL} hexpand>
                <label
                    class="title"
                    xalign={0}
                    ellipsize={Pango.EllipsizeMode.END}
                    label={createBinding(player, "title")((t) => t || "Unknown Track")}
                />
                <label
                    class="artist"
                    xalign={0}
                    vexpand
                    valign={Gtk.Align.START}
                    ellipsize={Pango.EllipsizeMode.END}
                    label={createBinding(player, "artist")((a) => a || "Unknown Artist")}
                />
                <slider
                    visible={seekable}
                    value={position((p) => (player.length > 0 ? p / player.length : 0))}
                    onChangeValue={({ value }) => (player.position = value * player.length)}
                />
                <centerbox>
                    <label $type="start" class="position" visible={seekable} label={position(duration)} />
                    <box $type="center" class="controls">
                        <button
                            class="PanelButton"
                            focusOnClick={false}
                            visible={createBinding(player, "canGoPrevious")}
                            onClicked={() => player.previous()}
                        >
                            <image iconName="media-skip-backward-symbolic" />
                        </button>
                        <button
                            class="PanelButton"
                            focusOnClick={false}
                            visible={createBinding(player, "canControl")}
                            onClicked={() => player.play_pause()}
                        >
                            <image
                                iconName={createBinding(player, "playbackStatus")((s) =>
                                    s === AstalMpris.PlaybackStatus.PLAYING
                                        ? "media-playback-pause-symbolic"
                                        : "media-playback-start-symbolic",
                                )}
                            />
                        </button>
                        <button
                            class="PanelButton"
                            focusOnClick={false}
                            visible={createBinding(player, "canGoNext")}
                            onClicked={() => player.next()}
                        >
                            <image iconName="media-skip-forward-symbolic" />
                        </button>
                    </box>
                    <label $type="end" class="length" visible={seekable} label={length(duration)} />
                </centerbox>
            </box>
        </box>
    )
}
