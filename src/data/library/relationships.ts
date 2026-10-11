import type { DynamicKind, Relationship } from '../../types/models';
import { adultAges, entry, rows, supportedAges } from './common';
import { additionalRelationshipStories } from './relationshipStories';
// Romance/ex-partner scenarios are adult only by age, without enabling sexual content.
const specs = rows(
  `
family|positive|siblings|The shared secret recipe|Siblings revive a recipe they both remember differently and enjoy discovering which details each preserved.
family|neutral|siblings|The unequal keepsakes|Siblings discuss how to divide sentimental possessions before either assumes that practical value measures affection.
family|negative|siblings|The comparison habit|One sibling is tired of being compared with the other and asks for a relationship that makes room for separate achievements.
family|positive|biological-parent|The patient's teacher|A parent lets a child teach them an unfamiliar hobby, making curiosity more important than adult expertise.
family|neutral|biological-parent|The changing curfew|A parent and teen revisit a household rule and practice explaining concerns without turning the discussion into a contest.
family|negative|biological-parent|The unwanted advice|A parent repeatedly offers advice that their child did not request and must learn to ask before helping.
family|positive|adoptive-parent|The question without punishment|An adoptive parent responds warmly when a child asks about earlier family connections, protecting room for curiosity.
family|neutral|adoptive-parent|The private family story|An adoptive parent and child agree which family details can be shared at school or with neighbors.
family|positive|step-parent|The small reliable promise|A stepparent earns trust by keeping an ordinary promise instead of demanding immediate affection.
family|neutral|step-parent|The chosen form of address|A child chooses how to address a stepparent, who accepts the name without treating it as a ranking.
family|negative|step-parent|The rushed closeness|A stepparent pushes for shared traditions too quickly and must give the child room to feel differently.
family|positive|siblings|The encouraging audience|Siblings attend each other's performances and give the kind of feedback each actually wants.
family|neutral|siblings|The different holiday plans|Siblings choose separate holiday plans and work through the fear that independence means their connection is fading.
family|negative|siblings|The borrowed item dispute|A sibling borrows something without permission and needs to repair trust rather than dismiss the complaint as petty.
family|positive|biological-parent|The accepted changed goal|A parent supports a child's changed ambition without mourning the plan they once imagined for them.
friendship|positive|-|The first reliable invitation|A newcomer receives a recurring invitation from a local friend and starts feeling welcome without having to perform enthusiasm.
friendship|neutral|-|The unfinished borrowed book|Friends negotiate a book's return after one keeps postponing reading it, learning that a small promise can still matter.
friendship|negative|-|The one-sided organizer|A friend realizes they arrange every meeting and asks the other person to share the effort.
friendship|positive|-|The patient mentor|An experienced adult teaches another adult a skill while encouraging their own approach rather than reproducing a miniature version of themselves.
friendship|neutral|-|The mentor's retirement|An adult mentor steps back and asks an adult learner which kinds of contact would help them continue independently.
friendship|negative|-|The advice mistaken for orders|An adult learner feels controlled by an adult mentor's advice and asks for a more collaborative arrangement.
friendship|positive|-|The shared beginner class|Two friends join a beginner class and agree that neither needs to be good at it for the experience to count.
friendship|neutral|-|The quieter friendship season|Friends see each other less during a busy period and clarify that reduced contact does not automatically mean rejection.
friendship|negative|-|The joke that stopped being funny|One friend explains that a recurring joke hurts, and the other must choose between defensiveness and changing the habit.
friendship|positive|-|The honest rehearsal partner|Friends practice an important conversation together while allowing the speaker to choose their own words.
friendship|neutral|-|The separate travel budgets|Friends want to travel together but have different budgets, prompting a plan that avoids hidden financial pressure.
friendship|negative|-|The gossip boundary|A friend asks the other to stop sharing private stories with a wider social circle.
friendship|positive|-|The remembered ordinary detail|A friend remembers a small preference during a difficult week, offering care without requiring a dramatic explanation.
friendship|neutral|-|The hobby that lost its appeal|Friends acknowledge that one no longer enjoys their shared hobby and look for another way to spend time together.
friendship|negative|-|The competitive compliment|One friend turns compliments into comparisons and has to learn to celebrate another person's success directly.
romantic|positive|-|The slow mutual interest|Two adults discuss a growing romantic interest and agree on a pace that lets both feel comfortable.
romantic|neutral|-|The different future maps|Adult romantic partners compare future plans and discover that a happy present does not settle every practical question.
romantic|negative|-|The unheard request|An adult romantic partner repeatedly overlooks a clearly stated need, prompting a conversation about whether change is possible.
romantic|positive|-|The practical love language|Two adult partners recognize affection in ordinary acts of care while making room for the forms of affection each prefers.
romantic|neutral|-|The relocation decision|Two adult partners weigh a possible move and avoid treating one person's career as automatically more important.
romantic|negative|-|The public argument aftermath|Adult partners disagree in front of friends and must repair both their communication and the discomfort they created.
romantic|positive|-|The supportive separate ambitions|Two adult partners encourage independent ambitions and schedule shared time without requiring matching interests.
romantic|neutral|-|The different household standards|Adult partners planning to live together compare expectations about cleaning before they sign a lease.
romantic|negative|-|The promises kept on hold|One adult partner keeps postponing a decision, leaving the other to ask for an honest answer rather than another reassurance.
romantic|positive|-|The comfortable quiet date|Two adults discover they enjoy quiet company and stop measuring a date's success by how much they spend.
ex-partners|positive|-|The respectful return of belongings|Former adult partners return belongings carefully and end the exchange without using keepsakes to restart an argument.
ex-partners|neutral|-|The shared friend's wedding|Adult ex-partners discuss attending a mutual friend's celebration and agree not to make the event about their history.
ex-partners|negative|-|The unwanted repeated contact|An adult former partner ignores a request for distance, prompting the other adult to reinforce a clear boundary.
ex-partners|positive|-|The kind closing conversation|Adult former partners acknowledge what was good while accepting that ending the relationship was the right decision.
ex-partners|neutral|-|The shared hobby space|Adult ex-partners keep attending the same hobby group and agree on considerate ways to share the space.
ex-partners|negative|-|The selective breakup story|One adult ex-partner tells a misleading account of the breakup and the other must decide how much to correct publicly.
coworkers|positive|-|The fair credit meeting|Coworkers make sure a quiet contributor receives credit for an idea instead of letting the most confident presenter claim it.
coworkers|neutral|-|The different meeting styles|Coworkers compare preferences for written updates and live meetings, searching for a method that serves the work.
coworkers|negative|-|The repeated last-minute handoff|A coworker repeatedly passes unfinished work to another person just before deadlines, forcing a clear discussion of responsibilities.
coworkers|positive|-|The considerate onboarding|A coworker welcomes a newcomer with practical guidance and asks which help would be useful instead of overwhelming them.
coworkers|neutral|-|The lunch invitation choice|Coworkers learn that declining a lunch invitation can mean a need for quiet rather than dislike.
coworkers|negative|-|The confidential draft leak|A coworker shares an unfinished draft without permission and must acknowledge the effect on the other person's trust.
coworkers|positive|-|The backup during leave|Coworkers plan coverage before a colleague takes leave, keeping assistance practical and avoiding intrusive questions.
coworkers|neutral|-|The promotion conversation|Coworkers discuss competing for a promotion and agree to keep the process separate from their everyday collaboration.
coworkers|negative|-|The unequal interruptions|One coworker repeatedly interrupts another in meetings and is asked to change the pattern rather than dismiss its impact.
neighbors|positive|-|The reliable parcel shelf|Neighbors establish a safe parcel arrangement and respect the limits of how often each can help.
neighbors|neutral|-|The fence replacement plan|Neighbors compare preferences for a shared boundary and discuss cost before either starts construction.
neighbors|negative|-|The noisy rehearsal hours|A neighbor's rehearsal schedule disrupts another household and they must negotiate useful quiet hours.
neighbors|positive|-|The shared seed exchange|Neighbors exchange garden seeds and growing notes without turning different methods into a contest.
neighbors|neutral|-|The unfamiliar welcome gift|A well-meant gift does not suit a new neighbor, prompting both to practice graciousness and clearer communication.
neighbors|negative|-|The borrowed parking space|A neighbor repeatedly uses a parking space without asking, forcing a conversation about an inconvenience they considered trivial.
neighbors|positive|-|The accessible gathering plan|Neighbors ask one another about practical access needs before organizing a shared event.
neighbors|neutral|-|The shared delivery mix-up|Neighbors sort out repeatedly misdelivered mail and create a simple routine rather than blaming one another.
neighbors|negative|-|The intrusive questions|A neighbor asks too many personal questions and must learn that friendliness does not grant access to private information.
neighbors|positive|-|The storm cleanup pair|Neighbors help clear a shared path after a storm and check which tasks each can safely manage.
rivalry|positive|-|The rivals who improve together|Two rivals exchange useful feedback and discover that competition can coexist with real respect.
rivalry|neutral|-|The tied contest result|Rivals finish a contest equally and must decide whether a rematch would be enjoyable or merely satisfy pride.
rivalry|negative|-|The sabotaged presentation|A rival deliberately undermines another person's presentation, creating consequences that cannot be dismissed as ordinary competition.
rivalry|positive|-|The generous winner|A rival wins a contest and acknowledges what they learned from the other competitor.
rivalry|neutral|-|The rivalry nobody else sees|Two people keep score over tiny achievements while friends remain unaware that a competition exists.
rivalry|negative|-|The copied signature idea|A rival copies a distinctive idea and insists it was coincidence, making trust harder to restore than originality.
rivalry|positive|-|The shared fundraiser goal|Rivals put a disagreement aside to support a community project, choosing a shared outcome over personal recognition.
rivalry|neutral|-|The old school comparison|Former classmates still compare progress and question whether the habit fits their adult lives.
rivalry|negative|-|The moving goalposts|A rival changes the standard whenever the other succeeds, revealing that fair competition was never the real aim.
chosen-family|positive|-|The holiday with chosen names|Chosen-family members organize a holiday where everyone's names and preferred forms of address are respected.
chosen-family|neutral|-|The changing care agreement|Chosen-family members revisit practical support arrangements as their schedules and needs change.
chosen-family|negative|-|The assumed unlimited help|A chosen-family member assumes support has no limits, prompting a discussion that separates affection from constant availability.
chosen-family|positive|-|The emergency contact invitation|One adult asks another trusted adult to become an emergency contact and explains why their chosen connection matters.
chosen-family|neutral|-|The separate new friendship|A chosen-family bond adapts when one person develops a new friendship without treating it as disloyalty.
chosen-family|negative|-|The private milestone announced|A chosen-family member shares another person's milestone publicly without permission and needs to repair the breach.
estranged-relatives|positive|siblings|The carefully reopened door|Estranged siblings agree to a short meeting with clear boundaries and no promise of instant reconciliation.
estranged-relatives|neutral|siblings|The invitation without expectation|An estranged sibling sends an invitation while explicitly accepting that the other may decline.
estranged-relatives|negative|siblings|The apology with conditions|An estranged sibling offers an apology that demands immediate forgiveness, making the other question whether contact is wise.
estranged-relatives|neutral|biological-parent|The limited contact agreement|An estranged parent and child define what limited contact means, including topics they are not ready to discuss.
estranged-relatives|positive|biological-parent|The accountable first letter|An estranged parent writes a letter that acknowledges their behavior without asking the child to manage their feelings.
estranged-relatives|negative|biological-parent|The boundary ignored again|An estranged relative disregards an agreed boundary, and the other person considers stepping back from contact.
business-partners|positive|-|The written partnership values|Adult business partners agree on clear values and responsibilities before growth makes informal promises harder to interpret.
business-partners|neutral|-|The different risk budgets|Adult business partners disagree about expansion and compare the amount of risk each can actually afford.
business-partners|negative|-|The undisclosed side deal|An adult business partner discovers an undisclosed deal that conflicts with their agreement and requests full transparency.
business-partners|positive|-|The fair exit arrangement|Adult business partners plan an amicable departure, recognizing contributions without using the exit to settle old frustrations.
business-partners|neutral|-|The brand direction fork|Adult business partners prefer different creative directions and test options before assuming one must abandon their vision.
business-partners|negative|-|The promises made without consent|An adult partner commits the business to work without consulting the other, forcing a conversation about authority and accountability.
` + additionalRelationshipStories,
  5,
);
export const relationships: Relationship[] = specs.map(
  ([kind, tone, tie, name, description]) => ({
    ...entry('relationship', name, description, {
      categories: [kind],
      tags: [tone],
      allowedAges:
        ['romantic', 'ex-partners', 'business-partners', 'coworkers'].includes(
          kind,
        ) ||
        /\badult\b/i.test(description) ||
        name.toLowerCase().includes('mentor')
          ? adultAges
          : /\bteen\b/i.test(description)
            ? ['teen', ...adultAges]
            : supportedAges,
      commonness: tone === 'negative' ? 0.35 : 0.8,
    }),
    kind: kind as Relationship['kind'],
    tone: tone as Relationship['tone'],
    ...(tie === '-' ? {} : { familyTie: tie as DynamicKind }),
  }),
);
