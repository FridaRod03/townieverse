import type {
  DynamicKind,
  HouseholdCategory,
  HouseholdPrompt,
  LifeStage,
  OccultType,
} from '../../types/models';
import { entry, rows } from './common';
import { additionalHouseholdStories } from './householdStories';

type Roster = {
  category: HouseholdCategory;
  ages: LifeStage[];
  roles: string[];
  ties: [number, number, DynamicKind][];
  occult?: OccultType;
  pack?: string;
};
const rosters: Record<string, Roster> = {
  solo: { category: 'singles', ages: ['adult'], roles: ['Resident'], ties: [] },
  couple: {
    category: 'couples',
    ages: ['adult', 'adult'],
    roles: ['Partner', 'Partner'],
    ties: [[0, 1, 'partners']],
  },
  family: {
    category: 'families',
    ages: ['adult', 'adult', 'child'],
    roles: ['Parent', 'Parent', 'Child'],
    ties: [
      [0, 1, 'partners'],
      [0, 2, 'biological-parent'],
      [1, 2, 'biological-parent'],
    ],
  },
  parent: {
    category: 'single-parents',
    ages: ['adult', 'teen'],
    roles: ['Parent', 'Teen'],
    ties: [[0, 1, 'biological-parent']],
  },
  blended: {
    category: 'blended-families',
    ages: ['adult', 'adult', 'child', 'teen'],
    roles: ['Parent', 'Stepparent', 'Child', 'Teen'],
    ties: [
      [0, 1, 'partners'],
      [0, 2, 'biological-parent'],
      [1, 2, 'step-parent'],
      [1, 3, 'biological-parent'],
      [0, 3, 'step-parent'],
    ],
  },
  adopt: {
    category: 'families',
    ages: ['adult', 'adult', 'child'],
    roles: ['Adoptive parent', 'Adoptive parent', 'Child'],
    ties: [
      [0, 1, 'partners'],
      [0, 2, 'adoptive-parent'],
      [1, 2, 'adoptive-parent'],
    ],
  },
  foster: {
    category: 'single-parents',
    ages: ['adult', 'child'],
    roles: ['Guardian (foster-inspired roleplay)', 'Child'],
    ties: [[0, 1, 'adoptive-parent']],
  },
  generations: {
    category: 'multigenerational',
    ages: ['elder', 'adult', 'teen'],
    roles: ['Grandparent', 'Parent', 'Teen'],
    ties: [
      [0, 1, 'biological-parent'],
      [1, 2, 'biological-parent'],
    ],
  },
  grand: {
    category: 'families',
    ages: ['elder', 'child'],
    roles: ['Grandparent guardian (roleplay)', 'Grandchild'],
    ties: [[0, 1, 'adoptive-parent']],
  },
  returning: {
    category: 'families',
    ages: ['adult', 'young-adult'],
    roles: ['Parent', 'Returning adult child'],
    ties: [[0, 1, 'biological-parent']],
  },
  elders: {
    category: 'elders',
    ages: ['elder', 'elder'],
    roles: ['Elder friend', 'Elder friend'],
    ties: [[0, 1, 'friends']],
  },
  retired: {
    category: 'elders',
    ages: ['elder'],
    roles: ['Elder resident'],
    ties: [],
  },
  room2: {
    category: 'roommates',
    ages: ['young-adult', 'adult'],
    roles: ['Housemate', 'Housemate'],
    ties: [[0, 1, 'roommates']],
  },
  room3: {
    category: 'roommates',
    ages: ['young-adult', 'adult', 'elder'],
    roles: ['Housemate', 'Housemate', 'Housemate'],
    ties: [
      [0, 1, 'roommates'],
      [1, 2, 'roommates'],
    ],
  },
  vampire: {
    category: 'occult',
    ages: ['adult', 'adult'],
    roles: ['Vampire resident', 'Human housemate'],
    ties: [[0, 1, 'roommates']],
    occult: 'vampire',
    pack: 'vampires',
  },
  witch: {
    category: 'occult',
    ages: ['adult'],
    roles: ['Spellcaster resident'],
    ties: [],
    occult: 'spellcaster',
    pack: 'realm-of-magic',
  },
  wolf: {
    category: 'occult',
    ages: ['adult', 'adult'],
    roles: ['Werewolf resident', 'Human friend'],
    ties: [[0, 1, 'friends']],
    occult: 'werewolf',
    pack: 'werewolves',
  },
  alien: {
    category: 'occult',
    ages: ['adult'],
    roles: ['Alien resident'],
    ties: [],
    occult: 'alien',
    pack: 'get-to-work',
  },
  mermaid: {
    category: 'occult',
    ages: ['adult'],
    roles: ['Mermaid resident'],
    ties: [],
    occult: 'mermaid',
    pack: 'island-living',
  },
  nightlife: {
    category: 'adult-only',
    ages: ['adult', 'young-adult'],
    roles: ['Adult housemate', 'Adult housemate'],
    ties: [[0, 1, 'roommates']],
  },
};
for (let size = 4; size <= 8; size++)
  rosters[`room${size}`] = {
    category: 'roommates',
    ages: Array.from({ length: size }, (_, i) =>
      i % 2 ? 'adult' : 'young-adult',
    ),
    roles: Array.from({ length: size }, (_, i) => `Housemate ${i + 1}`),
    ties: Array.from({ length: size - 1 }, (_, i) => [i, i + 1, 'roommates']),
  };

