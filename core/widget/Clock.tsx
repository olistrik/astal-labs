import { createPoll } from "ags/time"
import GLib from "gi://GLib?version=2.0"

/**
 * The local time. `format` is a GLib date format (strftime style), by default
 * weekday, day, month and time, e.g. "Mon 12 Oct 14:52".
 */
export default function Clock({ format = "%a %d %b %H:%M" }: { format?: string }) {
    const time = createPoll("", 1000, () => GLib.DateTime.new_now_local().format(format) ?? "")

    return <label class="Clock" label={time} />
}
