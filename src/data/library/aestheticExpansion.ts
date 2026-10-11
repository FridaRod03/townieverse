import type { Aesthetic } from '../../types/models';
import { entry, list, rows, supportedAges } from './common';
import { worlds } from './worlds';

const sources: Record<string, string> = {
  punk: 'https://en.wikipedia.org/wiki/Punk_fashion',
  gyaru: 'https://en.wikipedia.org/wiki/Gyaru',
  japanese: 'https://en.wikipedia.org/wiki/Japanese_street_fashion',
  lolita: 'https://en.wikipedia.org/wiki/Lolita_fashion',
  cyber: 'https://en.wikipedia.org/wiki/Cybergoth',
  scene: 'https://en.wikipedia.org/wiki/Scene_(subculture)',
  mcbling: 'https://www.vogue.com/article/what-is-mcbling',
  seoul: 'https://www.vogue.com/slideshow/seoul-fashion-week-street-style-2',
  deco: 'https://www.vam.ac.uk/articles/art-deco-fashion',
  regency: 'https://fashionhistory.fitnyc.edu/1800-1809/',
  twenties:
    'https://exhibitions.fitnyc.edu/roaring-20s-and-swinging-60s/exhibition/',
  victorian: 'https://fashionhistory.fitnyc.edu/1880-1889/',
  edwardian: 'https://fashionhistory.fitnyc.edu/1900-1909/',
  fifties: 'https://fashionhistory.fitnyc.edu/1950-1959/',
  seventies: 'https://fashionhistory.fitnyc.edu/1970-1979/',
  goth: 'https://en.wikipedia.org/wiki/Gothic_fashion',
  cores: 'https://www.vogue.com/article/core-aesthetic-microtrends-2023',
  normcore: 'https://en.wikipedia.org/wiki/Normcore',
  vaporwave: 'https://en.wikipedia.org/wiki/Vaporwave',
  egirl: 'https://en.wikipedia.org/wiki/E-girls_and_e-boys',
  bloke: 'https://www.voguehk.com/en/article/fashion/blokecore-trend/',
};
// Individually authored records, not a combinatorial name generator. Sources establish
// terminology/period only; all CAS suggestions and world affinities are creative advice.
// Type | name | aliases | category | description | clothing | hair | makeup | accessories | tags | source
const specs = rows(
  `
established|Traditional Goth|Trad goth|Alternative|An eighties goth reference uses angular hair and sharply contrasted dark layers connected to post-punk club culture.|Black layered blouse;Narrow dark trousers|Backcombed angular hair|Dramatic graphic eye|Pointed dark shoes|goth;punk;clubwear|goth
established|Victorian Goth|-|Formal|A modern gothic interpretation uses high-neck ornament and long structured lines drawn from selected Victorian references.|Long dark skirt;High-neck lace blouse|Pinned elaborate updo|Muted wine lip|Ornate silver brooch|goth;historical;formal|goth
established|Gothic Aristocrat|Elegant Gothic Aristocrat|Japanese street fashion|A Japanese music-fashion reference emphasizes long tailored shapes and elaborate dark formal detail rather than a bell-shaped skirt.|Long ornate coat;Ruffled high-collar shirt|Smooth long layers|Precise dark liner|Decorative cravat|goth;historical;visual-kei;japanese-streetwear|goth
established|Sailor Lolita|-|Japanese street fashion|Nautical collars and stripe trim organize a coordinated Lolita silhouette around maritime detail.|Sailor-collar blouse;Full coordinated skirt|Neatly pinned hair|Optional rosy tint|Small sailor-style hat|coastal;romantic;japanese-streetwear|lolita
established|Country Lolita|-|Japanese street fashion|Rustic motifs and straw-look accessories give coordinated full-skirt dressing a countryside emphasis.|Gingham full skirt;Lace-trim blouse|Soft braided sections|Optional warm blush|Straw-look bonnet|country;natural;romantic;japanese-streetwear|lolita
established|Hime Lolita|Princess Lolita|Japanese street fashion|Princess-themed Lolita coordination adds lavish ornament to a supported skirt silhouette, distinct from gyaru glam.|Ornate full-skirt dress;Decorative capelet|Sculpted curled updo|Soft pink shimmer|Small crown-like headpiece|luxury;romantic;formal;japanese-streetwear|lolita
internet|Barbiecore|-|Internet|A pop-culture internet aesthetic uses conspicuous pink coordination and polished playful surfaces.|Pink coordinated suit;Bright platform shoes|Glossy curled ends|Pink lip gloss|Pink small handbag|pastel;glam;y2k|cores
internet|Mermaidcore|-|Internet|Aquatic fantasy imagery becomes pearlescent evening texture and fluid, luminous drape.|Shimmering blue skirt;Draped pearly top|Wet-look waves|Blue shimmer eye|Pearl-look earrings|coastal;fantasy;romantic|cores
internet|Normcore|-|Internet|An internet-era response to conspicuous fashion makes intentionally ordinary, comfortable basics the central choice.|Plain sweatshirt;Straight jeans|Everyday personal hairstyle|Optional minimal makeup|Unbranded cap|casual;minimalist;urban|normcore
internet|Vaporwave Styling|-|Internet|A digital music-and-visual aesthetic inspires pastel retro graphics and surreal neon accents in an authored wardrobe adaptation.|Pastel graphic shirt;Loose retro trousers|Smooth color-streaked hair|Pink-blue liner|Translucent-look glasses|futuristic;retro;y2k|vaporwave
internet|E-Girl and E-Boy Style|E-girl style;E-boy style|Internet|Social-media styling mixes graphic dark layers with conspicuous hair accents and playful beauty details.|Striped base shirt;Dark graphic tee|Contrasting front streaks|Graphic eye accents|Layered metal-look necklaces|emo;streetwear;y2k|egirl
internet|Blokecore|-|Internet|Football-shirt nostalgia meets everyday street clothing in a contemporary online styling trend wearable by any gender.|Football-style shirt;Straight jeans|Easy short or tied-back style|Optional neutral finish|Plain sporty shoulder bag|sportswear;streetwear;retro|bloke
practical|Post-Punk Monochrome|-|Alternative|An authored music-inspired guide uses abrupt black-and-white contrast and spare, angular proportions.|Black cropped jacket;White plain shirt|Angular side part|Precise charcoal liner|Narrow plain belt|punk;goth;minimalist|-
practical|Biker Roadwear|-|Workwear|Motorcycle-inspired everyday layers emphasize substantial outerwear and a clear, uncluttered riding silhouette.|Leather-look road jacket;Straight sturdy jeans|Secure low ponytail|Optional dark liner|Plain sturdy boots|biker;grunge;workwear|-
practical|Techwear Commuter|-|Streetwear|Technical-looking urban layers arrange straps and pockets around a compact weather-ready outfit.|Structured shell jacket;Tapered cargo trousers|Short practical crop|Optional precise gray eye|Compact utility sling|techwear;urban;futuristic|-
practical|Nineties Alternative Casual|-|Alternative|An authored decade-inspired outfit contrasts a fitted base with loose, secondhand-looking outer layers.|Fitted plain tee;Oversized worn cardigan|Messy short layers|Optional smudged brown liner|Simple cord choker|grunge;indie;retro|-
practical|Korean-Inspired Clean Tailoring|-|Streetwear|A second authored Seoul photograph-inspired guide emphasizes crisp proportions and neat tonal tailoring rather than oversized outer layers.|Neat waist-length jacket;Pleated straight trousers|Smooth swept-back hair|Optional subtle lip tint|Plain structured tote|urban;minimalist;formal|seoul
established|Cybergoth|-|Clubwear|Industrial dance-floor drama puts fluorescent accents against dark synthetic layers.|Neon-trimmed black top;Wide technical trousers|High contrasting ponytails|Electric accent liner|Reflective bracelets|industrial;clubwear;futuristic|cyber
established|Scene|Scene kid style|Alternative|Mid-2000s music-community style brings bright graphics into slim casual outfits with conspicuous hair volume.|Colorful graphic tee;Slim checked trousers|Teased side-swept fringe|Bright eye accent|Colorful bead necklace|scene;emo;y2k|scene
established|Crust Punk|Crustie style|Alternative|Bristol-linked DIY punk clothing emphasizes repaired fabrics and durable, visibly altered layers.|Patched black vest;Repaired work trousers|Personal low-maintenance texture|Optional smudged liner|Handmade fabric patches|punk;upcycled;workwear|punk
established|Hardcore Punk|-|Alternative|Stripped-back music-scene clothes favor freedom of movement over ornate rock styling.|Plain sleeveless top;Loose knee-length shorts|Short practical crop|Optional bare-face finish|Simple wristband|punk;sportswear;urban|punk
established|Skate Punk|-|Alternative|Skateboarding and punk references meet in loose everyday pieces with robust footwear.|Loose graphic tee;Baggy shorts|Unstructured medium cut|Optional neutral tint|Skate cap|punk;skater;casual|punk
established|Cowpunk|-|Alternative|Western work clothes enter a punk music context through worn denim and rough-edged layering.|Checked western shirt;Worn boot-cut jeans|Loose quiff|Optional warm liner|Plain western buckle|punk;western;country|punk
established|Anarcho-Punk|-|Alternative|DIY expression and plain dark clothing reflect a political music scene without assigning beliefs to a Sim.|Hand-painted dark shirt;Reworked jacket|Personal expressive cut|Optional dark liner|Homemade cloth badge|punk;upcycled;urban|punk
established|Dance-Punk|-|Clubwear|Graphic rock layers acquire dance-floor color and reflective accents.|Bright fitted shirt;Studded jacket|Short angular spikes|High-contrast color liner|Reflective cuff|punk;clubwear;colorful|punk
established|Gothic Fashion|Goth style|Alternative|A broad music-linked dark wardrobe balances black fabrics and personally chosen dramatic details.|Black layered shirt;Dark fitted coat|Personal preferred dark style|Optional smoky eye|Silver-look pendant|goth;clubwear;romantic|goth
established|Lolita Fashion|Lolita street fashion|Japanese street fashion|Japanese coordinated fashion centers a supported skirt silhouette and carefully balanced decorative elements.|Full knee-length skirt;Coordinated blouse|Neatly arranged curls|Optional soft blush|Coordinated head bow|romantic;historical;japanese-streetwear|lolita
established|Kogal|Kogyaru|Japanese street fashion|A historically school-age gyaru reference translates uniform-like separates into expressive casual coordination.|Pleated skirt or trousers;Loose cardigan|Styled light or dark layers|Defined lashes|Decorated school satchel|gyaru;preppy;japanese-streetwear|gyaru
established|Himekaji|Hime kaji|Japanese street fashion|Casual princess-inspired gyaru uses floral separates and soft decorative finishing instead of grand occasion shapes.|Floral blouse;Lace-trimmed skirt|Loose styled curls|Soft pink eye|Small bow bag|gyaru;romantic;casual;japanese-streetwear|gyaru
established|Onee Gyaru|Onee gal|Japanese street fashion|Adult-oriented gyaru coordination shifts attention toward polished separates and composed glam details.|Fitted blouse;Tailored flared trousers|Smooth voluminous waves|Defined lashes|Structured handbag|gyaru;glam;urban;japanese-streetwear|gyaru
established|Gyaruo|Gyaru-o|Japanese street fashion|A menswear-associated gyaru branch uses expressive hair and assertive casual proportions, adaptable to any gender.|Open layered shirt;Distressed jeans|Spiked layered hair|Optional defined eye|Statement belt|gyaru;urban;japanese-streetwear|gyaru
established|Manba|-|Japanese street fashion|An exuberant gyaru branch emphasizes saturated color contrasts and conspicuous beauty detail without requiring a skin tone.|Vivid patterned separates;Platform sandals|Long vivid-color layers|Contrasting bright eye accents|Oversized colorful earrings|gyaru;colorful;retro;japanese-streetwear|gyaru
established|Yamanba|-|Japanese street fashion|A historical maximalist gyaru reference combines bold eye contrast with heavily decorated tropical-color outfits.|Bright printed top;Layered colorful skirt|Color-streaked long hair|Graphic contrasting liner|Floral hair decoration|gyaru;colorful;tropical;japanese-streetwear|gyaru
established|Amekaji|American casual kei|Japanese street fashion|Japanese interpretations of American casual clothing emphasize denim, collegiate graphics, and relaxed layering.|Varsity-style jacket;Cuffed jeans|Relaxed textured crop|Optional neutral blush|Baseball cap|casual;retro;japanese-streetwear|japanese
established|Girly Kei|-|Japanese street fashion|Soft Japanese street styling highlights sweet decorative separates without a Lolita skirt structure.|Ruffled cardigan;Floral short skirt|Ribbon-tied waves|Gentle rosy eye|Small heart pendant|romantic;pastel;japanese-streetwear|japanese
established|Jirai Kei|-|Japanese street fashion|A contemporary Japanese street-fashion label is represented through dark-and-pink frills; no mental-health identity is inferred.|Pink ruffled blouse;Black pleated skirt|Twin ribbon-tied sections|Soft pink shadow|Black bow accessories|goth;romantic;japanese-streetwear|japanese
established|Genderless Kei|-|Japanese street fashion|Japanese genderless street styling opens decorative and tailored clothing to personal expression across gender.|Oversized pastel shirt;Slim tailored trousers|Personal expressive cut|Optional soft eye color|Small playful earrings|streetwear;pastel;japanese-streetwear|japanese
historical|McBling|-|Vintage|An early-2000s pop-culture look centers conspicuous sparkle and embellished casual clothing.|Rhinestone-look tee;Velour tracksuit|Glossy long layers|Glossy lip and shimmer|Sparkling small shoulder bag|y2k;glam;urban|mcbling
historical|Y2K Futurism|Millennium futurism|Vintage|Turn-of-the-millennium optimism becomes a sleek wardrobe of metallic surfaces and streamlined shapes.|Silver-look jacket;Smooth fitted trousers|Smooth flipped ends|Cool metallic eye|Translucent-look glasses|y2k;futuristic;techwear|mcbling
historical|Regency Dress|Empire silhouette|Historical|Early nineteenth-century European fashion supplies a raised waistline and light, long draped shapes for a modern adaptation.|High-waisted flowing dress;Short fitted jacket|Pinned curls|Optional understated rose tint|Small fabric reticule|historical;romantic;formal|regency
historical|Regency Dandy|-|Historical|Early nineteenth-century tailored menswear inspires a high collar and sharply structured coat, open to any gender.|High-collared shirt;Tailored long coat|Neat swept-back hair|Optional neutral finish|Simple cravat|historical;formal;minimalist|regency
historical|Victorian Bustle Dress|-|Historical|Late nineteenth-century European dress inspires rear-volume silhouettes and a closely fitted upper layer.|Bustle-inspired long skirt;High-neck fitted blouse|Pinned braided updo|Optional muted rose lip|Small decorative hat|historical;formal;romantic|victorian
historical|Edwardian Daywear|-|Historical|Early twentieth-century European day dress suggests high necklines and softly bloused tops with long skirts.|High-neck lace blouse;Long flowing skirt|Soft raised updo|Optional subtle blush|Decorative hat|historical;vintage;formal|edwardian
historical|Art Deco Eveningwear|-|Historical|Interwar decorative fashion inspires geometric ornament and elongated, fluid evening lines.|Geometric-trim long dress;Draped evening wrap|Smooth waved bob|Defined berry lip|Geometric drop earrings|historical;glam;formal|deco
historical|1920s Flapper|Jazz Age dress|Historical|Jazz-era fashion inspires a dropped waist and movement-friendly decorative dress rather than a generic vintage costume.|Drop-waist dress;Low evening shoes|Short finger waves|Defined small lip|Long bead necklace|historical;retro;clubwear|twenties
historical|1960s Space Age|-|Historical|Mid-century future-facing fashion supplies geometric mini silhouettes and clean synthetic-looking surfaces.|Geometric tunic;White tall boots|Smooth geometric bob|Graphic white liner|Angular small bag|retro;futuristic;urban|twenties
historical|1950s New Look|-|Historical|Postwar couture inspires a defined waist and expansive skirt, with tailoring that can be adapted without restrictive garments.|Full midi skirt;Fitted short jacket|Soft sculpted waves|Precise winged liner|Small structured handbag|retro;formal;romantic|fifties
historical|1950s Pencil Tailoring|-|Historical|Narrow postwar daywear offers a straight skirt line and compact jacket, distinct from full-skirt occasion styling.|Straight midi skirt;Trim tailored jacket|Neat rolled updo|Muted red lip|Simple gloves|retro;workwear;formal|fifties
historical|1970s Bohemian Dress|-|Historical|Seventies folk-influenced fashion suggests flowing printed layers and soft, unstructured proportions.|Printed maxi dress;Loose fringed vest|Long center-parted waves|Warm earthy shadow|Long mixed pendants|retro;natural;indie|seventies
historical|1970s Glam Rock|-|Historical|Stage-influenced seventies dressing combines flamboyant tailoring with shine and pronounced footwear.|Metallic-look fitted suit;Platform boots|Voluminous shag|Graphic shimmer eye|Statement rings|retro;glam;clubwear|seventies
practical|Seoul Layered Streetwear|-|Streetwear|An authored guide informed by Seoul street-style photography combines oversized outerwear with precise layered proportions.|Oversized coat;Straight cropped trousers|Smooth center part|Optional soft lip tint|Compact crossbody bag|streetwear;urban;minimalist|seoul
practical|European City Casual|-|Everyday|Comfortable walking outfits balance neat denim with light tailoring for an urban day.|Relaxed blazer;Straight jeans|Easy brushed-back hair|Optional neutral finish|Small crossbody satchel|urban;indie;vintage|-
practical|Ravewear|-|Clubwear|Expressive dance-event clothing leaves space for movement while making color easy to read under bright lighting.|Bright breathable top;Loose dance trousers|Secure high ponytail|Optional vivid liner|Colorful bead bracelets|clubwear;colorful;sportswear|-
practical|Minimal Clubwear|-|Clubwear|A restrained evening outfit uses one sculptural silhouette instead of many competing decorative details.|Asymmetric plain top;Wide dark trousers|Sleek low bun|Single sharp eye accent|Small geometric cuff|clubwear;urban;minimalist|-
practical|Forest Goth Layering|-|Alternative|An authored dark woodland guide pairs coarse textures with long soft layers without claiming a separate music subculture.|Dark coarse-knit cardigan;Long charcoal skirt|Loose woven braid|Muted forest-green eye|Leaf-shaped silver pendant|goth;forest;mori|-
practical|Gothic Vintage Wardrobe|-|Vintage|Secondhand-looking dark occasion pieces emphasize age, texture, and rewear rather than a new goth taxonomy.|Vintage-look black dress;Worn velvet jacket|Pinned old-fashioned waves|Soft burgundy lip|Antique-look brooch|goth;vintage;romantic|-
practical|Rural Work Layers|-|Workwear|Weather-variable farm work inspires washable separates with secure cuffs and sturdy outer layers.|Canvas chore coat;Straight work trousers|Secure tucked braid|Optional minimal finish|Plain work gloves|farmwear;country;workwear|-
practical|Equestrian Casual|-|Sportswear|Riding-inspired shapes bring fitted legwear and protective-looking outer layers into a casual wardrobe.|Quilted vest;Straight fitted trousers|Low secured ponytail|Optional neutral blush|Simple leather-look belt|ranchwear;country;sportswear|-
practical|Trail Running Kit|-|Sportswear|A lightweight activity outfit keeps hems clear and concentrates useful layers around the torso.|Light zip jacket;Running shorts|Secure sport braids|Optional minimal tint|Small waist pack|outdoors;sportswear|-
practical|Tennis Separates|-|Sportswear|Court-inspired pleats and clean contrast make a tidy outfit with room for brisk movement.|Polo-style top;Pleated athletic skirt or shorts|Tidy ponytail|Optional fresh tint|Plain visor|sportswear;preppy;casual|-
practical|Basketball Streetwear|-|Sportswear|Court clothing becomes an everyday look through wide proportions and strong blocks of color.|Basketball-style jersey;Roomy shorts|Personal secure hairstyle|Optional neutral finish|Plain cap|sportswear;streetwear;urban|-
practical|Cycling Commuter|-|Sportswear|A city cycling outfit uses slim hems and easily layered visibility accents.|Light windbreaker;Tapered trousers|Hair secured away from face|Optional understated eye|Reflective-look bag|sportswear;urban;techwear|-
practical|Swim Cover-Up Styling|-|Sportswear|Poolside layering builds a complete leisure outfit around a simple swim base.|Swim top;Loose open cover-up|Easy tied-back hair|Optional waterproof liner|Pool tote|beach;resortwear;sportswear|-
practical|Snow Sport Layers|-|Sportswear|Mountain activity suggests insulated blocks of color and a visible, protective outer silhouette.|Padded snow jacket;Warm straight trousers|Hair tucked under hat|Optional cool lip tint|Warm knit gloves|outdoors;sportswear|-
practical|Dance Rehearsal Layers|-|Sportswear|Rehearsal clothing focuses on fitted foundations and removable warm-up pieces rather than decorative ballet motifs.|Fitted stretch top;Loose warm-up trousers|Secure bun|Optional bare-face finish|Plain fabric headband|sportswear;casual|-
practical|Fishing Daywear|-|Workwear|Waterside practical dressing suggests layered shirts and reachable pockets with a weather-ready finish.|Pocketed vest;Loose sturdy trousers|Low secure braid|Optional minimal tint|Plain sun hat|coastal;outdoors;workwear|-
practical|Mechanic Workwear|-|Workwear|Workshop clothes use a coherent overall silhouette and uncluttered practical finishing.|Coveralls;Plain work tee|Secure short crop|Optional minimal makeup|Sturdy utility belt|industrial;workwear|-
practical|Carpenter Casual|-|Workwear|Trade-inspired casual pieces give durable fabrics and reinforced-looking seams a place in everyday outfits.|Canvas apron layer;Straight work jeans|Tucked-back hair|Optional neutral finish|Plain sturdy belt|workwear;casual;upcycled|-
practical|Artist Studio Clothes|-|Workwear|Clothes for a messy creative day combine easy sleeves with visibly worn, expressive fabric surfaces.|Paint-marked overshirt;Loose cotton trousers|Loose clipped-back hair|Optional colorful liner|Fabric apron|indie;upcycled;workwear|-
practical|Culinary Workwear|-|Workwear|A food-preparation wardrobe keeps the silhouette neat and secures hair and sleeves.|Plain short-sleeve shirt;Dark straight trousers|Secure bun or crop|Optional minimal finish|Simple waist apron|workwear;minimalist|-
practical|Library Desk Wardrobe|-|Workwear|Quiet indoor work suggests soft knits, approachable tailoring, and practical carry space.|Soft cardigan;Pleated trousers|Neat loosely pinned hair|Optional warm tint|Book-sized satchel|academia;workwear;preppy|-
practical|Travel Capsule|-|Everyday|A small mix-and-match wardrobe uses repeatable colors and light layering suited to changes of setting.|Plain base shirt;Unstructured jacket;Straight trousers|Easy washable cut|Optional neutral lip|Compact travel bag|casual;minimalist;resortwear|-
practical|Accessible Fastenings|-|Everyday|An adaptive-inspired styling guide favors roomy openings and simple closures; CAS garments do not simulate medical functionality.|Roomy front-opening top;Easy-waist trousers|Personal comfortable style|Optional personal-choice makeup|Easy-carry fabric bag|casual;minimalist|-
practical|Modest Layered Wardrobe|-|Everyday|An authored coverage-focused outfit offers long sleeves and adjustable layering without assigning a religion or culture.|Long loose tunic;Wide trousers|Personal preferred hairstyle|Optional neutral eye|Plain shoulder bag|casual;minimalist;formal|-
practical|Heat-Friendly Tailoring|-|Formal|Lightweight-looking tailoring substitutes open shapes for heavy layers while maintaining an occasion-ready line.|Unlined-look jacket;Loose dress trousers|Neat airy crop|Optional soft matte finish|Slim woven belt|formal;desert;resortwear|-
practical|Rainy City Commute|-|Everyday|Wet-weather commuting suggests a compact layered silhouette with clear space for a practical bag.|Short rain jacket;Tapered dark trousers|Hair secured under hood|Optional waterproof eye|Weatherproof-look backpack|urban;workwear;outdoors|-
practical|Indoor Cozy Textures|-|Everyday|A tactile home outfit gives plush surfaces and loose cuffs an intentional, coordinated appearance.|Soft fleece pullover;Roomy knit trousers|Loose comfortable braid|Optional minimal tint|Soft socks|casual;natural|-
practical|Black-Tie Suiting|-|Formal|Formal evening tailoring uses crisp shirt contrast and restrained finishing around a clean jacket line.|Dinner jacket;Matching dress trousers|Smooth combed-back style|Optional precise liner|Plain bow tie|formal;luxury|-
practical|Daytime Wedding Guest|-|Formal|A light occasion outfit balances celebration with breathable-looking layers and stable footwear.|Printed midi outfit;Light cropped jacket|Soft pinned waves|Gentle rose eye|Small structured clutch|formal;romantic;natural|-
practical|Repair-First Wardrobe|-|Workwear|A visible-mending guide places darned knits and carefully reinforced seams at the center of a reusable outfit.|Darned sweater;Reinforced trousers|Easy low-maintenance style|Optional soft blush|Mended fabric tote|upcycled;natural;workwear|-
original|Moonlit Greenhouse|-|Fantasy|Townieverse concept: pale botanical embroidery interrupts a dark, glasshouse-inspired evening silhouette.|Black botanical-trim coat;Pale flowing skirt|Loose leaf-pinned braid|Silver-green eye shimmer|Glass-look pendant|goth;natural;romantic|-
original|Arcade Closing Shift|-|Streetwear|Townieverse concept: a practical late-shift outfit gains one bright accent borrowed from arcade cabinet graphics.|Dark utility vest;Neon-trim tee|Short colored streak|One electric liner accent|Retro game charm|y2k;workwear;urban|-
original|Rust and Roses|-|Alternative|Townieverse concept: coarse rust-colored denim contrasts with a small deliberate patch of floral softness.|Rust denim jacket;Dark floral skirt|Loose tousled waves|Muted terracotta lip|Small rose brooch|industrial;romantic;upcycled|-
original|Silver Screen Gardener|-|Vintage|Townieverse concept: old-film polish meets washable garden layers through neat gloves and a soft structured hat.|Cream work overalls;Fine knit top|Pinned short waves|Muted red lip|Simple brimmed hat|retro;farmwear;natural|-
original|After-Hours Archivist|-|Formal|Townieverse concept: ink-dark tailoring conceals a bright patterned lining and a tiny luminous accessory.|Dark long blazer;Pattern-lined waistcoat|Neat low bun|Subtle plum eye|Small luminous-look pin|academia;goth;formal|-
original|Harbor Signal|-|Streetwear|Townieverse concept: maritime outerwear uses a single signal-orange panel against cool slate colors.|Slate short coat;Orange knit layer|Wind-friendly cropped hair|Optional cool liner|Plain silver cuff|coastal;urban;workwear|-
original|Velvet Repair Shop|-|Workwear|Townieverse concept: decorative remnants turn an ordinary workshop apron into the statement layer.|Patched velvet apron;Plain cotton separates|Secure rolled braid|Optional muted shimmer|Old button brooch|upcycled;workwear;vintage|-
original|Meteor Picnic|-|Fantasy|Townieverse concept: a relaxed picnic wardrobe gains tiny metallic flecks and an angular carry bag.|Speckled pastel cardigan;Loose cotton shorts|Soft curled crop|Silver freckle-like accents|Angular small bag|futuristic;pastel;casual|-
original|Neon Orchard|-|Streetwear|Townieverse concept: saturated fruit colors enliven a useful orchard-work silhouette without replacing practical layers.|Lime work jacket;Berry-colored trousers|High secure braid|Optional berry eye accent|Bright fabric cap|colorful;farmwear;streetwear|-
original|Train-Platform Poet|-|Vintage|Townieverse concept: a traveling writer's soft tailoring acquires a weathered coat and a carefully chosen scarf.|Worn long coat;Soft waistcoat|Loose side-parted hair|Optional warm neutral tint|Patterned long scarf|academia;indie;vintage|-
original|Porcelain Circuit|-|Fantasy|Townieverse concept: ceramic-white surfaces and cobalt linework give a future-facing outfit a delicate ornamental quality.|White structured tunic;Cobalt-trim trousers|Smooth sculpted bob|Thin cobalt liner|Geometric white earrings|futuristic;minimalist;formal|-
original|Thrifted Ballroom|-|Formal|Townieverse concept: mismatched secondhand occasion pieces form a deliberate composition around one shared jewel tone.|Vintage-look evening jacket;Contrasting long skirt|Soft pinned curls|Jewel-tone eye accent|Reused ribbon choker|formal;upcycled;vintage|-
original|Desert Radio Host|-|Everyday|Townieverse concept: sun-faded casual layers gain a tidy broadcast-desk finish and one bright headset-inspired accessory.|Faded cotton overshirt;Loose pale trousers|Brushed-back easy cut|Optional warm lip tint|Bright hoop earrings|desert;casual;retro|-
original|Moss and Chrome|-|Alternative|Townieverse concept: heavy woodland texture contrasts with clean reflective hardware in an otherwise quiet outfit.|Moss-colored coarse knit;Charcoal straight trousers|Loose natural waves|Muted green shadow|Chrome-look cuff|forest;industrial;minimalist|-
original|Paper Lantern Evening|-|Formal|Townieverse concept: warm translucent-looking layers soften a graphic dark base; the name is a lighting metaphor, not ethnic dress.|Amber sheer overlay;Plain dark occasion outfit|Soft low updo|Warm golden eye|Small amber pendant|romantic;urban;formal|-
original|Bubblegum Boardroom|-|Formal|Townieverse concept: crisp professional tailoring adopts a pink candy palette with deliberately restrained accessories.|Pink tailored jacket;White straight trousers|Sleek high ponytail|Rose lip tint|Plain silver watch|y2k;workwear;glam|-
original|Rain-Slick Detective|-|Everyday|Townieverse concept: noir-inspired layers become a comfortable wet-weather outfit with an unexpected bright inner shirt.|Dark short trench;Teal collared shirt|Neat textured crop|Optional smoky gray eye|Small plain satchel|urban;retro;workwear|-
original|Seashell Synth|-|Fantasy|Townieverse concept: smooth futuristic shapes borrow pearly coastal colors and a single shell-shaped ornament.|Pearlescent short jacket;Pale streamlined trousers|Rounded smooth cut|Soft blue shimmer|Shell-shaped small earrings|coastal;futuristic;pastel|-
original|Patchwork Stargazer|-|Everyday|Townieverse concept: a warm outdoor outfit organizes visible patches into a quiet night-sky color story.|Blue patchwork coat;Warm plain trousers|Secure low ponytail|Optional silver liner|Knitted midnight-blue cap|outdoors;upcycled;natural|-
original|Velour Weather Report|-|Clubwear|Townieverse concept: a soft dance outfit uses cloud-gray velour and a lightning-bright finishing detail.|Gray velour zip top;Loose matching trousers|Smooth flipped layers|Bright yellow eye accent|Small lightning charm|y2k;clubwear;sportswear|-
`,
  11,
);