// Each row is an authored scenario, not a combinatorial name/job permutation.
const stories = rows(
  `
The spare key|solo|comfortable|Apartment|A resident lends a spare key to a trusted neighbor and starts learning how to accept help without surrendering independence.
Quiet first mortgage|solo|tight budget|Small house|After years of shared rentals, a new homeowner celebrates an empty living room and plans improvements one paycheck at a time.
The borrowed garden|solo|modest|Garden cottage|A tenant tends the landlord's neglected beds in exchange for lower rent, then debates whether to open a community seed shelf.
Room for a cello|solo|comfortable|Apartment|A musician rearranges every room around practice space while negotiating considerate rehearsal hours with nearby households.
The unfinished portrait|solo|modest|Studio loft|A painter has kept one portrait unfinished for years; a local exhibition finally offers a reason to revisit its history.
Back in the neighborhood|solo|tight budget|Small house|Returning after a long absence, a resident discovers that familiar neighbors have changed and starts friendships without expecting the past back.
The repaired bicycle|solo|modest|Apartment|A resident learns to repair their only bicycle and slowly turns a practical skill into a welcoming weekend hobby.
Tiny home, big invitations|solo|comfortable|Tiny home|A confident host experiments with picnics because their compact home cannot hold everyone they want to welcome.
A drawer of postcards|solo|comfortable|Apartment|A former frequent traveler settles down and uses old postcards to start a pen-pal circle rather than chase another departure.
The silent morning|solo|wealthy|Large house|A successful adult finds their spacious home strangely lonely and begins building routines that involve other people.
Local history in boxes|solo|modest|Small house|An amateur archivist inherits community photographs and must ask permission before sharing the stories attached to them.
The secondhand piano|solo|tight budget|Apartment|A beginner buys a battered piano, learns patience through missed notes, and saves for repairs instead of replacing it.
Comfortable without a plan|solo|comfortable|Apartment|A content single adult enjoys ordinary routines while friends insist that happiness must involve a dramatic next chapter.
The balcony observatory|solo|modest|Apartment|A skywatcher hosts small viewing evenings and learns that cloudy nights can still produce good conversations.
Recipe for one|solo|comfortable|Small house|A home cook adapts family recipes for one person and starts sharing portions with neighbors without making dinner an obligation.
Two calendars|couple|comfortable|Apartment|Partners with different work rhythms protect one shared evening each week and renegotiate what togetherness looks like.
The learning kitchen|couple|tight budget|Small house|Two newly cohabiting adults learn basic meals together after discovering that neither person's confident cooking stories were accurate.
Separate desks, shared life|couple|comfortable|Apartment|Partners create separate work corners and a mutual rule that unfinished projects cannot occupy the dinner table.
The anniversary walk|couple|modest|Small house|A long-term couple revisits places from their first year together and decides which traditions still fit their present lives.
Two women, one greenhouse|couple|comfortable|Garden cottage|Two women grow seedlings for neighbors while deciding whether a shared hobby should remain relaxing or become a small business.
Two men and a moving van|couple|tight budget|Apartment|Two men move closer to supportive friends and turn the stress of unpacking into a neighborhood potluck.
A home for chosen names|couple|modest|Small house|A nonbinary adult and their partner prepare a housewarming that celebrates chosen names and the people who respect them.
The unhurried engagement|couple|comfortable|Apartment|Engaged partners prefer a long engagement, but competing family expectations require a clear and kindly explained boundary.
The saved train tickets|couple|modest|Apartment|A formerly long-distance couple saves travel mementos and learns how to share ordinary errands after years of carefully planned visits.
Matched retirement dreams|couple|wealthy|Large house|Partners who once imagined different futures draw up a shared retirement plan with room for independent interests.
The good-enough renovation|couple|tight budget|Small house|One partner values perfect finishes and the other needs a functioning home; they agree to complete a single room before starting another.
Equal shelf space|couple|comfortable|Apartment|Two collectors divide display shelves fairly, then discover that a shared collection needs its own identity.
The cancelled big party|couple|comfortable|Small house|Partners replace an exhausting celebration with a small dinner and learn which invitations came from affection rather than pressure.
Different hometowns|couple|modest|Apartment|A couple creates new holiday routines that honor both families without treating either hometown's customs as the default.
The ordinary lucky year|couple|comfortable|Small house|Two adults are happily settled and choose to invest their spare energy in neighborhood friendships instead of manufacturing a crisis.
Homework at the bakery table|family|modest|Apartment|Parents reserve a quiet kitchen corner for their child's homework while planning weekend baking experiments as a family.
The family repair shelf|family|tight budget|Small house|A family repairs toys and furniture together, allowing their child to suggest improvements rather than treating thrift as a punishment.
Three different readers|family|comfortable|Small house|Parents and a child enjoy completely different books, so their weekly reading hour celebrates recommendations instead of enforcing shared tastes.
The first camping plan|family|modest|Small house|A child's enthusiasm for camping prompts parents to practice packing and cooking in the backyard before planning a bigger trip.
Home after the transfer|family|comfortable|Apartment|A family relocates for work and lets their child choose one familiar routine to preserve while everyone builds local friendships.
The neighborhood welcome map|family|comfortable|Small house|Parents and their child draw a map of helpful neighbors for a newcomer, learning to ask residents how they want to be represented.
Screen-free Sunday experiments|family|comfortable|Small house|A family tests occasional device-free afternoons and adjusts the plan when strict rules become less useful than meaningful activities.
The missing trophy cabinet|family|wealthy|Large house|A well-off family gives away competitive trophies and replaces the display with photographs of effort, friendship, and unfinished experiments.
Lunchbox negotiations|family|modest|Apartment|A child wants more say over school lunches, and the parents turn meal planning into a gentle lesson in budgets and choice.
The cousin correspondence|family|comfortable|Small house|A child keeps in touch with distant cousins while parents help organize letters without taking over the conversation.
The shared rainy-day fund|family|tight budget|Apartment|Parents explain an emergency fund in age-appropriate terms and protect small family pleasures while rebuilding savings.
Parents on the sidelines|family|comfortable|Small house|A child's hobby becomes popular locally, and the parents practice supporting participation without making every event a performance review.
The imperfect family album|family|modest|Small house|A family makes an album that includes ordinary days, disagreements resolved, and favorite meals alongside traditional milestones.
The bedroom committee|family|comfortable|Apartment|A child requests a room redesign, and the family agrees on a budget before negotiating colors, storage, and a place for messy projects.
Always a seat at supper|family|comfortable|Small house|Parents make their home a reliable place for their child's friends to eat, with clear guest rules and a generous welcome.
The bus-stop team|parent|tight budget|Apartment|A single parent and teen coordinate commuting and homework while building a dependable support network of trusted neighbors.
Two-person holiday|parent|modest|Small house|A parent and teen invent a holiday tradition that suits their small household rather than imitating celebrations for a larger family.
A parent back at school|parent|tight budget|Apartment|A single parent starts studying again, and their teen practices age-appropriate independence without becoming responsible for adult problems.
The Friday playlist|parent|comfortable|Small house|A parent and teen take turns choosing Friday music, learning when playful teasing becomes dismissal of another person's taste.
The honest budget talk|parent|modest|Apartment|A parent discusses the cost of a teen's hobby with warmth and clarity, then searches together for affordable ways to participate.
The wider village|parent|comfortable|Small house|A single parent asks friends for occasional practical help and reassures their teen that accepting support does not weaken their family.
The parent-teacher notebook|parent|modest|Apartment|A parent and teen prepare questions for school meetings together so the teen can speak about their own goals.
Driving lessons postponed|parent|tight budget|Small house|A teen wants driving lessons while a parent needs to delay the expense; they build a realistic plan without assigning blame.
The new custody rhythm|parent|comfortable|Apartment|A resident parent and teen adapt to a new household schedule while keeping communication with the nonresident parent calm and practical.
One signature dish|parent|modest|Small house|A parent teaches their teen one reliable meal, discovering that the lesson works best when both can make mistakes.
Four welcome hooks|blended|comfortable|Small house|A newly blended family gives everyone an individual coat hook and private storage before asking them to share traditions.
The flexible birthday plan|blended|modest|Apartment|Children in a blended household prefer different celebrations, and the adults coordinate respectfully with nonresident family members.
Two photo albums|blended|comfortable|Small house|A blended family keeps earlier photographs visible while creating a new album that makes room for every chapter.
Stepparent at the concert|blended|comfortable|Small house|A stepparent attends a child's concert as a supportive guest and lets the child decide how to introduce them.
The room-sharing agreement|blended|tight budget|Apartment|A child and teen share a room after families combine, using quiet hours and private shelves to protect their separate identities.
Old pets, new household|blended|modest|Small house|A blended family negotiates care routines for longtime pets and avoids using chores as a test of belonging.
The calendar on the fridge|blended|comfortable|Small house|Adults create a clear household calendar so children can anticipate visits and activities without acting as messengers between parents.
Names for belonging|blended|comfortable|Apartment|A stepparent accepts the name a child chooses for them, allowing affection to develop without requiring a parental title.
The patient first summer|blended|modest|Small house|A blended household plans a quiet first summer, making room for mixed feelings about changes that adults hoped would feel exciting.
Different bedtime histories|blended|tight budget|Apartment|Adults in a blended family compare established routines and work toward consistent rules without declaring one child's past routine wrong.
An adoption anniversary choice|adopt|comfortable|Small house|An adopted child chooses whether and how to mark an adoption anniversary, while both parents protect privacy and honor the child's wishes.
The open questions shelf|adopt|modest|Apartment|Adoptive parents keep space for their child's questions and avoid presenting curiosity about family history as disloyalty.
Keeping a familiar recipe|adopt|comfortable|Small house|Adoptive parents help a child preserve a meaningful recipe, learning its history from trusted sources rather than guessing what it represents.
The school form conversation|adopt|modest|Apartment|An adoptive family works with a teacher to make a family-tree assignment welcoming without requiring personal disclosures.
The prepared spare room|adopt|comfortable|Small house|Parents welcome an adopted child into a room with choices to make, keeping the first weeks calm instead of filling them with celebrations.
Shared stories, chosen audience|adopt|comfortable|Small house|A child decides which adoption-related stories to tell friends, and their parents practice respecting that boundary even when proud of the family.
The inherited lullaby|adopt|modest|Apartment|An adoptive family preserves a lullaby important to the child and adds new evening rituals without replacing earlier attachments.
A family without resemblance|adopt|comfortable|Small house|Parents respond calmly to strangers' intrusive questions and help their child build confidence without making appearance a measure of belonging.
The scrapbook with empty pages|adopt|modest|Small house|An adoptive child leaves some scrapbook pages blank, and the parents accept that a family story can remain unfinished.
The long-awaited ordinary day|adopt|comfortable|Apartment|After a busy transition, an adoptive family celebrates its first completely ordinary weekend of chores, play, and comfortable silence.
The predictable welcome|foster|modest|Small house|A foster-inspired guardian keeps routines predictable and lets a child choose small room details. This is roleplay; the current engine uses an adoptive-parent tie as a guardianship placeholder.
The child's chosen audience|foster|comfortable|Apartment|A foster-inspired guardian helps a child decide which personal stories to share at school. Foster care is roleplay; an adoptive-parent tie is only the engine's guardianship placeholder.
Grandparent's school calendar|grand|modest|Small house|A grandparent raising a grandchild updates old school routines and asks trusted adults for help with unfamiliar technology. Guardianship is roleplay; the engine uses an adoptive-parent tie.
The intergenerational recipe box|grand|comfortable|Small house|A grandparent guardian and grandchild cook from handwritten cards and add new recipes together. The engine represents guardianship with an adoptive-parent tie, not biological parentage.
Three generations of mornings|generations|modest|Small house|A grandparent, adult child, and teen negotiate bathroom time and breakfasts without assuming the oldest generation must run the home.
The upstairs sewing room|generations|comfortable|Large house|Three generations convert an unused room into a shared sewing space, balancing a grandparent's methods with the teen's experiments.
Rent paid in responsibilities|generations|tight budget|Apartment|A multigenerational household divides expenses and tasks explicitly so contributions are recognized without making affection conditional.
The family garden handover|generations|comfortable|Small house|A grandparent gradually shares garden decisions with an adult child and teen, discovering that continuity can include new planting ideas.
Three takes on a holiday|generations|modest|Small house|A grandparent, parent, and teen each choose one holiday activity, making a schedule that leaves room for rest.
An accessible family room|generations|comfortable|Large house|Three generations rearrange a shared room for easier movement and ask the elder resident what changes they actually want.
The grandparent's new hobby|generations|modest|Small house|An elder takes up an unfamiliar hobby and welcomes instruction from their teen grandchild without pretending either generation knows everything.
The adult child's restart|returning|tight budget|Small house|An adult child returns home after a job change, and both residents write down expectations that protect their adult relationship.
Back home by choice|returning|comfortable|Large house|A parent and adult child choose to share housing for practical reasons, resisting neighbors' assumptions that the arrangement signals failure.
The studio in the garage|returning|modest|Small house|An adult child sets up a temporary workshop at a parent's home and agrees on a realistic timeline for the next move.
Two retirees, separate hobbies|elders|comfortable|Apartment|Longtime elder friends share housing and expenses while maintaining different hobbies, friendships, and preferred quiet hours.
The retirement walking club|elders|modest|Small house|Two elders start a gentle walking group and design routes with rest stops rather than turning exercise into a competition.
The late-life flatshare|elders|tight budget|Apartment|Elder friends move in together to reduce costs, establishing privacy rules before unpacking their decades of keepsakes.
The elder exchange students|elders|comfortable|Small house|Two elder friends trade lessons in skills they always wanted to learn, celebrating beginner mistakes without embarrassment.
The independent auntie|retired|comfortable|Apartment|An elder enjoys a full independent life and offers relatives help on clear terms, refusing to become everyone's default unpaid organizer.
New city at seventy|retired|modest|Apartment|An elder relocates closer to public activities and gives themselves permission to build friendships slowly.
The grandfather's exhibition|retired|comfortable|Small house|An elder prepares a first public exhibition of years of quiet artwork and invites family without making attendance a test of love.
Retirement without reinvention|retired|modest|Small house|A happily retired resident keeps familiar routines and chooses a few small pleasures over pressure to pursue a spectacular second career.
The spare-room lease|room2|tight budget|Shared rental|Two adults formalize a friendly rental arrangement after discovering that verbal agreements leave too much room for assumptions.
The quiet and the social|room2|modest|Shared rental|One housemate loves guests and another needs quiet; they reserve private evenings and agree that invitations require notice.
Two queer newcomers|room2|tight budget|Shared rental|Queer housemates build a welcoming home after relocating, choosing supportive friendships without expecting each other to meet every social need.
The houseplant custody chart|room2|comfortable|Apartment|Housemates with different plant-care habits create a watering chart after one tries to rescue every wilting leaf at once.
The kitchen equipment truce|room2|modest|Shared rental|A keen baker and an enthusiastic cook divide kitchen storage and schedule ambitious projects so dinner remains possible.
A friend after a breakup|room2|tight budget|Shared rental|An adult offers a friend a temporary room after a breakup, then clarifies boundaries before kindness turns into an indefinite obligation.
The communal freezer|room3|tight budget|Shared rental|Three adults of different generations batch-cook together while labeling personal meals and respecting different tastes.
The tenants' repair log|room3|modest|Shared rental|Housemates document maintenance requests collectively and keep practical cooperation separate from whether they become close friends.
The hobby library|room3|comfortable|Shared rental|Three housemates lend hobby equipment to one another, learning that borrowing needs care instructions and clear return dates.
The mixed-shift household|room3|tight budget|Apartment|Three adults work different shifts and use a noticeboard to coordinate sleep, cleaning, and occasional shared meals.
The chosen-family dinner|room3|modest|Shared rental|Housemates form a chosen family through dependable meals and practical support while allowing each other independent outside relationships.
Four keys, one noticeboard|room4|tight budget|Shared rental|Four adults manage a shared rental through written chores, guest limits, and a monthly meeting short enough that everyone will attend.
The cooperative garden house|room4|modest|Shared house|Four residents share a garden and decide collectively how harvests are divided, including provisions for members who cannot do heavy tasks.
The five-person art co-op|room5|tight budget|Shared house|Five adults share work areas and housing costs while protecting individual ownership of artworks and materials.
The mutual-aid household|room5|modest|Shared house|Five residents coordinate a neighborhood pantry and set limits so their home remains a place to rest as well as organize.
Six beginners, one kitchen|room6|tight budget|Shared house|Six adults learn to manage a communal kitchen, appointing rotating cooks and making food allergies part of planning.
The seven-seat meeting|room7|modest|Shared house|Seven residents use a rotating facilitator to make housing decisions, ensuring confident speakers do not control every discussion.
Eight names on the lease|room8|tight budget|Shared house|Eight adults share one house and define storage, guests, chores, and quiet hours before small inconveniences become personal grievances.
The daytime curtains agreement|vampire|comfortable|Shared house|A vampire and human housemate plan different daily routines while finding activities both can enjoy. This is a fictional household, not official lore.
The vampire archivist's guest|vampire|modest|Shared house|A vampire organizes old records with a human friend who insists that privacy and permission still matter when documents are very old.
The modest magic workshop|witch|tight budget|Small house|A spellcaster practices in a modest home and keeps ordinary maintenance on the schedule instead of expecting magic to solve every problem.
The spellcaster's quiet sabbatical|witch|comfortable|Garden cottage|A spellcaster pauses ambitious projects to cultivate an ordinary garden and decide what kind of magic work still feels meaningful.
The wolf and the caretaker|wolf|modest|Shared house|A werewolf and human friend make practical safety arrangements and share home upkeep without defining friendship solely through supernatural difficulties.
The werewolf's study buddy|wolf|tight budget|Shared rental|A werewolf and human friend schedule study sessions around their needs, practicing candid requests instead of guessing what support looks like.
The alien gardening notebook|alien|modest|Small house|An alien keeps careful notes while learning local gardening methods and asks neighbors for advice rather than treating them as specimens.
The alien's ordinary shopping list|alien|comfortable|Apartment|An alien settles into everyday shopping and home routines, developing friendships through shared interests rather than a dramatic secret identity.
The mermaid's inland weekend|mermaid|comfortable|Small house|A mermaid enjoys an ordinary weekend of reading and visiting friends while planning time near water according to their needs.
The mermaid beach steward|mermaid|modest|Small house|A mermaid volunteers in coastal cleanups and encourages human neighbors to share responsibility instead of doing every task alone.
The late-night diner regulars|nightlife|modest|Shared rental|Two adult housemates enjoy late-night meals after work and build a dependable friendship around quiet conversations rather than constant parties.
The open-mic housemates|nightlife|tight budget|Shared rental|Adult housemates support each other's open-mic performances and set a firm rehearsal cutoff so home stays restful.
The club night calendar|nightlife|comfortable|Apartment|Two adult friends plan occasional nights out, balance spending, and arrange safe journeys home without expecting identical energy levels.
The after-hours photo editors|nightlife|modest|Shared rental|Adult housemates edit photography projects late at night while separating paid work from collaborative experiments.
` + additionalHouseholdStories,
  5,
);

