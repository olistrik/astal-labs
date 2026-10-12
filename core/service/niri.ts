import Gio from "gi://Gio?version=2.0"
import GLib from "gi://GLib?version=2.0"
import { createState } from "gnim"

export type WindowLayout = {
    /** 1-based (column, tile in column). Null for floating windows. */
    pos_in_scrolling_layout: [number, number] | null
    /** Size of the tile, including decorations. */
    tile_size: [number, number]
}

export type Window = {
    id: number
    title: string | null
    app_id: string | null
    workspace_id: number | null
    is_focused: boolean
    is_floating: boolean
    layout: WindowLayout
}

export type Workspace = {
    id: number
    idx: number
    name: string | null
    output: string | null
    is_active: boolean
    is_focused: boolean
    active_window_id: number | null
}

const [workspaces, setWorkspaces] = createState<Array<Workspace>>([])
const [windows, setWindows] = createState<Array<Window>>([])

export { workspaces, windows }

let started = false

function socketPath() {
    const path = GLib.getenv("NIRI_SOCKET")
    if (!path) throw Error("NIRI_SOCKET is not set, is niri running?")
    return path
}

function connect() {
    return new Gio.SocketClient().connect(new Gio.UnixSocketAddress({ path: socketPath() }), null)
}

/** Send a single request and return the parsed reply. */
function request(message: unknown): any {
    const connection = connect()
    connection.get_output_stream().write(JSON.stringify(message) + "\n", null)

    const input = new Gio.DataInputStream({
        baseStream: connection.get_input_stream(),
        closeBaseStream: true,
    })

    const [line] = input.read_line_utf8(null)
    input.close(null)
    return line ? JSON.parse(line) : null
}

function action(name: string, args: object = {}) {
    const reply = request({ Action: { [name]: args } })
    if (!reply || !("Ok" in reply)) console.warn(`[niri] ${name} failed`, reply)
}

export function focusWorkspace(id: number) {
    action("FocusWorkspace", { reference: { Id: id } })
}

export function focusColumn(index: number) {
    action("FocusColumn", { index })
}

export function focusWindow(id: number) {
    action("FocusWindow", { id })
}

function onEvent(event: any) {
    if ("WorkspacesChanged" in event) {
        setWorkspaces(event.WorkspacesChanged.workspaces)
    } else if ("WorkspaceActivated" in event) {
        const { id, focused } = event.WorkspaceActivated
        const target = workspaces().find((ws) => ws.id === id)
        if (!target) return

        setWorkspaces((all) =>
            all.map((ws) => ({
                ...ws,
                // only one workspace per output is active, only one overall is focused
                is_active: ws.output === target.output ? ws.id === id : ws.is_active,
                is_focused: focused ? ws.id === id : ws.is_focused,
            })),
        )
    } else if ("WorkspaceActiveWindowChanged" in event) {
        const { workspace_id, active_window_id } = event.WorkspaceActiveWindowChanged
        setWorkspaces((all) =>
            all.map((ws) => (ws.id === workspace_id ? { ...ws, active_window_id } : ws)),
        )
    } else if ("WindowsChanged" in event) {
        setWindows(event.WindowsChanged.windows)
    } else if ("WindowOpenedOrChanged" in event) {
        const window: Window = event.WindowOpenedOrChanged.window
        setWindows((all) => {
            const others = all
                .filter((w) => w.id !== window.id)
                .map((w) => (window.is_focused ? { ...w, is_focused: false } : w))
            return [...others, window]
        })
    } else if ("WindowClosed" in event) {
        setWindows((all) => all.filter((w) => w.id !== event.WindowClosed.id))
    } else if ("WindowFocusChanged" in event) {
        const id: number | null = event.WindowFocusChanged.id
        setWindows((all) => all.map((w) => ({ ...w, is_focused: w.id === id })))
    } else if ("WindowLayoutsChanged" in event) {
        const changes: Array<[number, WindowLayout]> = event.WindowLayoutsChanged.changes
        const layouts = new Map(changes)
        setWindows((all) =>
            all.map((w) => (layouts.has(w.id) ? { ...w, layout: layouts.get(w.id)! } : w)),
        )
    }
}

function readEvents(input: Gio.DataInputStream) {
    input.read_line_async(GLib.PRIORITY_DEFAULT, null, (_, result) => {
        let line: Uint8Array | null
        try {
            ;[line] = input.read_line_finish(result)
        } catch (error) {
            console.error("[niri] event stream failed", error)
            started = false
            return
        }

        if (line === null) {
            console.warn("[niri] event stream closed")
            started = false
            return
        }

        try {
            onEvent(JSON.parse(new TextDecoder().decode(line)))
        } catch (error) {
            console.error("[niri] bad event", error)
        }

        readEvents(input)
    })
}

/** Connect to niri's event stream. Safe to call more than once. */
export function start() {
    if (started) return
    started = true

    const connection = connect()
    connection.get_output_stream().write(JSON.stringify("EventStream") + "\n", null)

    const input = new Gio.DataInputStream({
        baseStream: connection.get_input_stream(),
        closeBaseStream: true,
    })

    // first line is the reply to the request
    input.read_line_utf8(null)
    readEvents(input)
}
