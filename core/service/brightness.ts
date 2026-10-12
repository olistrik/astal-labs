import Gio from "gi://Gio?version=2.0"
import GObject, { register, getter, setter } from "ags/gobject"
import { monitorFile, readFile, readFileAsync } from "ags/file"
import { execAsync } from "ags/process"

const BACKLIGHT = "/sys/class/backlight"

/** The first backlight device, e.g. "intel_backlight". Null on machines without one. */
function findBacklight(): string | null {
    try {
        const children = Gio.File.new_for_path(BACKLIGHT).enumerate_children(
            "standard::name",
            Gio.FileQueryInfoFlags.NONE,
            null,
        )
        const first = children.next_file(null)?.get_name() ?? null
        children.close(null)
        return first
    } catch {
        return null
    }
}

/**
 * Screen brightness of the first backlight, as a fraction between 0 and 1.
 * Reads sysfs directly and writes with `brightnessctl`, which has to be in PATH.
 * On machines without a backlight `hasScreen` is false and `screen` stays 0.
 */
@register({ GTypeName: "AstalLabsBrightness" })
export default class Brightness extends GObject.Object {
    static #instance: Brightness | null = null

    static get_default() {
        return (this.#instance ??= new Brightness())
    }

    #device = findBacklight()
    #max = 1
    #screen = 0
    #writing = false
    #dirty = false

    @getter(Boolean)
    get hasScreen() {
        return this.#device !== null
    }

    @getter(Number)
    get screen() {
        return this.#screen
    }

    @setter(Number)
    set screen(fraction: number) {
        if (!this.#device) return

        this.#screen = Math.min(1, Math.max(0, fraction))
        this.notify("screen")
        this.#write()
    }

    /** Scrolling produces many updates; only ever run one brightnessctl at a time. */
    #write() {
        if (this.#writing) {
            this.#dirty = true
            return
        }

        this.#writing = true
        execAsync(["brightnessctl", "-q", "-d", this.#device!, "set", `${Math.round(this.#screen * 100)}%`])
            .catch((error) => console.error("[brightness] brightnessctl failed", error))
            .finally(() => {
                this.#writing = false
                if (this.#dirty) {
                    this.#dirty = false
                    this.#write()
                }
            })
    }

    constructor() {
        super()
        if (!this.#device) return

        const dir = `${BACKLIGHT}/${this.#device}`
        this.#max = Number(readFile(`${dir}/max_brightness`)) || 1
        this.#screen = Number(readFile(`${dir}/brightness`)) / this.#max

        monitorFile(`${dir}/brightness`, async (file) => {
            const value = Number(await readFileAsync(file)) / this.#max
            if (value === this.#screen) return

            this.#screen = value
            this.notify("screen")
        })
    }
}
