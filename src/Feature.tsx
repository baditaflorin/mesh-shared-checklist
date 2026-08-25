import { useRef, useState } from "react";
import {
  MeshButton,
  MeshLaunch,
  MeshNameInput,
  MeshPresence,
  MeshStatusPill,
  MeshSurface,
  useNamedPeer,
  useRoster,
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
  const { name, setName, myName } = useNamedPeer(config, room);
  const roster = useRoster(room);
  const checklist = useSharedCollection<ChecklistItem>(room, "mesh-shared-checklist:items", {
    validate: isValidChecklistItem,
  });
  const [text, setText] = useState("");
  const [assignee, setAssignee] = useState("");
  const composerRef = useRef<HTMLDivElement>(null);
  const taskFieldRef = useRef<HTMLInputElement>(null);
  const isConnected = Boolean(room);
  const completed = checklist.items.filter((item) => item.done).length;
  const remaining = Math.max(0, checklist.items.length - completed);

  const focusComposer = () => {
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.requestAnimationFrame(() => taskFieldRef.current?.focus());
  };

  const addItem = () => {
    const title = text.trim();
    if (!room || title.length < 3) return;
    checklist.add({
      id: crypto.randomUUID(),
      text: title,
      assignee: assignee.trim() || myName,
      done: false,
      createdAt: Date.now(),
    });
    setText("");
  };

  const addStarter = () => {
    if (!room) return;
    const starter = "Set the first shared priority";
    if (!checklist.items.some((item) => item.text.toLowerCase() === starter.toLowerCase())) {
      checklist.add({
        id: crypto.randomUUID(),
        text: starter,
        assignee: myName,
        done: false,
        createdAt: Date.now(),
      });
    }
    focusComposer();
  };

  return (
    <main className="checklist">
      {checklist.items.length === 0 ? (
        <MeshLaunch
          className="checklist-launch"
          eyebrow="Shared planning, without the noise"
          heading="A clear plan for the next thing."
          promise="Turn the loose ends into a short, shared list that everyone can act on."
          loading={!isConnected}
          connectionHint={
            isConnected ? "This checklist is ready to share with this room." : undefined
          }
          presence={
            <MeshPresence
              count={Math.max(roster.present.length, isConnected ? 1 : 0)}
              label="people shaping this plan"
              state={isConnected ? "connected" : "connecting"}
            />
          }
          preview={
            <div className="checklist-preview" aria-label="Checklist preview">
              <div className="checklist-preview-heading">
                <span>Today’s plan</span>
                <MeshStatusPill tone="success" dot>
                  Ready to begin
                </MeshStatusPill>
              </div>
              <ul>
                <li>
                  <span className="preview-check" aria-hidden="true" />
                  Decide the one thing that matters most
                </li>
                <li>
                  <span className="preview-check" aria-hidden="true" />
                  Give it a clear owner
                </li>
                <li>
                  <span className="preview-check preview-check-muted" aria-hidden="true" />
                  Keep the finished work visible
                </li>
              </ul>
            </div>
          }
          primaryAction={{
            label: "Start with a baseline",
            onClick: addStarter,
            disabled: !isConnected,
          }}
          secondaryAction={{
            label: "Write the first task",
            onClick: focusComposer,
            disabled: !isConnected,
          }}
        />
      ) : (
        <header className="checklist-summary" aria-labelledby="checklist-title">
          <div>
            <p className="eyebrow">Shared plan</p>
            <h1 id="checklist-title">Keep the next thing clear.</h1>
            <p>
              {remaining === 0
                ? "Everything on this plan is complete. Keep the momentum going."
                : `${remaining} ${remaining === 1 ? "task is" : "tasks are"} still in motion.`}
            </p>
          </div>
          <div className="checklist-summary-status">
            <MeshStatusPill tone={remaining === 0 ? "success" : "info"} dot>
              {completed} of {checklist.items.length} complete
            </MeshStatusPill>
            <MeshPresence
              count={Math.max(roster.present.length, 1)}
              label="people here"
              state="connected"
            />
          </div>
        </header>
      )}

      <div className="checklist-workbench">
        <MeshSurface
          as="section"
          tone="raised"
          padding="lg"
          className="checklist-composer"
          aria-labelledby="add-task-title"
        >
          <div ref={composerRef} className="checklist-composer-anchor">
            <div className="section-kicker">Add with intent</div>
            <h2 id="add-task-title">Add the next task</h2>
            <p>One clear task is more useful than a long, vague plan.</p>
            <div className="composer-fields">
              <label htmlFor="task-text">What needs doing?</label>
              <input
                ref={taskFieldRef}
                id="task-text"
                value={text}
                maxLength={120}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addItem();
                }}
                placeholder="e.g. Bring the picnic blanket"
                disabled={!isConnected}
              />
              <label htmlFor="task-assignee">Owner (optional)</label>
              <input
                id="task-assignee"
                value={assignee}
                maxLength={64}
                onChange={(event) => setAssignee(event.target.value)}
                placeholder={`Defaults to ${myName || "you"}`}
                disabled={!isConnected}
              />
            </div>
            <MeshButton
              type="button"
              onClick={addItem}
              disabled={!isConnected || text.trim().length < 3}
              fullWidth
            >
              Add to checklist
            </MeshButton>
          </div>
        </MeshSurface>

        <MeshSurface
          as="section"
          tone="quiet"
          padding="lg"
          className="checklist-list-panel"
          aria-labelledby="tasks-title"
        >
          <div className="section-heading">
            <div>
              <div className="section-kicker">Shared work</div>
              <h2 id="tasks-title">The list</h2>
            </div>
            <MeshStatusPill tone={checklist.items.length ? "info" : "neutral"}>
              {checklist.items.length} total
            </MeshStatusPill>
          </div>
          <ul className="task-list" aria-live="polite">
            {checklist.items.length ? (
              checklist.items.map((item) => (
                <li key={item.id} className={item.done ? "task done" : "task"}>
                  <label className="task-toggle">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => checklist.update(item.id, { done: !item.done })}
                    />
                    <span className="task-copy">{item.text}</span>
                  </label>
                  <small>Owner · {item.assignee || "Anyone"}</small>
                  <MeshButton
                    type="button"
                    variant="quiet"
                    size="sm"
                    onClick={() => checklist.remove(item.id)}
                    aria-label={`Remove ${item.text}`}
                  >
                    Remove
                  </MeshButton>
                </li>
              ))
            ) : (
              <li className="empty">
                <strong>The plan is still open.</strong>
                <span>Add the first task, then give the next person something concrete to do.</span>
              </li>
            )}
          </ul>
        </MeshSurface>
      </div>

      <MeshSurface as="aside" tone="base" padding="md" className="checklist-personal">
        <div>
          <div className="section-kicker">Your presence</div>
          <p>Put a name on your updates so the group knows who is carrying what.</p>
        </div>
        <MeshNameInput
          value={name}
          onChange={setName}
          label="Your name"
          placeholder="How should the room know you?"
          maxLength={32}
          showCounter
          disabled={!isConnected}
        />
      </MeshSurface>
    </main>
  );
}