export const households: HouseholdPrompt[] = stories.map(
  ([name, key, financialSituation, livingArrangement, backstory]) => {
    const r = rosters[key];
    if (!r) throw new Error(`Unknown roster ${key}`);
    const base = entry('household', name, backstory, {
      categories: [r.category],
      tags: [key],
      requiredPacks: r.pack ? [r.pack] : [],
      adultOnly: r.category === 'adult-only',
      commonness: r.occult ? 0.25 : 0.8,
    });
    return {
      ...base,
      category: r.category,
      minimumMembers: r.ages.length,
      maximumMembers: r.ages.length,
      ageRequirements: r.ages
        .map((age) => ({
          ages: [age],
          minimum: 1,
          maximum: r.ages.filter((item) => item === age).length,
        }))
        .filter(
          (item, i, all) =>
            all.findIndex((other) => other.ages[0] === item.ages[0]) === i,
        )
        .map((item) => ({ ...item, minimum: item.maximum })),
      memberSlots: r.ages.map((age, i) => ({
        id: `${base.id}:slot:${i}`,
        name: r.roles[i],
        allowedAges: [age],
        occult: i === 0 ? (r.occult ?? 'human') : 'human',
        requiredPacks: i === 0 && r.pack ? [r.pack] : [],
      })),
      dynamics: r.ties.map(([from, to, kind], i) => ({
        id: `${base.id}:tie:${i}`,
        fromSlotId: `${base.id}:slot:${from}`,
        toSlotId: `${base.id}:slot:${to}`,
        kind,
      })),
      financialSituation,
      livingArrangement,
      backstory,
    };
  },
);
