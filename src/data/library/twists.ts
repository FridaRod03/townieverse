import type { ContentTheme, Storyline } from '../../types/models';
import { adultAges, entry, rows } from './common';

const specifications = rows(
  `
adult-romance|A newly negotiated boundary|An adult decides which boundaries matter in a consensual relationship with another adult and prepares a clear conversation.
adult-romance|The dating profile pause|An adult pauses online dating after realizing that presenting an impressive persona has become more tiring than meeting people.
adult-romance|The private anniversary|An adult wants to celebrate a relationship quietly and discusses privacy with their adult partner before relatives make plans.
adult-romance|A changed relationship agreement|An adult revisits a consensual relationship agreement because their needs have changed, allowing every adult involved to decline new terms.
adult-romance|The difficult confession|An adult considers disclosing an emotional attachment to another adult and weighs honesty against the temptation to avoid consequences.
adult-romance|The second date question|An adult enjoys a second date with another adult but needs to discuss incompatible long-term plans before becoming more invested.
adult-romance|The public affection conversation|An adult prefers less public affection and explains that preference to their adult partner without treating different needs as rejection.
adult-romance|An adult creator's privacy plan|An adult who makes adult-oriented media reviews privacy, consent, and work boundaries while deciding what to share about their career.
adult-romance|The old adult flame|An adult hears from a former adult partner and decides whether contact would support closure or reopen a pattern they left behind.
adult-romance|The unequal social calendars|An adult notices that a relationship with another adult has crowded out friendships and asks for a healthier balance.
adult-romance|The exclusivity misunderstanding|An adult realizes that exclusivity was assumed rather than agreed and initiates a respectful conversation with the other adult involved.
adult-romance|The separate-bedroom proposal|An adult proposes separate sleeping spaces to their adult partner for better rest and works through the meanings each person attaches to it.
adult-romance|The consensual open relationship check-in|An adult in a consensual open relationship requests a check-in about time, expectations, and boundaries; all other involved partners are adults.
adult-romance|The adult flirtation at work|An adult considers a flirtation with another adult colleague and checks workplace power differences before choosing whether to pursue it.
adult-romance|The unshared romantic past|An adult decides how much of their romantic history to discuss with an adult partner while distinguishing privacy from misleading omission.
adult-romance|The long-distance turning point|An adult in a relationship with another adult questions whether another year of distance suits either person's needs.
adult-romance|The apology after jealousy|An adult recognizes that jealousy has shaped unfair behavior toward their adult partner and plans an apology with concrete changes.
adult-romance|The dating-after-divorce promise|A divorced adult sets realistic expectations before dating another adult, refusing to use a new relationship as a substitute for closure.
adult-romance|An intimacy conversation without pressure|An adult asks their adult partner for an honest conversation about intimacy, leaving room for different preferences and an unpressured refusal.
adult-romance|The friends' unsolicited advice|An adult decides which romantic decisions to keep private when friends repeatedly offer advice about their relationship with another adult.
adult-romance|The adult partner's career move|An adult weighs a partner's relocation proposal and separates affection from pressure to abandon their own plans; both partners are adults.
adult-romance|The uneven emotional labor|An adult notices they organize every relationship conversation and asks their adult partner to share that responsibility.
adult-romance|The romance without marriage|An adult explains to their adult partner why commitment matters to them even though marriage does not.
adult-romance|The honest ending|An adult prepares to end a relationship with another adult kindly and clearly, resisting the impulse to disappear without explanation.
adult-romance|The slower new beginning|An adult chooses a slower pace with a new adult romantic interest and discusses what that pace means before assumptions build.
crime|The unexplained reimbursement|An adult discovers an expense claim in their name that they did not submit and considers reporting it despite pressure to stay quiet.
crime|The stolen community supplies|An adult responsible for a shared project notices missing supplies and chooses how to document concerns without accusing neighbors on rumor alone.
crime|The inherited stolen object|An adult finds credible evidence that an inherited collectible was stolen and must decide how to return it responsibly.
crime|The suspicious business partner|An adult sees irregular records in a business partnership and seeks accountable advice before signing another agreement.
crime|The unpaid restitution|An adult who previously committed a property offense struggles to complete restitution and asks for a lawful, realistic payment arrangement.
crime|The forged recommendation|An adult learns that someone has forged a reference using their name and decides how to correct the record.
crime|The blackmail message|An adult receives a blackmail demand and weighs trusted support and reporting rather than handling the threat alone.
crime|The false alibi request|An adult is asked by a friend to provide a false alibi and must confront the difference between loyalty and complicity.
crime|The shop's missing takings|An adult shopkeeper notices missing money and considers fair procedures that protect staff from unsupported accusations.
crime|The returned stolen bicycle|An adult receives a bicycle believed to be stolen and chooses how to locate its owner without placing themselves at risk.
crime|The charity account discrepancy|An adult volunteer finds mismatched charity records and documents the issue before confronting the person who controls the accounts.
crime|The counterfeit heirloom sale|An adult discovers that a valuable item was sold under false claims and decides whether to seek a refund or expose a pattern.
crime|The witness who hesitates|An adult witnesses a nonviolent theft and considers how to provide accurate information while acknowledging what they did not see.
crime|The criminal past disclosure|An adult with a past conviction decides how to discuss it in a new professional setting without letting it define their entire identity.
crime|The illegal dumping report|An adult finds evidence of repeated illegal dumping near a shared space and works with neighbors to report facts rather than speculation.
crime|The misused identity|An adult discovers purchases made through identity fraud and prioritizes support and recovery over tracking down the offender personally.
crime|The dishonest landlord's paperwork|An adult finds signs of rental fraud and organizes documents while considering safe housing options and appropriate advice.
crime|The friend hiding stolen goods|An adult realizes a friend has stored stolen goods in their home and establishes a firm boundary despite the risk to the friendship.
crime|The quiet embezzlement rumor|An adult hears a workplace embezzlement rumor and distinguishes first-hand evidence from gossip before taking action.
crime|The auction with uncertain provenance|An adult plans to bid on an object but discovers missing ownership records and pauses the purchase.
crime|The broken promise after probation|An adult rebuilding life after probation must choose between old associates' expectations and the stability they have begun to establish.
crime|The suspicious invoice|An adult is pressured to approve an invoice for work that never happened and considers the consequences of refusing.
crime|The neighborhood vandalism apology|An adult admits to damaging shared property and must offer repair without demanding instant forgiveness.
crime|The missing evidence notebook|An adult documenting suspected fraud loses their notes and reconstructs only what they can honestly substantiate.
crime|The art attribution dispute|An adult learns that someone is selling their work under another name and seeks a documented resolution without retaliatory harassment.
substance-use|The sober celebration plan|An adult in recovery arranges a substance-free celebration and explains their boundaries to friends without sharing more history than they wish.
substance-use|The social drinking reassessment|An adult notices drinking has become automatic at social events and experiments with a change in routine.
substance-use|The recovery meeting commute|An adult makes room in a busy week for recovery support and asks a trusted friend for practical help getting there.
substance-use|The smoke-free home agreement|An adult who smokes discusses a smoke-free shared home and weighs other residents' needs alongside their own habits.
substance-use|The alcohol-free dating choice|An adult chooses alcohol-free dates and plans how to explain that preference without treating it as a test for other adults.
substance-use|The relapse conversation|An adult experiencing a setback in recovery considers reaching out to trusted support instead of concealing the struggle.
substance-use|The late-night habit audit|An adult examines how substance use has affected sleep and daily responsibilities and seeks support for changes they want to make.
substance-use|The friend's repeated offers|An adult asks a friend to stop offering substances and evaluates whether the friendship respects clearly stated boundaries.
substance-use|The recovery milestone without spectacle|An adult marks a recovery milestone privately and chooses one meaningful activity instead of a public announcement.
substance-use|The sober hobby group|An adult looks for social activities where substance use is not central and learns how to join a new group as a beginner.
substance-use|The smoking break replacement|An adult trying to stop smoking experiments with a different work-break routine and asks colleagues not to make jokes about setbacks.
substance-use|The family gathering boundary|An adult sets boundaries around alcohol at a gathering and plans a calm exit if those boundaries are repeatedly ignored.
substance-use|The recovery budget|An adult reviews spending linked to past substance use and builds a budget that includes support and manageable pleasures.
substance-use|The changing friendship rituals|An adult in recovery asks friends to replace substance-centered rituals with shared meals or walks.
substance-use|The return to an old venue|An adult considers attending an event at a place associated with earlier substance use and makes a support plan before deciding.
substance-use|The cannabis conversation|An adult who uses cannabis discusses household boundaries and considers whether the habit still fits their responsibilities and local circumstances.
substance-use|The medication misuse admission|An adult concerned about misusing medication chooses to speak honestly with a qualified professional rather than adjusting treatment alone.
substance-use|The recovery anniversary invitation|An adult decides which trusted friends to invite to a recovery anniversary and protects their choice from public pressure.
substance-use|The new non-drinking host|An adult who no longer drinks experiments with hosting gatherings that do not revolve around alcohol.
substance-use|The workplace party alternative|An adult asks for an inclusive alternative to a substance-centered workplace event without disclosing private recovery information.
substance-use|The honest morning check-in|An adult notices that substance use is affecting their mornings and confides in someone who will listen without minimizing the concern.
substance-use|The supportive adult sibling|An adult in recovery asks an adult sibling for practical support and explains which kinds of monitoring would feel intrusive.
substance-use|The alcohol collection decision|An adult reassessing drinking decides what to do with a valuable alcohol collection without using its cost as a reason to keep drinking.
substance-use|The vacation routine safeguard|An adult in recovery plans a vacation with reliable support options and room for ordinary rest.
substance-use|The private quit attempt|An adult begins another attempt to stop smoking and requests encouragement that respects their privacy and autonomy.
`,
  3,
);
export const twists: Storyline[] = specifications.map(
  ([theme, name, description]) => ({
    ...entry('twist', name, description, {
      adultOnly: true,
      allowedAges: adultAges,
      themes: [theme as ContentTheme],
      categories: ['mature-storyline'],
      tags: [theme],
      commonness: 0.35,
    }),
    participantIds: [],
  }),
);
