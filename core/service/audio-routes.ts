import { createState } from "gnim"
import { timeout } from "ags/time"
import { execAsync } from "ags/process"

type Route = { direction: "Input" | "Output"; available: "yes" | "no" | "unknown"; devices: Array<number> }
type PwObject = { id: number; type: string; info?: { props?: Record<string, any>; params?: Record<string, any> } }

const [unavailable, setUnavailable] = createState<ReadonlySet<number>>(new Set())

/**
 * Ids of the audio nodes (sinks and sources) that are not plugged in, e.g. an
 * hdmi output without a monitor.
 *
 * WirePlumber knows this per device route, but astal only links an endpoint to
 * its device's active route, so every hdmi output of a card looks as available
 * as the one in use. A node belongs to a route through its `card.profile.device`
 * property, which astal does not expose: read both from `pw-dump` (has to be in PATH).
 */
export { unavailable }

async function read() {
    const objects: Array<PwObject> = JSON.parse(await execAsync(["pw-dump"]))

    const routes = new Map<number, Array<Route>>()
    for (const object of objects) {
        if (object.type !== "PipeWire:Interface:Device") continue
        routes.set(object.id, object.info?.params?.EnumRoute ?? [])
    }

    const result = new Set<number>()
    for (const object of objects) {
        const props = object.info?.props
        if (object.type !== "PipeWire:Interface:Node" || !props) continue

        const direction = { "Audio/Sink": "Output", "Audio/Source": "Input" }[props["media.class"] as string]
        const device = props["card.profile.device"]
        if (!direction || device === undefined) continue

        // an output is available if any route that carries it is
        const carrying = (routes.get(props["device.id"]) ?? []).filter(
            (route) => route.direction === direction && route.devices?.includes(Number(device)),
        )
        if (carrying.length > 0 && carrying.every((route) => route.available === "no")) result.add(object.id)
    }

    setUnavailable(result)
}

let pending = false

/** Reads the routes again soon. Safe to call often, calls close together share one read. */
export function refreshRoutes() {
    if (pending) return

    pending = true
    timeout(200, () => {
        pending = false
        read().catch((error) => console.error("[audio] reading routes with pw-dump failed", error))
    })
}
