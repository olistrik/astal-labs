import { For, createComputed } from "ags"
import { Gdk } from "ags/gtk4"
import { windows, workspaces, focusWorkspace, start } from "../service/niri"

type Item = {
    id: number
    label: string
    active: boolean
    populated: boolean
    urgent: boolean
    named: boolean
}

/**
 * The workspaces of `monitor`. Empty workspaces are hidden, except the active
 * one and named ones. Click a workspace to focus it.
 */
export default function NiriWorkspaces({ monitor }: { monitor: Gdk.Monitor }) {
    start()

    const items = createComputed((): Array<Item> => {
        const all = windows()

        return workspaces()
            .filter((ws) => ws.output === monitor.connector)
            .sort((a, b) => a.idx - b.idx)
            .map((ws) => {
                const populated = all.some((w) => w.workspace_id === ws.id)
                return {
                    id: ws.id,
                    label: ws.name ?? String(ws.idx),
                    active: ws.is_active,
                    populated,
                    urgent: ws.is_urgent,
                    named: ws.name !== null,
                }
            })
            .filter((item) => item.active || item.populated || item.named)
    })

    return (
        <box class="NiriWorkspaces">
            <For each={items}>
                {(item) => (
                    <button
                        class={[
                            "workspace",
                            item.active && "active",
                            item.populated && "populated",
                            item.urgent && "urgent",
                        ]
                            .filter(Boolean)
                            .join(" ")}
                        focusable={false}
                        onClicked={() => focusWorkspace(item.id)}
                    >
                        <label label={item.label} />
                    </button>
                )}
            </For>
        </box>
    )
}
