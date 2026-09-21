import { useState } from "react";
import { loadCurrentUser, saveCurrentUser, type CurrentUser } from "../../lib/current-user";

// The services decide what you may do from the x-user-id and x-user-role headers, and a
// buyer may not approve their own order. Until there is real authentication, this lets one
// person act as two, which is what demonstrating the approval flow needs.
const PEOPLE: CurrentUser[] = [
  { id: "buyer@commerce.test", role: "BUYER" },
  { id: "second-buyer@commerce.test", role: "BUYER" },
  { id: "manager@commerce.test", role: "MANAGER" },
];

export function UserSwitcher() {
  const [user, setUser] = useState(loadCurrentUser);

  const change = (id: string) => {
    const next = PEOPLE.find((person) => person.id === id) ?? PEOPLE[0]!;
    saveCurrentUser(next);
    setUser(next);
    // Cached data was fetched as the previous user, so start clean
    window.location.reload();
  };

  return (
    <label className="flex items-center gap-2 text-xs text-slate-300">
      Acting as
      <select
        value={user.id}
        onChange={(event) => change(event.target.value)}
        className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white"
      >
        {PEOPLE.map((person) => (
          <option key={person.id} value={person.id}>
            {person.id.split("@")[0]} ({person.role.toLowerCase()})
          </option>
        ))}
      </select>
    </label>
  );
}
