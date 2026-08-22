import { useState } from "react";
import {
  useNamedPeer,
  useSharedCollection,
  type MeshConfig,
  type YRoom,
} from "@baditaflorin/mesh-common";

type Props = { room: YRoom | null; config: MeshConfig };

export type ChecklistItem = {
  id: string;
  text: string;
  assignee: string;
  done: boolean;
  createdAt: number;
};

export function isValidChecklistItem(value: unknown): value is ChecklistItem {
  const item = value as Partial<ChecklistItem>;
  return Boolean(
    item &&
    typeof item.id === "string" &&
    item.id.length >= 8 &&
    typeof item.text === "string" &&
    item.text.trim().length >= 3 &&
    item.text.length <= 120 &&
    typeof item.assignee === "string" &&
    item.assignee.length <= 64 &&
    typeof item.done === "boolean" &&
    Number.isFinite(item.createdAt),
  );
}

export function Feature({ room, config }: Props) {
  const { myName } = useNamedPeer(config, room);
  const checklist = useSharedCollection<ChecklistItem>(room, "mesh-shared-checklist:items", {
    validate: isValidChecklistItem,
  });
  const [text, setText] = useState("");
  const [assignee, setAssignee] = useState("");
  const addItem = () => {
    const title = text.trim();
    if (title.length < 3) return;
    checklist.add({
      id: crypto.randomUUID(),
      text: title,
      assignee: assignee.trim() || myName,
      done: false,
      createdAt: Date.now(),
    });
    setText("");
  };

  if (!room) {
    return (
      <main className="checklist">
        <h1>Shared checklist</h1>
        <p role="status">Joining your room…</p>
      </main>
    );
  }

  const complete = checklist.items.filter((item) => item.done).length;
  return (
    <main className="checklist">
      <p className="eyebrow">Small-group coordination</p>
      <h1>Make the next thing easy.</h1>
      <p className="lede">Add a task, give it an owner, and tick it off together.</p>
      <p className="progress" role="status" aria-live="polite">
        {complete} of {checklist.items.length} tasks complete · {room.peerCount} peer
        {room.peerCount === 1 ? "" : "s"} connected
      </p>
      <section className="composer" aria-labelledby="add-task-title">
        <h2 id="add-task-title">Add a task</h2>
        <label htmlFor="task-text">What needs doing?</label>
        <input
          id="task-text"
          value={text}
          maxLength={120}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") addItem();
          }}
          placeholder="e.g. Bring the picnic blanket"
        />
        <label htmlFor="task-assignee">Owner (optional)</label>
        <input
          id="task-assignee"
          value={assignee}
          maxLength={64}
          onChange={(event) => setAssignee(event.target.value)}
          placeholder={`Defaults to ${myName}`}
        />
        <button type="button" onClick={addItem} disabled={text.trim().length < 3}>
          Add to checklist
        </button>
      </section>
      <section aria-labelledby="tasks-title">
        <div className="section-heading">
          <h2 id="tasks-title">The list</h2>
          <span>{checklist.items.length} total</span>
        </div>
        <ul className="task-list" aria-live="polite">
          {checklist.items.length ? (
            checklist.items.map((item) => (
              <li key={item.id} className={item.done ? "task done" : "task"}>
                <label>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => checklist.update(item.id, { done: !item.done })}
                  />
                  <span>{item.text}</span>
                </label>
                <small>Assigned to {item.assignee || "anyone"}</small>
                <button
                  type="button"
                  onClick={() => checklist.remove(item.id)}
                  aria-label={`Remove ${item.text}`}
                >
                  Remove
                </button>
              </li>
            ))
          ) : (
            <li className="empty">No tasks yet. Add one to start the shared plan.</li>
          )}
        </ul>
      </section>
      <p className="hint">
        Everyone in this room can add, complete, or remove tasks. Changes sync directly between
        peers.
      </p>
    </main>
  );
}