export const expandedAesthetics: Aesthetic[] = specs.map(
  ([
    type,
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
    const styleType = type as NonNullable<Aesthetic['styleType']>;
    const rarity =
      type === 'practical'
        ? 'common'
        : type === 'original'
          ? 'rare'
          : 'uncommon';
    return {
      ...entry('aesthetic', name, description, {
        allowedAges: supportedAges,
        categories: [category],
        tags: tagList,
        commonness:
          rarity === 'common' ? 0.8 : rarity === 'uncommon' ? 0.45 : 0.15,
        weight: rarity === 'common' ? 3 : rarity === 'uncommon' ? 2 : 1,
        verification:
          source === '-'
            ? {
                status: 'not-applicable',
                sources: [],
                notes:
                  type === 'original'
                    ? 'Original Townieverse concept; not an established fashion movement.'
                    : 'Authored practical wardrobe guide; not a claim of a separate subculture.',
              }
            : {
                status: 'verified',
                sources: [sources[source]],
                notes:
                  'Terminology or period reference checked 2026-10-10. Styling, rarity, age suggestions, and world associations are authored interpretations. Seoul guide is an authored practical interpretation of photographs.',
              },
      }),
      styleType,
      rarity,
      aliases: list(aliases),
      category,
      casSuggestions: list(clothing),
      hairSuggestions: list(hair),
      makeupSuggestions: list(makeup),
      accessories: list(accessories),
      suggestedAges: supportedAges,
      worldAssociations: worlds
        .filter((world) => world.tags.some((tag) => tagList.includes(tag)))
        .map((world) => world.id),
      wildcard: type === 'original' && category === 'Fantasy',
      culturalContext: tagList.includes('japanese-streetwear')
        ? 'Japanese street or music-fashion origin. Styling may be adapted to any gender; skin tone, ethnicity, and mental-health identity are never costume requirements. These are clothing references, not community membership rules.'
        : type === 'historical'
          ? 'Period-inspired CAS adaptation, not a claim of universal historical dress. Regional, class, and gender experiences varied.'
          : 'Optional styling for any gender or body type. Makeup is optional and the outfit does not dictate personality or identity.',
    };
  },
);
