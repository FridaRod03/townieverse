import type { Aesthetic } from '../../types/models';
import {
  adultAges,
  entry,
  list,
  rows,
  supportedAges,
  verified,
} from './common';
import { worlds } from './worlds';

const sources: Record<string, string> = {
  j: 'https://en.wikipedia.org/wiki/Japanese_street_fashion',
  mori: 'https://the-comm.online/blog/the-history-of-girly-styles-dolly-kei-cult-party-kei-and-mori-girl-part-one/',
  gyaru: 'https://www.fun-japan.jp/en/articles/12779',
  goth: 'https://fuga-studios.com/en/blogs/journal/gothic-fashion-guide',
  rivet: 'https://en.wikipedia.org/wiki/Rivethead',
  psycho: 'https://en.wikipedia.org/wiki/Psychobilly',
  kinder:
    'https://www.dazeddigital.com/fashion/article/62252/1/90s-kinderwhore-girlcore-girl-trends-courtney-love-hole-batsheva-celine',
  teddy:
    'https://www.londonmuseum.org.uk/collections/london-stories/teddy-boys-britains-first-youth-subculture/',
  darkmori: 'https://j-fashion.fandom.com/wiki/Dark_Mori',
  western:
    'https://thepunkrockprincess.com/fashion/gothic-western-fashion-what-it-is-and-why-youll-love-it/',
  whimsi: 'https://www.whowhatwear.com/whimsigoth-aesthetic',
  goblin: 'https://en.wikipedia.org/wiki/Goblincore',
  aero: 'https://frutiger-aero.org/frutiger-aero',
  vam: 'https://www.vam.ac.uk/articles/vivienne-westwood-punk-new-romantic-and-beyond',
  hiphop: 'https://www.fitnyc.edu/museum/exhibitions/hip-hop-style/',
  ballet:
    'https://www.vogue.com/article/balletcore-a-look-back-at-how-designers-have-been-inspired-by-dance',
  coquette: 'https://www.vogue.com/article/coquette-aesthetic-explainer',
  gorpcore: 'https://www.dictionary.com/culture/fashion/gorpcore',
  academia:
    'https://www.gq.com/story/dark-academia-vs-light-academia-aesthetics-style-explainer',
  greaser: 'https://en.wikipedia.org/wiki/Greaser_(subculture)',
  mod: 'https://en.wikipedia.org/wiki/Mod_(subculture)',
  grunge: 'https://en.wikipedia.org/wiki/Grunge_(fashion)',
  emo: 'https://en.wikipedia.org/wiki/Emo_subculture',
  disco: 'https://www.whowhatwear.com/disco-outfits',
  steam: 'https://en.wikipedia.org/wiki/Steampunk_fashion',
  cyber: 'https://www.printful.com/uk/blog/cyberpunk-fashion',
  indie: 'https://en.wikipedia.org/wiki/Indie_sleaze',
  fairy: 'https://www.vogue.com/article/core-aesthetic-microtrends-2023',
};
// Styling details are original CAS interpretations, not rigid rules for real communities.
// Source keys check terminology only. '-' denotes ordinary descriptive styling, not a historical claim.
// Name | aliases | category | description | clothing | hair | makeup | accessories | tags | source
const specs = rows(
  `
Angura Kei|Angura-kei|Alternative|Underground music-linked styling with an expressive, deliberately unconventional presentation.|Dark layered separates;Patterned long jacket|Sculptural fringe|Strong liner|Plain metal rings|visual-kei;goth;japanese-streetwear|j
Dolly Kei|Dolly-kei|Vintage|Fairytale-like vintage layering built around rich textures and unusual secondhand combinations.|Jewel-tone layered skirt;Tapestry vest|Loose textured waves|Muted berry lip|Antique-style brooch|vintage;fantasy;japanese-streetwear|mori
Cult Party Kei|Cult-party-kei|Alternative|Pale, soft layering that gives everyday garments an ethereal collected quality.|Cream layered dress;Sheer overlay|Airy undone braid|Soft rose blush|Fabric bows|romantic;vintage;japanese-streetwear|mori
Mori Kei|Mori Girl;Forest Girl|Everyday|Roomy natural-looking layers with gentle textures and a woodland mood.|Loose linen tunic;Layered long skirt|Relaxed braid|Warm understated blush|Woven bag|mori;natural;forest;japanese-streetwear|mori
Decora Kei|Decora|Alternative|Playful decoration makes accessories and color placement the main design elements.|Colorful hoodie;Striped socks|Clip-covered fringe|Colorful liner|Multiple hair clips|colorful;streetwear;japanese-streetwear|j
Fairy Kei|Fairy-kei|Fantasy|Pastel retro playfulness translated into soft shapes and nostalgic everyday pieces.|Pastel sweatshirt;Light tulle skirt|Fluffy curls|Pastel shadow|Toy-inspired charms|pastel;retro;fantasy;japanese-streetwear|j
Visual Kei|V-kei|Alternative|Music-related theatrical styling that welcomes dramatic silhouettes and self-expression.|Asymmetric jacket;Layered dark trousers|Voluminous angular layers|Graphic eye makeup|Statement necklace|visual-kei;goth;clubwear;japanese-streetwear|j
Ouji|Prince style;Boystyle|Formal|Tailored storybook elegance with structured separates and ornamental detail, wearable by any gender.|Ornate waistcoat;Knee-length tailored trousers|Neat side part|Subtle defined liner|Decorative bow tie|historical;formal;romantic;japanese-streetwear|j
Gyaru|Gal style|Alternative|Expressive glam styling that emphasizes confident coordination and beauty detail.|Fitted bright top;Platform shoes|Voluminous styled curls|Defined lashes and liner|Decorated handbag|glam;urban;japanese-streetwear|gyaru
Hime Gyaru|Hime Gal|Formal|Princess-inspired glam with ornate coordination and lavish beauty styling.|Ruffled coordinated dress;Lace-trimmed cardigan|Large curled updo|Soft pink glam makeup|Bow accessories|romantic;luxury;japanese-streetwear|gyaru
Agejo|Agejo Gyaru|Formal|Polished nightlife glam interpreted through elegant fitted pieces and carefully styled details.|Satin fitted dress;Tailored evening jacket|Structured voluminous waves|Dramatic cat-eye|Sparkling clutch|glam;clubwear;luxury;japanese-streetwear|gyaru
Ganguro|Ganguro Gyaru|Alternative|A bold historical gyaru substyle represented through high-contrast beauty detail and bright coordination.|Bright separates;Platform sandals|Light-colored styled layers|Contrasting light-and-dark eye accents|Stacked colorful bracelets|colorful;retro;japanese-streetwear|gyaru
Oshare Kei|Oshare-kei|Alternative|Bright expressive music-linked outfits with playful graphic contrast.|Graphic tee;Patterned layered trousers|Vivid color streaks|Graphic colored liner|Mixed playful pins|visual-kei;colorful;streetwear;japanese-streetwear|j
Sweet Lolita|-|Formal|A coordinated bell-shaped silhouette with pastel motifs and decorative softness.|Pastel full-skirt dress;Ruffled blouse|Soft coordinated curls|Gentle pink blush|Matching head bow|pastel;romantic;japanese-streetwear|j
Gothic Lolita|-|Formal|Structured decorative elegance combining a full-skirt silhouette with darker ornamental motifs.|Dark full-skirt dress;Lace-trimmed blouse|Polished curls|Defined dark liner|Lace headpiece|goth;formal;japanese-streetwear|j
Classic Lolita|-|Formal|Restrained ornate coordination using muted colors and balanced decorative detail.|Muted floral full skirt;High-neck blouse|Neat braided updo|Soft neutral makeup|Small floral brooch|vintage;romantic;japanese-streetwear|j
Punk Lolita|-|Alternative|A coordinated full-skirt silhouette interrupted by punk-inspired contrast and hardware.|Plaid full skirt;Structured dark blouse|Asymmetric fringe|Sharp liner|Studded belt|punk;goth;japanese-streetwear|j
Rivethead|Industrial style|Alternative|Functional dark club styling connected to industrial music, emphasizing shape and hardware.|Black utility trousers;Fitted plain tee|Close crop or angular cut|Smudged dark liner|Metal cuff|industrial;clubwear;workwear|rivet
Psychobilly|-|Alternative|A rockabilly-and-punk combination with energetic shape and graphic contrast.|Cuffed dark jeans;Statement bowling shirt|High sculpted quiff|Bold winged liner|Studded belt|punk;retro;clubwear|psycho
Kinderwhore|-|Alternative|An adult alternative-rock styling reference that contrasts soft dress shapes with worn, rough-edged details.|Adult babydoll-cut dress;Heavy boots|Loose deliberately tousled hair|Smudged dark liner|Simple choker|grunge;retro;adult-styling|kinder
Teddy Boy|Teddy style|Vintage|Dramatic tailored youth-subculture styling using long jacket lines and sharply shaped footwear.|Long drape jacket;Slim tailored trousers|Sculpted quiff|Optional subtle liner|Slim tie|retro;historical;formal|teddy
Corporate Goth|Corp Goth|Formal|Dark workwear with restrained gothic details suitable for a polished office silhouette.|Black tailored suit;High-neck blouse|Smooth low bun|Defined neutral-dark eye|Silver geometric brooch|goth;workwear;formal|goth
Deathrock|Deathrocker|Alternative|Punk-influenced dark music styling with jagged layers and striking contrast.|Distressed dark tee;Torn layered trousers|Tall teased or spiked hair|High-contrast liner|Metal-studded cuff|goth;punk;clubwear|goth
Romantic Goth|-|Formal|Softly dramatic dark styling that favors flowing fabrics and ornate detail.|Long velvet coat;Lace blouse|Long loose waves|Berry lip with soft dark eye|Ornate pendant|goth;romantic;formal|goth
Mall Goth|Mallgoth|Alternative|Turn-of-the-millennium dark casual styling with roomy shapes and visible hardware.|Wide dark trousers;Graphic black tee|Long contrasting streaks|Dark smudged eye|Chain belt|goth;y2k;urban|goth
Dark Mori|Dark Mori Girl|Alternative|Dark woodland layering related to international interpretations of Mori styling, using roomy texture rather than rigid tailoring.|Charcoal loose tunic;Dark layered long skirt|Loose low braid|Muted plum tint|Dark woven bag|mori;forest;goth|darkmori
Western Goth|Gothic Western;Cowboy Goth|Alternative|Dark western-inspired clothing connects boot shapes and denim structure with dramatic gothic accents.|Black western shirt;Dark boot-cut trousers|Long textured waves|Deep berry lip|Silver-look western buckle|western;goth;desert|western
Whimsigoth|Whimsigothic|Fantasy|Soft dark romantic styling with celestial accents and flowing, layered movement.|Velvet flowing skirt;Soft patterned blouse|Loose wavy layers|Plum shimmer eye|Moon-shaped pendant|whimsigoth;romantic;goth|whimsi
Goblincore|-|Fantasy|A nature-centered internet aesthetic interpreted through worn textures, earthy colors, and small collected-object details.|Earth-toned patched cardigan;Loose practical trousers|Untidy soft braid|Optional earthy tint|Small nature-inspired charm|forest;natural;upcycled|goblin
Frutiger Aero|Web 2.0 Gloss|Fantasy|A glossy digital-design aesthetic translated into CAS through clear colors, smooth surfaces, and optimistic nature motifs.|Blue-green smooth jacket;White streamlined separates|Smooth rounded cut|Cool shimmer eye|Translucent-look accessory|futuristic;techwear;colorful|aero
Casual|-|Everyday|Comfortable uncomplicated clothing with room for personal color and texture choices.|Straight-leg jeans;Soft cotton tee|Easy everyday style|Optional light tint|Everyday watch|casual;suburban|-
Minimalist|-|Everyday|A restrained wardrobe built around clean lines and a small coordinated palette.|Plain knit top;Straight tailored trousers|Sleek practical cut|Optional neutral makeup|Small geometric earrings|minimalist;urban|-
Preppy|-|Everyday|Neat collegiate-inspired separates with crisp layering and recognizable patterns.|Cable-knit sweater;Collared shirt|Neat side part|Soft natural finish|Simple loafers|preppy;academia|-
Business Casual|-|Everyday|Relaxed professional separates that balance polish with everyday comfort.|Unstructured blazer;Plain chinos|Tidy low-maintenance cut|Optional neutral eye|Leather-look belt|workwear;urban|-
Workwear|-|Everyday|Durable practical pieces arranged around pockets, layering, and useful movement.|Canvas jacket;Utility trousers|Secure tied-back hair|Optional minimal makeup|Sturdy belt|workwear;industrial|-
Athleisure|-|Everyday|Sport-inspired comfort coordinated as an everyday wardrobe.|Track jacket;Simple joggers|High ponytail|Optional fresh tint|Compact crossbody bag|sportswear;casual|-
Sportswear|-|Everyday|Activity-oriented clothing that prioritizes movement, fit, and sensible layering.|Breathable tee;Training shorts|Secure sport braid|Optional minimal finish|Practical cap|sportswear;outdoors|-
Resortwear|-|Everyday|Lightweight relaxed vacation dressing with simple coordinated layers.|Airy shirt;Loose wide-leg trousers|Loose wind-friendly braid|Soft sunlit blush|Woven tote|resortwear;coastal;tropical|-
Surfwear|-|Everyday|Laid-back beach clothing with functional casual layers and easy color.|Board shorts;Relaxed graphic tee|Loose textured crop|Optional minimal makeup|Simple cord bracelet|surfwear;beach;casual|-
Western|-|Everyday|Western-inspired everyday dressing with strong denim lines and practical footwear.|Denim shirt;Straight jeans|Loose braid or short crop|Warm neutral eye|Western belt buckle|western;country|-
Ranchwear|-|Everyday|Practical rural working clothes with durable layers and movement-friendly shapes.|Canvas work shirt;Boot-cut jeans|Secure low braid|Optional plain tint|Wide-brim work hat|ranchwear;country;workwear|-
Country Casual|-|Everyday|Relaxed countryside separates with soft knits and easy sturdy footwear.|Checked shirt;Comfortable jeans|Relaxed ponytail|Warm light blush|Woven shoulder bag|country;casual|-
Farmwear|-|Everyday|Garden-and-farm practical styling that treats protection and ease of washing as part of the look.|Overalls;Layered long-sleeve tee|Secure tucked braid|Optional minimal makeup|Work gloves|farmwear;natural;workwear|-
Coastal Casual|-|Everyday|Breezy clean-lined casual clothing shaped by light layers and soft coastal colors.|Striped knit top;Loose pale trousers|Relaxed waves|Soft peach tint|Canvas tote|coastal;casual|-
Formal Eveningwear|-|Formal|Occasion dressing with considered proportions and a clear statement piece.|Long evening dress or tailored suit;Polished shoes|Sculpted updo or neat crop|Defined evening eye|Small statement clutch|formal;luxury|-
Cocktail Attire|-|Formal|Polished event separates or shorter occasion dresses with coordinated finishing details.|Knee-length occasion dress;Tailored blazer|Neat soft waves|Defined liner with muted lip|Compact evening bag|formal;urban|-
Romantic|-|Everyday|Soft everyday styling built around gentle drape, tactile details, and graceful lines.|Flowing blouse;Soft pleated skirt|Loose braided crown|Rose blush|Delicate pendant|romantic;casual|-
Androgynous Tailoring|-|Formal|Balanced tailoring that allows structure and softness without assigning garments to a gender.|Relaxed tailored suit;Plain draped shirt|Personal preferred structured cut|Optional graphic liner|Geometric brooch|formal;minimalist;urban|-
Upcycled|-|Alternative|Visible repair and reworked materials make an existing garment's history part of its design.|Patched denim jacket;Reworked trousers|Easy textured style|Optional playful color|Reused fabric bag|upcycled;indie;workwear|-
Monochrome|-|Everyday|One color family creates cohesion through differences in fabric, shape, and surface.|Tonal knit;Matching-color trousers|Smooth simple style|Tonal eye or lip accent|Same-palette bag|minimalist;urban|-
Color Blocking|-|Alternative|Large intentional color areas create a graphic outfit without relying on busy prints.|Contrasting solid top;Bright solid trousers|Crisp geometric cut|One clear color accent|Single-color statement bag|colorful;urban|-
Layered Knitwear|-|Everyday|Tactile overlapping knits make proportion and texture the central styling choices.|Fine knit base;Chunky sleeveless layer|Loose low bun|Soft neutral blush|Simple warm scarf|casual;natural|-
Denim Dressing|-|Everyday|Denim-focused coordination balances washes, seams, and silhouette rather than requiring every piece to match.|Denim jacket;Different-wash jeans|Relaxed everyday waves|Optional understated liner|Plain belt|casual;workwear|-
Utility Casual|-|Everyday|Practical pockets and adjustable layers form a relaxed urban outfit.|Pocketed overshirt;Straight cargo trousers|Tidy practical crop|Optional minimal finish|Compact utility bag|workwear;urban;casual|-
Soft Tailoring|-|Formal|Relaxed tailoring uses fluid fabrics and gentle structure for approachable polish.|Draped blazer;Wide-leg trousers|Low loose knot|Neutral soft eye|Fine chain necklace|formal;minimalist|-
Vintage Sportswear|-|Vintage|Retro athletic shapes interpreted through modern comfortable everyday pieces.|Track top;Straight athletic trousers|Brushed-back textured hair|Optional single-color liner|Retro cap|retro;sportswear|-
Desert Casual|-|Everyday|Light layers and grounded tones create a practical wardrobe for a warm, dry setting.|Airy overshirt;Loose durable trousers|Secure loose braid|Optional warm neutral tint|Wide-brim plain hat|desert;casual;outdoors|-
Outdoor Layering|-|Everyday|Weather-ready layers and useful bags make comfort and readiness visible design elements.|Weatherproof jacket;Practical trail trousers|Secure low ponytail|Optional minimal makeup|Trail backpack|outdoors;workwear|-
Punk|-|Alternative|Expressive DIY clothing uses deliberate disruption, personal graphics, and visible modification.|Patched jacket;Distressed dark trousers|Spiked crop|Sharp graphic liner|Safety-pin-inspired hardware|punk;upcycled;urban|vam
New Romantic|-|Vintage|Theatrical club styling combines ornamental shape, dramatic proportions, and expressive presentation.|Ruffled blouse;Dramatic tailored jacket|Sculpted voluminous style|Graphic blush and liner|Ornate neck scarf|romantic;retro;clubwear|vam
Hip-Hop Style|-|Alternative|A broad music-and-culture-linked reference interpreted through strong outerwear, denim, and confident coordination.|Statement jacket;Relaxed denim|Personal preferred expressive style|Optional defined eye|Statement chain|streetwear;urban;sportswear|hiphop
Balletcore|-|Everyday|Dance-inspired softness brings wrap shapes and delicate layers into everyday clothing.|Wrap cardigan;Soft flowing skirt|Smooth bun|Light pink tint|Ribbon hair tie|romantic;pastel;casual|ballet
Coquette|-|Everyday|A contemporary decorative look using playful bows and delicate details without assigning innocence or personality to the wearer.|Bow-detailed blouse;Soft pleated skirt|Loose ribbon-tied braid|Gentle rosy makeup|Small bow accessory|romantic;pastel|coquette
Gorpcore|-|Everyday|Outdoor gear reinterpreted as street styling, mixing useful technical layers with visible trail references.|Fleece layer;Technical cargo trousers|Practical tucked-back hair|Optional understated tint|Trail-style waist bag|outdoors;streetwear;workwear|gorpcore
Dark Academia|-|Vintage|A bookish visual mood interpreted through dark textured tailoring and thoughtful layered proportions.|Dark tweed-style blazer;Deep-toned knit vest|Neat textured side part|Warm subdued eye|Plain satchel|academia;historical;formal|academia
Light Academia|-|Vintage|An airy bookish visual mood built from soft tailoring, light knits, and relaxed scholarly references.|Cream knit vest;Light tailored trousers|Soft loosely pinned hair|Warm light blush|Pale canvas book bag|academia;natural;preppy|academia
Greaser|-|Vintage|Rock-and-roll-linked casual styling with a crisp contrast between fitted basics and substantial outerwear.|Plain fitted tee;Dark leather-look jacket|Slicked-back quiff|Optional precise liner|Simple sturdy belt|retro;biker;urban|greaser
Mod|-|Vintage|Sharp modernist youth-subculture dressing interpreted through clean tailoring and precise graphic details.|Slim tailored suit;Simple geometric top|Neat geometric crop|Crisp liner|Narrow tie|retro;formal;urban|mod
Grunge|-|Alternative|Relaxed layered secondhand-looking clothes emphasize texture and ease over polished coordination.|Loose flannel shirt;Worn straight jeans|Loose unstyled layers|Optional smudged liner|Plain knitted beanie|grunge;casual;upcycled|grunge
Emo|-|Alternative|Music-linked expressive styling interpreted through fitted layers and strong hair-and-eye contrast.|Band-style graphic tee;Fitted dark trousers|Side-swept fringe|Defined dark eye|Studded wrist cuff|emo;punk;urban|emo
Disco|-|Vintage|Dance-floor dressing prioritizes movement, shine, and confident elongated lines.|Shimmer jumpsuit;Flared trousers|Full soft curls|Shimmering evening eye|Bold geometric earrings|retro;clubwear;glam|disco
Steampunk|-|Fantasy|Retrofuturistic dressing combines imagined mechanical details with tailored historical references.|Structured waistcoat;Long tailored coat|Pinned sculptural updo|Bronze-toned eye|Decorative gear brooch|historical;futuristic;fantasy|steam
Cyberpunk|-|Fantasy|Fiction-inspired urban styling contrasts technical shape with worn textures and vivid synthetic accents.|Angular layered jacket;Dark utility trousers|Asymmetric vivid streak|Sharp neon liner|Geometric visor-style glasses|futuristic;techwear;urban|cyber
Indie Sleaze|-|Alternative|A deliberately rumpled nightlife reference with narrow silhouettes and imperfect glam detail.|Worn fitted jacket;Simple skinny trousers|Messy layered fringe|Smudged smoky eye|Long casual pendant|indie;clubwear;urban|indie
Fairycore|-|Fantasy|Nature-and-folklore internet imagery translated into airy layers and delicate plant-inspired details.|Light flowing dress;Sheer soft overlay|Loose flower-pinned waves|Soft shimmer eye|Small flower accessory|fairycore;natural;fantasy|fairy
Cottagecore|-|Everyday|An internet aesthetic of imagined rural simplicity interpreted through soft practical fabrics and handmade-looking detail.|Cotton apron-style layer;Loose simple dress|Relaxed low braid|Optional warm blush|Small woven basket bag|cottagecore;natural;country|fairy
Lounge Dressing|-|Everyday|Coordinated soft indoor pieces make comfort feel deliberate through shape and texture.|Soft knit set;Simple slippers|Relaxed loose style|Optional minimal tint|Soft headband|casual;minimalist|-
Rainwear|-|Everyday|Weather-focused dressing uses a clear outer silhouette and practical waterproof layers.|Simple raincoat;Straight weather-ready trousers|Hair secured under hood|Optional waterproof liner|Plain umbrella|outdoors;workwear|-
Summer Linen|-|Everyday|Light breathable-looking fabrics and loose cuts create a calm warm-weather outfit.|Linen-look shirt;Loose pale shorts|Loose low ponytail|Optional fresh tint|Woven belt|natural;resortwear|-
Winter Wool Layers|-|Everyday|Structured warm outerwear works with tactile knits and useful cold-weather finishing pieces.|Long wool-look coat;Textured knit sweater|Tucked-back waves|Soft neutral eye|Thick plain scarf|casual;minimalist;outdoors|-
Garden Party Attire|-|Formal|Outdoor occasion styling combines polished soft fabrics with shoes and accessories suited to uneven ground.|Soft floral occasion outfit;Light tailored jacket|Pinned soft waves|Rose-toned eye|Small structured bag|romantic;formal;natural|-
Creative Officewear|-|Everyday|Professional separates leave space for expressive pattern and unconventional but practical detail.|Patterned blouse;Relaxed tailored trousers|Personal polished textured cut|One defined color accent|Graphic earrings|workwear;indie;urban|-
Smart Casual|-|Everyday|A polished everyday balance uses approachable tailoring without full occasion formality.|Fine knit top;Clean straight chinos|Neatly styled crop|Optional neutral tint|Simple leather-look watch|casual;formal;urban|-
Seaside Knitwear|-|Everyday|Substantial relaxed knits and practical layers suit a breezy shore-side everyday outfit.|Textured oversized sweater;Straight durable trousers|Wind-friendly tied-back hair|Optional muted blush|Soft knitted cap|coastal;casual;workwear|-
Polished Denim|-|Everyday|Clean denim lines pair with refined separates for a relaxed but deliberate presentation.|Dark straight jeans;Crisp plain blouse|Smooth side-parted style|Defined neutral eye|Structured small bag|casual;urban;formal|-
Statement Suiting|-|Formal|Tailored structure becomes expressive through one bold color or conspicuous pattern.|Bright coordinated suit;Simple base shirt|Sculpted neat style|Single strong lip or eye accent|Plain contrasting pocket square|formal;colorful;luxury|-
Textured Neutrals|-|Everyday|A restrained earthy palette gains interest from fabric contrast rather than decorative excess.|Textured cotton top;Soft woven trousers|Loose natural-texture style|Warm neutral blush|Simple wood-look earrings|natural;minimalist;casual|-
Relaxed Occasionwear|-|Formal|Fluid occasion pieces offer comfortable movement while keeping a considered event-ready silhouette.|Loose draped occasion dress or suit;Comfortable polished shoes|Soft low updo|Gentle evening eye|Small understated pendant|formal;romantic;minimalist|-
`,
  10,
);
export const aesthetics: Aesthetic[] = specs.map(
  ([
    name,
    aliases,
    category,
    description,
    clothing,
    hair,
    makeup,
    accessories,
    tags,
    source,
  ]) => {
    const tagList = list(tags);
    const adultStyle = name === 'Kinderwhore';
    const internetNames = [
      'Whimsigoth',
      'Goblincore',
      'Frutiger Aero',
      'Balletcore',
      'Coquette',
      'Gorpcore',
      'Dark Academia',
      'Light Academia',
      'Indie Sleaze',
      'Fairycore',
      'Cottagecore',
    ];
    const historicalNames = [
      'Kinderwhore',
      'Teddy Boy',
      'New Romantic',
      'Greaser',
      'Mod',
      'Disco',
    ];
    return {
      ...entry('aesthetic', name, description, {
        categories: [category],
        tags: tagList,
        allowedAges: adultStyle ? adultAges : supportedAges,
        adultOnly: adultStyle,
        verification:
          source === '-'
            ? {
                status: 'not-applicable',
                sources: [],
                notes:
                  'Ordinary descriptive styling; original CAS guidance, not a claimed historical subculture.',
              }
            : {
                ...verified(sources[source]),
                notes:
                  'Terminology checked 2026-10-10; clothing, beauty, ages, and worlds are original CAS interpretations, not community rules.',
              },
        commonness: category === 'Everyday' ? 0.85 : 0.25,
        weight: category === 'Everyday' ? 3 : 1,
      }),
      aliases: list(aliases),
      styleType:
        source === '-'
          ? 'practical'
          : internetNames.includes(name)
            ? 'internet'
            : historicalNames.includes(name)
              ? 'historical'
              : 'established',
      rarity: category === 'Everyday' ? 'common' : 'rare',
      category,
      worldAssociations: worlds
        .filter((world) => world.tags.some((tag) => tagList.includes(tag)))
        .map((world) => world.id),
      suggestedAges: adultStyle ? adultAges : supportedAges,
      casSuggestions: list(clothing),
      hairSuggestions: list(hair),
      makeupSuggestions: list(makeup),
      accessories: list(accessories),
      wildcard: category === 'Fantasy' || name === 'Visual Kei',
      culturalContext: tagList.includes('japanese-streetwear')
        ? 'A Japanese street-fashion or music-related reference, not traditional ethnic or religious dress. CAS guidance is adaptable to any gender or ethnicity; skin tone is never a costume requirement.'
        : name === 'Kinderwhore'
          ? 'Historical media label for adult alternative-rock styling. This entry is restricted to adult life stages.'
          : 'Styling suggestion, not a required personality, identity, occupation, or body type.',
    };
  },
);
