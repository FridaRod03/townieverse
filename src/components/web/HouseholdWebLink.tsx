import { usePlanning } from '../../hooks/PlanningContext';
import { emptyWeb } from '../../utils/web';
export function HouseholdWebLink({ householdId }: { householdId: string }) {
  const { data, commit, blocked, stale } = usePlanning();
  const profiles = data.profiles.filter(
    (p) =>
      p.assignments.some((a) => a.householdId === householdId) ||
      p.relationshipWeb?.nodes.some((n) => n.householdId === householdId),
  );
  return (
    <details className="household-web-link">
      <summary>View in Relationship Web</summary>
      {profiles.length ? (
        <ul>
          {profiles.map((p) => (
            <li key={p.id}>
              <a
                href="#/web"
                aria-disabled={blocked || stale}
                onClick={(e) => {
                  const web = p.relationshipWeb ?? emptyWeb();
                  if (
                    !commit(
                      {
                        ...data,
                        selectedProfileId: p.id,
                        profiles: data.profiles.map((x) =>
                          x.id === p.id
                            ? {
                                ...x,
                                relationshipWeb: {
                                  ...web,
                                  filters: {
                                    ...web.filters,
                                    householdId,
                                    focusId: '',
                                    simId: '',
                                    search: '',
                                    worldId: '',
                                    type: '',
                                    status: '',
                                    favorites: false,
                                  },
                                },
                              }
                            : x,
                        ),
                      },
                      'Opened household relationships.',
                    )
                  )
                    e.preventDefault();
                }}
              >
                {p.name} — View household relationships
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          Assign this household to a{' '}
          <a href="#/population">save-file profile</a> first.
        </p>
      )}
    </details>
  );
}
