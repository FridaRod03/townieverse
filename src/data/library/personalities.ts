import type { PersonalityProfile } from '../../types/models';
import { adultAges, entry, rows, supportedAges } from './common';
import { additionalBackgroundStories } from './backgroundStories';
// Backgrounds describe prior experiences or interests, never overwrite a generated current career.
// Suggested occupations are narrative ideas, not official career IDs or requirements.
const specs = rows(
  `
The patient restorer|adult|Years of repairing discarded objects taught this Sim to notice potential where others see inconvenience.|Restoring furniture;Sketching repairs|Finish one restoration and document what they learned.|Keeps too many unfinished projects|Practical;Patient|Craftsperson
The former event organizer|adult|After organizing countless gatherings for other people, this Sim wants friendships that do not depend on being useful.|Cooking;Walking|Attend an event without taking responsibility for it.|Finds it hard to delegate|Generous;Organized|Event coordinator
The returning learner|adult|This Sim is revisiting a subject they abandoned years ago and values progress more than appearing naturally talented.|Reading;Practice exercises|Complete a beginner course.|Compares their progress with younger learners|Curious;Persistent|Education
The careful beginner|all|A difficult first attempt taught this Sim to prepare thoroughly, but they are learning that preparation cannot eliminate every mistake.|Puzzles;Drawing|Share something unfinished with a trusted person.|Waits too long to start|Thoughtful;Cautious|Research
The neighborhood listener|adult|Years of hearing neighbors' stories made this Sim a attentive listener who now wants to share more of their own life.|Journaling;Community walks|Tell a personal story at a small gathering.|Deflects questions about themselves|Empathetic;Observant|Writing
The former frequent traveler|adult|Constant travel once defined this Sim's routine; staying in one place now offers unfamiliar pleasures and responsibilities.|Postcard collecting;Photography|Build a regular local friendship.|Plans an escape whenever routines become difficult|Independent;Adaptable|Travel writing
The family recipe keeper|all|This Sim learned recipes from someone important and enjoys preserving both practical instructions and the memories attached to them.|Cooking;Scrapbooking|Record a recipe in their own words.|Resists small changes to familiar methods|Warm;Reflective|Culinary
The apologetic overachiever|all|Praise for early achievements left this Sim uncomfortable with being a beginner, but they want to enjoy learning without a score.|Music practice;Board games|Try a hobby without tracking performance.|Turns relaxation into a competition|Ambitious;Self-aware|Any field
The once-shy performer|all|A welcoming audience helped this Sim discover that performing can be a conversation rather than a test of worth.|Singing;Storytelling|Perform one original piece.|Rehearses introductions more than the work|Expressive;Sensitive|Entertainer
The ordinary optimist|all|Reliable small kindnesses shaped this Sim's confidence that daily life can improve without a spectacular transformation.|Gardening;Walking|Help establish a pleasant shared routine.|Assumes others can see the same possibilities|Hopeful;Steady|Community work
The former night-shift worker|adult|Working unusual hours taught this Sim how much daily schedules shape friendship, rest, and access to ordinary services.|Reading;Cooking breakfast|Build a routine that protects sleep and social time.|Says yes to plans when exhausted|Resourceful;Considerate|Any field
The reclaimed hobbyist|adult|This Sim once tried to monetize every hobby and now wants one activity that can remain private and imperfect.|Painting;Birdwatching|Keep a hobby free of income targets.|Calculates potential profit without meaning to|Creative;Pragmatic|Painter
The meticulous collector|all|A small collection grew into an interest in provenance, storage, and the stories people attach to everyday objects.|Collecting postcards;Cataloging|Create a clear inventory.|Confuses completing a set with enjoying it|Attentive;Methodical|Archival work
The thoughtful quitter|adult|Leaving a once-valued project taught this Sim that commitment can include recognizing when a path no longer fits.|Hiking;Journaling|Choose a new project for present-day reasons.|Expects others to see quitting as failure|Reflective;Resolute|Any field
The former team captain|adult|Being responsible for a team taught this Sim to organize people, but they are learning how to participate without leading.|Sports;Strategy games|Join a group as an ordinary member.|Offers instructions before listening|Confident;Protective|Athlete
The independent homebody|all|This Sim enjoys a quiet home and wants to maintain friendships without pretending to prefer a crowded social calendar.|Baking;Reading|Invite one friend to a relaxed afternoon.|Declines invitations without explaining what would work|Calm;Selective|Writing
The eager apprentice|adult|A supportive mentor introduced this Sim to a craft, and they now want to develop an approach that reflects their own interests.|Woodworking;Design sketching|Make a piece without copying a tutorial.|Seeks approval before every decision|Curious;Respectful|Craftsperson
The considerate debater|all|Early arguments taught this Sim that being correct is less satisfying when nobody feels heard.|Reading;Discussion groups|Ask a useful question before offering a rebuttal.|Still prepares replies while others speak|Analytical;Fair-minded|Law
The optimistic repairer|adult|Repeated practical setbacks made this Sim inventive rather than cynical, though they sometimes underestimate how long repairs will take.|Bicycle repair;Tool organizing|Finish a repair within a realistic schedule.|Promises completion too quickly|Inventive;Upbeat|Handyperson
The former people-pleaser|adult|This Sim is learning to decline requests clearly after years of treating other people's disappointment as their responsibility.|Walking;Personal journaling|Say no to one unsuitable commitment.|Overexplains every boundary|Kind;Determined|Any field
The quiet host|adult|This Sim learned that hospitality can mean making space for comfortable silence rather than entertaining everyone constantly.|Tea preparation;Table setting|Host a gathering with no packed agenda.|Worries that quiet guests are unhappy|Welcoming;Reserved|Hospitality
The local mapmaker|all|Exploring familiar streets made this Sim curious about overlooked paths and the different ways neighbors experience the same area.|Drawing maps;Photography|Make a useful map with neighbors' input.|Assumes their favorite route suits everyone|Curious;Practical|Design
The late-blooming musician|adult|Beginning music later than expected taught this Sim to value repetition and the pleasure of a sound finally coming together.|Instrument practice;Listening sessions|Play a short piece for a friend.|Apologizes for every wrong note|Patient;Expressive|Entertainer
The friendly skeptic|all|This Sim enjoys enthusiastic friends while preferring to check claims before adopting their newest plan.|Puzzles;Science reading|Explain a disagreement without dismissing excitement.|Sounds more certain than their evidence warrants|Reasoned;Sociable|Research
The careful gift giver|all|Meaningful gifts from someone close taught this Sim to notice small preferences rather than equate generosity with expense.|Crafting cards;Baking|Make a gift the recipient will actually use.|Overthinks whether affection was understood|Attentive;Generous|Craftsperson
The practical dreamer|all|A large ambition feels more manageable to this Sim when divided into small steps that leave room for ordinary life.|Planning notebooks;Drawing|Complete the next modest step in a long project.|Mistakes planning for progress|Imaginative;Grounded|Design
The former moving-day expert|adult|Frequent moves taught this Sim efficient packing but made it harder to invest in relationships that might survive another departure.|Home arranging;Postcard writing|Build a friendship that can continue across distance.|Keeps possessions permanently packed|Adaptable;Guarded|Any field
The reformed scorekeeper|adult|Competition once shaped this Sim's friendships; they now want to enjoy other people's success without mentally updating a ranking.|Cooperative games;Walking|Celebrate a friend's milestone directly.|Turns compliments into comparisons|Driven;Reflective|Athlete
The garden experimenter|all|Failed seedlings taught this Sim to keep notes and treat unexpected growth as information rather than embarrassment.|Gardening;Nature journaling|Compare two growing methods patiently.|Starts more experiments than they can maintain|Curious;Resilient|Gardener
The careful storyteller|all|A misunderstanding about a family story taught this Sim to distinguish what they remember from what they merely heard.|Journaling;Recording interviews|Preserve one story with permission.|Interrupts stories to correct small details|Thoughtful;Precise|Writer
The former substitute organizer|adult|Repeatedly filling in for others made this Sim capable in a crisis, but they want to be included before emergencies occur.|Cooking;Puzzle solving|Ask for inclusion in ordinary plans.|Waits to be needed before reaching out|Dependable;Reserved|Administration
The patient puzzle partner|all|Shared puzzle evenings taught this Sim to enjoy collaboration when different people notice different patterns.|Jigsaws;Board games|Finish a difficult puzzle with a friend.|Takes over when progress slows|Analytical;Cooperative|Tech Guru
The new boundary setter|adult|This Sim is learning to protect time for themselves after equating a crowded schedule with being valued.|Reading;Solo walks|Keep one evening free of obligations.|Feels compelled to justify rest|Compassionate;Growing confidence|Any field
The former trend follower|adult|Trying every new trend left this Sim with clutter and a clearer sense of which interests actually last.|Wardrobe editing;Photography|Create a small wardrobe that feels personal.|Still buys supplies for fleeting interests|Expressive;Reflective|Style Influencer
The neighborhood novice|adult|After relocating, this Sim wants to understand local routines without expecting neighbors to explain everything for free.|Walking;Library visits|Find one recurring community activity.|Reads quietness as rejection|Friendly;Curious|Any field
The fair-minded competitor|all|A memorable unfair contest made this Sim protective of clear rules and willing to acknowledge another person's stronger performance.|Sports;Strategy games|Compete with respect for opponents.|Gets stuck on minor rule disputes|Principled;Energetic|Athlete
The small-business observer|adult|Helping in a modest business introduced this Sim to the patience behind everyday service and sparked curiosity about running one someday.|Budget planning;Product sketching|Draft a manageable small-business idea.|Underestimates administrative work|Enterprising;Observant|Business
The former reluctant reader|all|Finding the right book transformed this Sim's view of reading, and they enjoy matching stories to people's interests.|Reading;Book swapping|Recommend a book without pressuring anyone.|Assumes one favorite book will suit everybody|Enthusiastic;Considerate|Writing
The patient pet volunteer|adult|Volunteering around animals taught this Sim that quiet consistency can matter more than visible excitement.|Walking;Sketching animals|Establish a reliable volunteer routine.|Takes on more tasks than they can sustain|Gentle;Dependable|Community work
The confident ordinary cook|all|Making basic meals reliably gave this Sim a sense of independence and an appreciation for food that does not need to impress.|Cooking;Recipe notes|Teach someone one useful meal.|Defends familiar recipes too quickly|Practical;Warm|Culinary
The amateur sound archivist|adult|Collecting everyday sounds made this Sim attentive to overlooked details and respectful of consent when recording other people.|Sound recording;Walking|Assemble a short ambient sound project.|Records more material than they can organize|Observant;Creative|Media production
The former classroom helper|adult|Helping other learners taught this Sim to explain patiently, but they are exploring interests beyond being the person with answers.|Reading;Creative writing|Ask for help in an unfamiliar subject.|Hides uncertainty behind reassurance|Supportive;Thoughtful|Education
The steadfast pen pal|all|A long correspondence taught this Sim that friendship can grow through modest updates rather than constant excitement.|Letter writing;Drawing cards|Maintain a correspondence with realistic expectations.|Feels guilty when replies take time|Loyal;Reflective|Writer
The newly comfortable single|adult|This Sim is learning to enjoy life independently after years of organizing plans around a partner's preferences.|Museum visits;Cooking|Plan a day based entirely on their own interests.|Asks permission for ordinary choices|Independent;Tentatively confident|Any field
The considerate improviser|all|Unexpected changes taught this Sim to adapt quickly while recognizing that others may need time to adjust.|Improvised music;Cooking experiments|Help a group revise a plan calmly.|Changes direction without explaining it|Flexible;Inventive|Entertainer
The cautious collaborator|adult|A disappointing group project made this Sim careful about responsibilities, though they still want to make something with others.|Design sketching;Shared workshops|Join a project with clear roles.|Expects collaborators to let them down|Methodical;Hopeful|Design
The practical archivist|adult|Sorting a relative's papers showed this Sim how much history depends on labels, permission, and patient organization.|Cataloging photos;Local history|Organize one archive so others can use it.|Keeps material without deciding why|Precise;Reflective|Archival work
The relaxed style experimenter|all|Playing with clothes helped this Sim express changing moods without treating any look as proof of identity.|Wardrobe styling;Drawing|Try a new silhouette with existing clothes.|Uses outfits to avoid naming feelings|Creative;Playful|Style Influencer
The attentive meal planner|adult|Cooking around different household needs taught this Sim that thoughtful planning can make daily life feel welcoming.|Cooking;Budget planning|Create a flexible shared menu.|Interprets changed plans as wasted effort|Considerate;Organized|Culinary
The patient weather watcher|all|Keeping weather notes gave this Sim a way to notice change while appreciating how much remains beyond control.|Skywatching;Nature journals|Maintain a month of observations.|Wants every pattern to produce a prediction|Curious;Steady|Research
The former community performer|adult|Performing at local events taught this Sim to connect with an audience, and they now want to make work that feels personal.|Music practice;Writing lyrics|Write a piece without tailoring it to applause.|Anticipates criticism before creating|Expressive;Sensitive|Entertainer
The reflective former athlete|adult|Stepping away from organized competition gave this Sim a chance to enjoy movement without measuring every result.|Walking;Gentle exercise|Find an activity that feels sustainable.|Tracks performance when intending to relax|Disciplined;Reflective|Athlete
The young question collector|child|This child keeps a notebook of questions and enjoys adults who admit when they do not know an answer.|Drawing questions;Reading|Investigate one question with a trusted adult.|Changes topics before finishing an experiment|Curious;Eager|Student
The playground peacemaker|child|Helping friends resolve small disagreements made this child proud, but they are learning that not every dispute is theirs to fix.|Cooperative games;Drawing|Join a game without organizing everyone.|Assumes they must keep every friend happy|Kind;Responsible|Student
The aspiring comic maker|child|This child tells stories through drawings and wants to share a comic even when some pages look different from the plan.|Drawing comics;Reading|Complete a short original comic.|Restarts whenever a page feels imperfect|Imaginative;Persistent|Student
The careful first collector|child|A small collection teaches this child how to choose, organize, and enjoy objects without needing every possible item.|Collecting leaves;Scrapbooking|Make a labeled collection page.|Wants to complete a set immediately|Attentive;Enthusiastic|Student
The lunch-table newcomer|child|After changing schools, this child hopes to find friends through shared interests rather than pretending to enjoy every activity.|Board games;Drawing|Invite one classmate to play.|Agrees too quickly when worried about belonging|Friendly;Tentative|Student
The teenage rehearsal organizer|teen|This teen coordinates a small creative group and is learning that keeping a schedule is different from controlling everyone's ideas.|Music practice;Poster drawing|Finish a collaborative performance.|Takes disagreement personally|Organized;Creative|Part-time work
The teen repair hobbyist|teen|Repairing an old item gave this teen confidence to learn practical skills through research and patient trial.|Bicycle maintenance;Design sketching|Complete a supervised repair.|Rushes the last few steps|Resourceful;Eager|Handyperson
The teen library regular|teen|Regular library visits give this teen a quiet place to explore interests beyond what friends expect of them.|Reading;Writing notes|Share one unexpected interest with a friend.|Hides enthusiasm to avoid teasing|Thoughtful;Independent|Writing
The teen fair-play advocate|teen|An unfair school contest made this teen attentive to rules and interested in supporting classmates whose contributions are overlooked.|Sports;Debate|Help organize an inclusive activity.|Argues about details after the useful discussion ends|Principled;Energetic|Community work
The elder beginner painter|elder|This elder starts painting after years of believing creativity belonged to other people and finds satisfaction in ordinary practice.|Painting;Museum visits|Finish a small series of paintings.|Apologizes for being a beginner|Patient;Newly adventurous|Painter
The elder local historian|elder|Long memories make this elder a valuable storyteller who carefully separates personal recollection from documented facts.|Photo cataloging;Local walks|Record a story with permission and context.|Expects newcomers to know old landmarks|Reflective;Precise|Archival work
The elder new neighbor|elder|Moving to a new area later in life makes this elder both experienced and a beginner in the practical routines of a different place.|Walking;Reading|Find a recurring local gathering.|Hesitates to ask simple questions|Independent;Curious|Community work
The elder friendship gardener|elder|This elder actively nurtures friendships through small invitations and accepts that social circles change throughout life.|Gardening;Letter writing|Invite an acquaintance into a shared routine.|Feels responsible for maintaining every connection|Warm;Persistent|Gardener
The elder digital learner|elder|Learning unfamiliar technology gives this elder new ways to connect, while they insist on explanations that respect their existing knowledge.|Photography;Puzzle games|Complete one useful digital project.|Becomes frustrated with unexplained terminology|Determined;Thoughtful|Any field
The calm foster-home supporter|adult|Experience supporting a foster-inspired household taught this Sim to value predictability, privacy, and the child's own account of what helps. This is roleplay, not an official foster mechanic.|Meal planning;Reading|Create a dependable routine with trusted support.|Offers solutions before asking what is wanted|Patient;Respectful|Community work
The queer community organizer|adult|Helping create welcoming queer community spaces taught this Sim to balance celebration with practical access and sustainable volunteering.|Event planning;Designing flyers|Share organizing responsibility with a team.|Treats every request as urgent|Welcoming;Pragmatic|Community work
The adoptive parent's learning curve|adult|Learning to parent an adopted child made this Sim more willing to ask informed questions and less willing to assume love erases every complexity.|Reading;Cooking|Build routines that respect the child's voice.|Wants reassurance that every choice is right|Caring;Reflective|Any field
The grandparent caregiver's notebook|elder|Caring for a grandchild introduced this elder to new school systems and reminded them that experience does not replace listening.|Calendar keeping;Baking|Ask for practical help without guilt.|Keeps difficulties private for too long|Protective;Adaptable|Any field
` + additionalBackgroundStories,
  8,
);
export const personalities: PersonalityProfile[] = specs.map(
  ([
    name,
    age,
    description,
    hobbies,
    personalGoal,
    flaw,
    suggestions,
    careers,
  ]) => ({
    ...entry('background', name, description, {
      categories: ['background'],
      allowedAges:
        age === 'adult'
          ? adultAges
          : age === 'all'
            ? supportedAges
            : [age as 'child' | 'teen' | 'elder'],
      tags: [age],
    }),
    hobbies: hobbies.split(';'),
    likes: hobbies.split(';'),
    dislikes: [],
    personalGoal,
    flaw,
    personalitySuggestions: suggestions.split(';'),
    careerSuggestions: careers.split(';'),
  }),
);
