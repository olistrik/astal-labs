import { For, createComputed, createState } from "ags"
import { Gdk, Gtk } from "ags/gtk4"
import GLib from "gi://GLib?version=2.0"
import { windows, workspaces, focusWindow, start } from "../service/niri"

type Tile = { id: number; height: number; focused: boolean }
type Column = { index: number; width: number; tiles: Array<Tile> }

/** Vertical margin of a column (see style.scss), top and bottom together. */
const MARGIN_Y = 4
/** Horizontal margin of a column, left and right together. */
const MARGIN_X = 2
/** Gap between the tiles of a split column. */
const TILE_GAP = 2
/** Used until the real height of the bar row is known. */
const FALLBACK_HEIGHT = 24

/**
 * A segmented minimap of the active workspace on `monitor`: one segment per
 * scrolling column, with the same aspect ratio as that column, and tiles
 * stacked inside it. When there are too many columns to fit, all segments get
 * proportionally narrower. Click a column to focus it. Hidden while the workspace
 * has one window or none.
 */
export default function NiriMinimap({
    monitor,
    fraction = 1 / 3,
}: {
    monitor: Gdk.Monitor
    /** Largest share of the monitor width the minimap may take up. */
    fraction?: number
}) {
    start()

    const maxWidth = Math.round(monitor.get_geometry().width * fraction)
    const [height, setHeight] = createState(FALLBACK_HEIGHT)

    const columns = createComputed((): Array<Column> => {
        const workspace = workspaces().find(
            (ws) => ws.output === monitor.connector && ws.is_active,
        )
        if (!workspace) return []

        const byColumn = new Map<number, Array<{ id: number; row: number; w: number; h: number }>>()
        for (const win of windows()) {
            const pos = win.layout.pos_in_scrolling_layout
            if (win.workspace_id !== workspace.id || !pos) continue

            const [column, row] = pos
            const [w, h] = win.layout.tile_size
            byColumn.set(column, [...(byColumn.get(column) ?? []), { id: win.id, row, w, h }])
        }

        // width of each segment if it keeps the aspect ratio of its column
        const innerHeight = Math.max(1, height() - MARGIN_Y)
        const natural = [...byColumn]
            .sort(([a], [b]) => a - b)
            .map(([index, tiles]) => {
                const w = Math.max(...tiles.map((t) => t.w))
                const h = tiles.reduce((sum, t) => sum + t.h, 0)
                return {
                    index,
                    width: (w / h) * innerHeight,
                    tiles: tiles
                        .sort((a, b) => a.row - b.row)
                        .map((t) => ({
                            id: t.id,
                            // share of the column height, turned into pixels below
                            height: t.h / h,
                            focused: t.id === workspace.active_window_id,
                        })),
                }
            })

        // too many columns: shrink them all to fit
        const available = maxWidth - natural.length * MARGIN_X
        const total = natural.reduce((sum, c) => sum + c.width, 0)
        const scale = total > available ? available / total : 1

        return natural.map((c) => {
            // split columns: divide the height over the tiles, minus the gaps between them
            const room = innerHeight - (c.tiles.length - 1) * TILE_GAP
            return {
                ...c,
                width: Math.max(2, Math.round(c.width * scale)),
                tiles: c.tiles.map((t) => ({ ...t, height: Math.max(2, Math.round(t.height * room)) })),
            }
        })
    })

    // a single window is all there is to see: nothing to navigate, so hide the minimap
    const hasSeveral = columns((all) => all.reduce((count, column) => count + column.tiles.length, 0) > 1)

    return (
        <box
            class="NiriMinimap"
            visible={hasSeveral}
            $={(self) => {
                // the bar row's height is only known once it has been allocated
                self.add_tick_callback(() => {
                    const allocated = self.get_height()
                    if (allocated <= 0) return GLib.SOURCE_CONTINUE

                    setHeight(allocated)
                    return GLib.SOURCE_REMOVE
                })
            }}
        >
            <For each={columns}>
                {(column) => (
                    <box
                        class="column"
                        orientation={Gtk.Orientation.VERTICAL}
                        spacing={TILE_GAP}
                        widthRequest={column.width}
                    >
                        {column.tiles.map((tile) => (
                            <button
                                class={tile.focused ? "tile focused" : "tile"}
                                focusable={false}
                                heightRequest={tile.height}
                                onClicked={() => focusWindow(tile.id)}
                            />
                        ))}
                    </box>
                )}
            </For>
        </box>
    )
}
