// Move the habit with id `activeId` to where `overId` currently is.
// Returns the same array if nothing changes, so React can skip a re-render.
export function moveById(list, activeId, overId) {
  if (activeId === overId) return list;
  const from = list.findIndex((item) => item.id === activeId);
  const to = list.findIndex((item) => item.id === overId);
  if (from === -1 || to === -1) return list;
  const next = list.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
