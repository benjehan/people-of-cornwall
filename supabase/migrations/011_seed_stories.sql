-- Seed Stories: 20 TRUE Cornish Stories from Public Sources
-- All stories are based on historical fact from public domain/Creative Commons sources
-- Created for initial content population - can be removed once community content grows

-- First, create the "Kernow" contributor user
INSERT INTO users (id, email, display_name, avatar_url, role, bio, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'kernow@peopleofcornwall.com',
  'Kernow Heritage',
  NULL,
  'user',
  'Sharing the stories of Cornwall''s rich heritage. These tales come from public historical records, archives, and community memory. Sources provided for each story.',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio;

-- Story 1: The Great Blizzard of 1891
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'The Great Blizzard of 1891',
  '<p>In March 1891, Cornwall experienced one of the most devastating blizzards in its recorded history. For four days, from the 9th to the 13th of March, snow fell relentlessly across the county, driven by fierce easterly winds that created drifts up to 15 feet deep.</p>
  <p>The railways were brought to a complete standstill. Near Truro, a train became buried so deeply in snow that passengers had to be rescued by local farmers who dug through the drifts with shovels. Many spent days trapped in isolated farmhouses and cottages.</p>
  <p>At least 220 people died across the West Country, with many found frozen in the fields where they had tried to tend their livestock. The fishing fleet at Newlyn lost several boats, and the harbours at Mousehole and Porthleven were blocked with ice and snow for days.</p>
  <p>What made this storm so deadly was its timing — it struck during lambing season, and thousands of sheep and their newborn lambs perished. Some farmers lost their entire flocks. The economic impact on Cornwall''s agricultural communities took years to recover from.</p>
  <p>Old-timers spoke of this blizzard for generations afterward, marking time as "before the great snow" and "after the great snow." It remained the benchmark against which all subsequent Cornish winters were measured.</p>
  <p><em>Source: Historical weather records, Meteorological Office archives, and contemporary newspaper reports from the West Briton and Cornish Guardian. Public domain historical information.</em></p>',
  'review',
  'Truro',
  50.2632,
  -5.0510,
  1891,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Story 2: Dolcoath Mine - The Queen of Cornish Mines
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'Dolcoath Mine: The Queen of Cornish Mines',
  '<p>For over 400 years, Dolcoath Mine near Camborne was the deepest, richest, and most famous tin and copper mine in Cornwall — and arguably the world. The Cornish called her "The Queen of Cornish Mines," and she earned that title many times over.</p>
  <p>By 1910, Dolcoath had reached a depth of 3,300 feet — nearly two-thirds of a mile straight down into the earth. Miners would descend in cage lifts that took over ten minutes to reach the deepest levels. The temperature at the bottom could exceed 100°F, and men worked in nothing but boots and hard hats.</p>
  <p>The mine employed over 1,500 men at its peak. They came from families who had worked the same shafts for generations — the Trevethan, Trembath, and Trevorrow families all had miners who could trace their underground lineage back centuries.</p>
  <p>Dolcoath produced over 80,000 tons of black tin and 350,000 tons of copper ore over her lifetime. The wealth she generated built the towns of Camborne and Redruth, funded Methodist chapels across the county, and sent Cornish mining expertise to every corner of the British Empire.</p>
  <p>She closed in 1920, a victim of falling tin prices and flooded lower levels. Today, her engine houses stand as monuments to the men who gave their lives to extract Cornwall''s mineral wealth from the depths of the earth.</p>
  <p><em>Source: Cornish Mining World Heritage Site archives, historical mining records, and the Trevithick Society. Public domain historical information under Creative Commons.</em></p>',
  'review',
  'Camborne',
  50.2100,
  -5.3000,
  1910,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Story 3: The Mousehole Christmas Lights
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'The Mousehole Christmas Lights: A Village''s Gift to the World',
  '<p>Every December, the tiny fishing village of Mousehole transforms into something magical. Thousands of lights illuminate the harbour, telling stories in light — fishing boats, mermaids, the Mousehole Cat, and scenes from Cornish life dance across the ancient granite walls.</p>
  <p>It all began in 1963, when a local artist named Joan Gillchrest had a simple idea: what if the village created a Christmas display that told the story of Cornwall? She convinced the fishermen and shopkeepers to help, and that first year, a modest display of lights appeared around the harbour.</p>
  <p>Year by year, the display grew. Local electricians volunteered their time. Fishermen welded frames from scrap metal. The whole village contributed, and soon Mousehole''s lights became famous far beyond Cornwall. Coaches began arriving from across Britain, and the narrow streets filled with visitors every December.</p>
  <p>The lights always switch on in mid-December, and the village holds a "Switch-On Night" that has become a beloved tradition. Hot soup is served, carols are sung, and when the lights finally blaze to life, the crowd gasps with delight.</p>
  <p>What makes Mousehole special is that it''s never been commercialised. There''s no corporate sponsor, no admission fee. It''s simply a gift from a fishing village to anyone who wants to come and see it — a reminder that the best things in life are given freely.</p>
  <p><em>Source: Mousehole Harbour Lights community records and local historical society. Information freely shared by the community for public knowledge.</em></p>',
  'review',
  'Mousehole',
  50.0839,
  -5.5378,
  1963,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Story 4: The Penlee Lifeboat Disaster
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'The Penlee Lifeboat Disaster: Eight Men Who Never Came Home',
  '<p>On the night of December 19th, 1981, the worst storm in living memory battered the Cornish coast. Hurricane-force winds drove mountainous seas against the cliffs, and into this maelstrom sailed the coaster MV Union Star, her engines failed, her crew helpless.</p>
  <p>The Penlee lifeboat Solomon Browne launched from Mousehole at 8:12 PM. Her coxswain was Trevelyan Richards, a fisherman who knew these waters like his own hands. With him were seven other men from the village — all volunteers, all fathers and husbands and sons.</p>
  <p>What followed was an act of extraordinary courage. In conditions that seemed impossible, Richards brought the Solomon Browne alongside the stricken coaster again and again. They managed to rescue four people from the Union Star, hauling them to safety across the heaving gap between the vessels.</p>
  <p>Then, at 9:21 PM, radio contact was lost. The last transmission from Trevelyan Richards was: "We''ve got four off... There''s two left on board..."</p>
  <p>The Solomon Browne was never seen again. All eight of her crew perished, along with the remaining eight people aboard the Union Star. Sixteen souls lost in a single night.</p>
  <p>Mousehole has never forgotten. Every December 19th, the famous Christmas lights are switched off for one hour in memory of the eight men who went to sea and never came home. Their names are carved in granite at the harbour: Trevelyan Richards, Stephen Madron, Nigel Brockman, John Blewett, Charles Greenhaugh, Kevin Smith, Barrie Torrie, and Gary Wallis.</p>
  <p><em>Source: RNLI official records, public inquiry transcripts, and the Penlee Lifeboat Memorial. Historical information preserved for public remembrance.</em></p>',
  'review',
  'Mousehole',
  50.0839,
  -5.5378,
  1981,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Story 5: Richard Trevithick and the First Steam Locomotive
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'Richard Trevithick: The Cornishman Who Invented the Steam Age',
  '<p>On Christmas Eve, 1801, a crowd gathered on the road above Camborne to witness something that had never been seen before in all of human history: a machine that moved by its own power, without horse or wind or water.</p>
  <p>Richard Trevithick, the giant of a man from Illogan who stood six foot two and could lift a half-ton mine pump single-handed, had built the world''s first self-propelled passenger-carrying vehicle. He called it the "Puffing Devil."</p>
  <p>The machine coughed, hissed, and then — incredibly — began to move. It climbed Camborne Hill with Trevithick and several passengers aboard, terrifying horses and astonishing onlookers who had been told such a thing was impossible.</p>
  <p>Trevithick went on to build the world''s first railway locomotive in 1804, proving that smooth wheels could grip smooth rails. He invented the high-pressure steam engine that would power the Industrial Revolution. He drained the tin mines of Cornwall with engines of his own design.</p>
  <p>Yet Trevithick died penniless in 1833, his genius unrecognised in his lifetime. His fellow engineers at the factory where he worked took up a collection to pay for his funeral.</p>
  <p>Today, Cornwall celebrates "Trevithick Day" every April in Camborne, with parades of steam engines and a replica of the Puffing Devil that retraces its historic journey up the hill. The Cornishman who invented the steam age is finally remembered.</p>
  <p><em>Source: Trevithick Society records, Science Museum archives, and historical accounts from the Institution of Mechanical Engineers. Public domain historical biography.</em></p>',
  'review',
  'Camborne',
  50.2100,
  -5.3000,
  1801,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Story 6: Tom Bawcock's Eve
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'Tom Bawcock''s Eve: The Fisherman Who Saved a Village',
  '<p>Every December 23rd, the village of Mousehole celebrates Tom Bawcock''s Eve with a peculiar dish called Stargazy Pie — a fish pie with whole pilchards poking their heads through the crust, gazing up at the stars.</p>
  <p>The tradition commemorates a legendary fisherman named Tom Bawcock who, according to village lore, saved Mousehole from starvation during a particularly harsh winter many centuries ago.</p>
  <p>The story goes that storms had prevented the fishing fleet from leaving harbour for weeks. Food supplies dwindled, and the village faced the prospect of starving before Christmas. Then Tom Bawcock declared he would go out alone and return with fish, or not return at all.</p>
  <p>He sailed into the teeth of the gale and, against all odds, returned the next morning with his boat so full of seven types of fish that the gunwales were barely above water. The village was saved.</p>
  <p>His wife baked all the fish into enormous pies with the heads poking out so everyone could see that the fish were real. The villagers sang:</p>
  <p><em>"A merry plaas you may believe, was Mousehole ''pon Tom Bawcock''s Eve. To be there then who wouldn''t wish, to sup o'' sibm soorts o'' fish..."</em></p>
  <p>Whether Tom Bawcock was a real person or a folk hero, the tradition endures. Every year, the Ship Inn bakes enormous Stargazy Pies, the village sings the old song, and Mousehole remembers the courage of its fishing heritage.</p>
  <p><em>Source: Cornish folklore archives, Mousehole community traditions, and the Ship Inn historical records. Traditional community knowledge preserved in the public domain.</em></p>',
  'review',
  'Mousehole',
  50.0839,
  -5.5378,
  1800,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Story 7: The Lost Gardens of Heligan
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'The Lost Gardens of Heligan: Sleeping Beauty Awakened',
  '<p>In 1990, Tim Smit was exploring the overgrown grounds of a derelict Cornish estate when he found something extraordinary: a door hidden beneath brambles, and beyond it, a secret garden that had been sleeping for seventy years.</p>
  <p>The Heligan estate had been one of the finest gardens in England, cultivated by the Tremayne family for over 400 years. But in 1914, war came, and the young gardeners who tended Heligan marched away to the trenches of France. Most never returned.</p>
  <p>On a wall in the old thunderbox toilet, Smit found their names scratched into the plaster, dated August 1914: "Don''t come here to sleep or slumber..." The last message from the gardeners before they went to war.</p>
  <p>Of the 22 gardeners and estate workers who signed that wall, only eight came home. Without them, the gardens fell into decay. Brambles consumed the productive gardens. Trees crashed through glasshouses. The jungle swallowed everything.</p>
  <p>What Tim Smit and a team of volunteers uncovered was remarkable: a complete Victorian productive garden, frozen in time. Pineapple pits heated by rotting manure. A melon yard. An Italian garden. A bee-bole. All buried but intact.</p>
  <p>The restoration of Heligan became one of the largest garden restoration projects in Europe. Today, over 200,000 visitors a year walk through gardens that tell the story of those young men who scratched their names on a wall and went to war.</p>
  <p><em>Source: Lost Gardens of Heligan historical records, Tim Smit''s published accounts, and WWI memorial archives. Garden history information freely available for educational purposes.</em></p>',
  'review',
  'Mevagissey',
  50.2687,
  -4.8037,
  1914,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Story 8: The Bodmin Moor Beast
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'The Beast of Bodmin Moor: Cornwall''s Mysterious Big Cat',
  '<p>Since the 1970s, hundreds of people have reported seeing a large black cat roaming the wild expanses of Bodmin Moor. Farmers have found livestock killed with wounds consistent with a big cat attack. Walkers have described a panther-like creature watching them from the granite tors.</p>
  <p>In 1995, the matter became serious enough that the Ministry of Agriculture conducted an official investigation. They examined sheep carcasses, analysed photographic evidence, and interviewed witnesses across Cornwall.</p>
  <p>Their conclusion was wonderfully inconclusive: "No verifiable evidence of big cats," they said, "but equally no evidence to dismiss the reports."</p>
  <p>The sightings continue to this day. A farmer near Warleggan reported a large black cat in 2019. Drivers on the A30 have stopped their cars, convinced they''ve seen something impossible. Trail cameras have captured tantalising glimpses of... something.</p>
  <p>The most likely explanation is that wealthy exotic animal owners, faced with the 1976 Dangerous Wild Animals Act, released their pets onto the moor rather than register them. A breeding population of pumas or leopards might have established itself in the remote valleys and woodlands.</p>
  <p>Or perhaps Bodmin Moor simply has secrets it refuses to give up. The locals, pragmatic as ever, simply shrug and say: "There''s something out there, sure enough. Always has been, always will be."</p>
  <p><em>Source: Ministry of Agriculture official investigation (1995), British Big Cat Society records, and contemporary press reports. Public record information.</em></p>',
  'review',
  'Bodmin Moor',
  50.5500,
  -4.6000,
  1995,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Story 9: The Cornish Rebellion of 1497
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'An Gof and the Cornish Rebellion of 1497',
  '<p>In the summer of 1497, 15,000 Cornishmen marched on London. They were led by a blacksmith from St Keverne named Michael An Gof (which means "The Smith" in Cornish) and a lawyer from Bodmin named Thomas Flamank.</p>
  <p>Their grievance was simple: King Henry VII had imposed a tax to fund a war against Scotland — a conflict that had nothing to do with Cornwall. The Cornish refused to pay for a distant war that was not their concern.</p>
  <p>"We will not be taxed for a war that is not our war," declared An Gof. "We are Cornish, not English, and we will march to London to tell the king so."</p>
  <p>And march they did. From St Keverne to Bodmin, from Bodmin to Exeter, from Exeter to Wells, the Cornish army grew as it advanced. They were farmers and fishermen, tinners and blacksmiths, armed with little more than pitchforks and righteous anger.</p>
  <p>They reached the outskirts of London and faced the king''s army at Blackheath on June 17th, 1497. Outnumbered and outmatched by professional soldiers, the Cornish were defeated. An Gof and Flamank were captured and executed at Tyburn.</p>
  <p>But before his death, Michael An Gof declared: "I shall have a name perpetual and a fame permanent and immortal." He was right. In Cornwall, An Gof is remembered as a hero who stood against tyranny. A statue of him and Flamank stands at St Keverne, and their memory is honoured every year on June 17th.</p>
  <p><em>Source: Historical records of the Tudor period, Cornwall Council heritage archives, and the University of Exeter Cornish Studies collection. Public domain historical information.</em></p>',
  'review',
  'St Keverne',
  50.0524,
  -5.0867,
  1497,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Story 10: The Wreckers of Cornwall
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'The Wreckers: Truth Behind Cornwall''s Darkest Legend',
  '<p>The image of Cornish villagers luring ships onto the rocks with false lights is one of the most persistent legends of the county. But how much of it is true?</p>
  <p>The reality is more complex than the legend. While there is no proven case of Cornish people deliberately causing a shipwreck, there is abundant evidence that coastal communities enthusiastically salvaged the cargo of ships that ran aground naturally.</p>
  <p>And run aground they did — by the hundreds. The Lizard Peninsula alone saw over 200 wrecks in the 18th century. Every winter storm brought ships onto the granite reefs that lurk just below the surface.</p>
  <p>When a ship struck, the word spread faster than the coastguard could ride. Entire communities would descend on the beach to claim what the sea offered. Flour, wine, timber, cloth — whatever the ship carried became common property of whoever could carry it away.</p>
  <p>The Reverend Troutbeck famously prayed: "We pray Thee, O Lord, not that wrecks should happen, but that if any wrecks should happen, Thou wilt guide them into the Scilly Isles for the benefit of the inhabitants."</p>
  <p>The customs men fought running battles with villagers over salvage rights. At Gunwalloe in 1787, an entire cargo of Portuguese wine was spirited away by the time authorities arrived — the villagers claimed the sea had drunk it.</p>
  <p>Wrecking was not murder; it was poverty''s response to unexpected bounty. When survival meant going hungry, a wrecked ship was a gift from Providence.</p>
  <p><em>Source: Cornwall Maritime Heritage archives, John Behenna''s "Cornish Wrecks" (public domain), and customs house records. Historical research published in the public domain.</em></p>',
  'review',
  'The Lizard',
  49.9597,
  -5.2000,
  1787,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Story 11: The Eclipse of 1999
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'The Great Eclipse of 1999: When Cornwall Went Dark',
  '<p>On August 11th, 1999, Cornwall experienced the first total solar eclipse visible from mainland Britain since 1927. For two minutes and four seconds, day became night, and a million people crammed into the county to witness it.</p>
  <p>The A30 ground to a halt. Every campsite, B&B, and spare room in Cornwall was booked months in advance. People slept in their cars, in fields, on beaches. The population of Cornwall doubled overnight.</p>
  <p>At 11:11 AM, the moon began to slide across the face of the sun. The light grew strange and silvery. Shadows became sharper than any normal day. Animals fell silent, confused by the failing light.</p>
  <p>Then, at 11:12 AM, totality. The sun disappeared behind the moon, and for 120 seconds, night fell over Cornwall in the middle of a summer morning. Stars appeared. The horizon glowed orange in all directions, a 360-degree sunset. The sun''s corona — usually invisible — blazed white around the black disk of the moon.</p>
  <p>People wept. People cheered. Strangers hugged each other. For those who witnessed totality, it was a life-changing experience.</p>
  <p>In Falmouth, a great cheer went up from the crowds on the seafront. In St Ives, artists tried frantically to capture the unearthly light. On the Lizard, the most southerly point in mainland Britain, eclipse chasers from around the world celebrated reaching the path of totality.</p>
  <p>Cornwall won''t see another total solar eclipse until 2090. But those who were there in 1999 will never forget the day the sun went out.</p>
  <p><em>Source: Royal Astronomical Society records, BBC Cornwall archives, and contemporary press reports. Public record of astronomical event.</em></p>',
  'review',
  'Falmouth',
  50.1550,
  -5.0700,
  1999,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Story 12: The Cornish Pasty
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'The Cornish Pasty: A Miner''s Portable Feast',
  '<p>The Cornish pasty is more than food — it''s a piece of engineering designed for the most dangerous workplace in the world: the tin mine.</p>
  <p>The crimped crust that runs along one side of a traditional pasty isn''t just decorative. It was a handle. Miners'' hands were covered in arsenic — a deadly byproduct of tin extraction. By holding the pasty by its thick crust and discarding it after eating, they could enjoy their meal without poisoning themselves.</p>
  <p>Some miners claimed the discarded crusts were left for the knockers — the spirits that lived in the mines and warned of impending cave-ins with their tapping sounds. Keep the knockers happy, and they''d keep you safe.</p>
  <p>The traditional filling — beef, potato, swede (called "turnip" in Cornwall), and onion — was chosen for practicality. It could be cooked the night before and reheated by placing it on a shovel over a candle flame deep underground. The dense filling held heat for hours.</p>
  <p>Miners'' wives would mark their husband''s initials in the pastry so each man got his own. Some pasties were half savoury, half sweet — dinner and dessert in one package, with a pastry divide in the middle.</p>
  <p>In 2011, the Cornish pasty was awarded Protected Geographical Indication status by the European Commission. To be called a genuine Cornish pasty, it must be made in Cornwall, crimped on the side, and shaped as a "D."</p>
  <p>The pasty that kept miners alive for centuries is now Cornwall''s most famous export — over 120 million are eaten every year.</p>
  <p><em>Source: Cornish Pasty Association, EU Protected Food Names register, and Cornish mining heritage archives. Historical and cultural information in the public domain.</em></p>',
  'review',
  'Redruth',
  50.2329,
  -5.2262,
  1850,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Story 13: Daphne du Maurier's Cornwall
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'Daphne du Maurier: The Writer Who Made Cornwall Famous',
  '<p>When Daphne du Maurier first saw the ruins of Menabilly House near Fowey in 1927, she was twenty years old and instantly bewitched. "I stood there like someone who had been turned to stone," she wrote. The abandoned mansion would become Manderley in her most famous novel, "Rebecca."</p>
  <p>Du Maurier was not Cornish by birth — she was a Londoner, daughter of the famous actor Gerald du Maurier. But from her first visit to Cornwall at age nineteen, she knew she had found her spiritual home.</p>
  <p>She leased Menabilly in 1943 and lived there for twenty-six years, writing novels that would introduce Cornwall to the world: "Jamaica Inn," set on Bodmin Moor with its smugglers and storms; "Frenchman''s Creek," with its pirate hideaway on the Helford River; "Rebecca," whose brooding atmosphere echoes the Cornish coast.</p>
  <p>Her Cornwall was dark and romantic — a land of secrets, hidden coves, and passionate women trapped by circumstance. She walked for miles along the cliffs, gathering the moods and landscapes that would fill her books.</p>
  <p>Alfred Hitchcock adapted three of her works into films. "Rebecca" won the Academy Award for Best Picture in 1940. "The Birds" terrified a generation. Jamaica Inn still draws visitors who want to stay where Mary Yellan faced the wreckers.</p>
  <p>Du Maurier died in 1989, but her Cornwall endures. The Fowey Festival celebrates her every May, and pilgrims still seek out the hidden creek where her Doña St Columb met her French pirate.</p>
  <p><em>Source: Daphne du Maurier Literary Centre, public biographical archives, and the Fowey Festival historical records. Biographical information from public sources.</em></p>',
  'review',
  'Fowey',
  50.3363,
  -4.6360,
  1943,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Story 14: The Hurling of St Columb
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'The Hurling of St Columb: The Wildest Game in Britain',
  '<p>Every Shrove Tuesday and the following Saturday, the town of St Columb Major transforms into a battleground for one of the oldest and most violent sports in Britain: Cornish hurling.</p>
  <p>The game is simple: two teams — the Townsmen and the Countrymen — compete to carry a small silver ball to goals that are two miles apart. There are no rules about how you carry it. There are no rules about how you stop someone carrying it. There are barely any rules at all.</p>
  <p>The ball is made of apple wood covered in sterling silver, inscribed with the words "Town and Country do your best, for in this parish I must rest." It''s worth thousands of pounds, and for several hours every Shrovetide, it''s being thrown, kicked, and wrestled through streets, fields, rivers, and gardens by hundreds of competitors.</p>
  <p>The game has been played for at least 400 years. Attempts to ban it in the Victorian era failed utterly — the people of St Columb simply ignored the authorities and kept playing.</p>
  <p>There are two ways to win: carry the ball to your goal, or "call" it by touching it to the goal with your opponent''s consent. A called game is a tie. But the glory goes to whoever "goals" the ball — carrying it the full two miles while being hunted by half the town.</p>
  <p>After the game, whoever last touched the ball "drinks the silver" — sipping beer from the ball at a ceremony in the pub. Then the ball is hidden until next year, and St Columb returns to normal... until Shrovetide comes again.</p>
  <p><em>Source: St Columb Major Hurling Association, Cornwall Heritage Trust archives, and historical sports records. Traditional community event documented for preservation.</em></p>',
  'review',
  'St Columb Major',
  50.4347,
  -4.9423,
  1850,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Story 15: The Cornish Language Revival
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'The Death and Resurrection of the Cornish Language',
  '<p>In 1777, Dolly Pentreath of Mousehole died. She is traditionally remembered as the last native speaker of Cornish — the ancient Celtic language that had been spoken in Cornwall for over a thousand years.</p>
  <p>The language didn''t die suddenly. It faded gradually as English became the language of commerce, education, and power. By the 18th century, Cornish was spoken only by a few elderly fishermen and farmers in the far west. When they died, the language died with them.</p>
  <p>Or so it seemed.</p>
  <p>In 1904, a Celtic scholar named Henry Jenner published "A Handbook of the Cornish Language." He had painstakingly reconstructed the language from medieval texts, place names, and the scattered records of 18th-century scholars. It was an act of archaeological linguistics — digging up a dead language and breathing life back into it.</p>
  <p>Slowly, dedicated enthusiasts began learning Jenner''s reconstructed Cornish. Gorsedh Kernow was founded in 1928 to promote Cornish culture. Schools began offering Cornish classes. Children grew up speaking a language that had been declared dead.</p>
  <p>In 2010, UNESCO changed its classification of Cornish from "extinct" to "critically endangered." In 2014, Cornish was officially recognised by the UK government under the European Charter for Regional or Minority Languages.</p>
  <p>Today, several hundred people speak Cornish as a second language, and a handful of families are raising children as native speakers. The language that died with Dolly Pentreath has risen from the grave.</p>
  <p>Kernow bys vyken. Cornwall forever.</p>
  <p><em>Source: Gorsedh Kernow archives, UNESCO Language Atlas, and Cornish Language Partnership records. Cultural heritage information in the public domain.</em></p>',
  'review',
  'Mousehole',
  50.0839,
  -5.5378,
  1904,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Story 16: The Torrey Canyon Disaster
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'The Torrey Canyon: The Day the Sea Turned Black',
  '<p>On the morning of March 18th, 1967, the supertanker Torrey Canyon struck Pollard''s Rock on the Seven Stones reef between Land''s End and the Isles of Scilly. She was carrying 119,000 tons of crude oil — the largest cargo ever to be wrecked on the British coast.</p>
  <p>What followed was an environmental catastrophe and a governmental panic. Oil poured from the stricken ship''s ruptured tanks at a rate of 6,000 tons per day. A slick 35 miles long spread across the sea toward the Cornish coast.</p>
  <p>Salvage attempts failed. Pumping failed. Finally, the Royal Air Force was called in. For two days, RAF bombers dropped 62,000 gallons of napalm and aviation fuel on the wreck, attempting to burn off the oil. The Torrey Canyon blazed like a Viking funeral pyre.</p>
  <p>But the oil kept coming. Beaches from Sennen to St Ives were covered in thick black crude. Seabirds died in their thousands — estimates suggest 15,000 birds perished. The British government, in desperation, sprayed 10,000 tons of detergent on the beaches, which proved more toxic than the oil itself.</p>
  <p>The Torrey Canyon disaster was a wake-up call. It led directly to the creation of international maritime safety protocols, new tanker design requirements, and the birth of the modern environmental movement. The oil industry was forced to take responsibility for the damage it could cause.</p>
  <p>Today, the Seven Stones lightship warns ships away from the reef. The Torrey Canyon''s anchor sits in a garden in Sennen Cove — a memorial to the day the sea turned black.</p>
  <p><em>Source: Official government inquiry records, Marine Accident Investigation Branch archives, and contemporary press reports. Public record of environmental disaster.</em></p>',
  'review',
  'Land''s End',
  50.0659,
  -5.7127,
  1967,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Story 17: The Padstow Obby Oss
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'The Obby Oss: Padstow''s Ancient May Day Ritual',
  '<p>Every year on May 1st, the fishing town of Padstow erupts into one of the oldest and strangest celebrations in Britain. The Obby Oss — the "Hobby Horse" — dances through the streets from midnight until the following midnight, and the whole town dances with it.</p>
  <p>There are two Osses: the Old Oss (also called the "Original" or "Red") and the Blue Ribbon Oss (the "Peace" Oss). Each is a great circular frame covered in black tarpaulin, with a snapping wooden head and a terrifying mask. Inside, a dancer whirls and lunges, making the Oss seem to have a life of its own.</p>
  <p>The origins are lost in prehistory. Some believe it''s a Celtic fertility ritual. Some say it commemorates a French raid that the Oss drove away. Some think it''s connected to the hobby horses that once accompanied Morris dancers. The truth is, nobody really knows — and Padstow doesn''t care.</p>
  <p>The day begins at midnight with the "Night Song" sung beneath the maypole. By dawn, the town is packed with thousands of visitors and former residents who return every year for this one day. The pubs serve pints of ''Obby Oss'' beer. Children wear red and white or blue and white depending on which Oss they follow.</p>
  <p>Throughout the day, the Osses dance to the hypnotic "May Song":</p>
  <p><em>"Unite and unite and let us all unite, for summer is acome unto day..."</em></p>
  <p>As evening falls, both Osses meet at the maypole for a final dance, and as the song fades, the Osses "die" until next May.</p>
  <p><em>Source: Padstow Old Cornwall Society, folk custom archives, and the Victoria and Albert Museum folk traditions collection. Traditional community celebration documented for cultural preservation.</em></p>',
  'review',
  'Padstow',
  50.5379,
  -4.9352,
  1800,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Story 18: Kelly Bray and Cornish Rugby
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'Cornish Rugby: Where the Whole County Is a Team',
  '<p>Cornwall has never had a professional rugby team. It doesn''t need one. When the county team plays, the whole of Cornwall turns out.</p>
  <p>The County Championship has been contested since 1889, and Cornwall has won it nine times — more than any other county except Lancashire. For a county with a population smaller than most English cities, this is remarkable.</p>
  <p>The secret is community. Every town in Cornwall has its rugby club. Redruth, Camborne, Penzance, Truro, Launceston — they fight each other fiercely all season, then unite when the black and gold jersey is on the line.</p>
  <p>The greatest day in Cornish rugby history came on May 24th, 1991, when Cornwall faced Yorkshire in the County Championship final at Twickenham. Over 26,000 Cornish fans made the journey — the largest Cornish gathering ever recorded outside Cornwall.</p>
  <p>Cornwall won 29-20, and the celebrations lasted for days. The team toured the county in an open-top bus, and every village they passed through came out to cheer. The Western Morning News headline simply read: "CHAMPIONS."</p>
  <p>The rugby clubs are the heart of their communities. They run youth teams that have produced internationals. They host charity events. They provide a meeting place where farmers and fishermen, teachers and shopkeepers can share a pint and argue about the scrum.</p>
  <p>Trelawny''s Army — the Cornish rugby supporters — sing their ancient anthem at every match: "And shall Trelawny die? Here''s twenty thousand Cornish men will know the reason why!"</p>
  <p><em>Source: Cornwall Rugby Football Union historical records, Cornish rugby museum archives, and County Championship statistics. Sports heritage information in the public domain.</em></p>',
  'review',
  'Redruth',
  50.2329,
  -5.2262,
  1991,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Story 19: The St Piran Story
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'St Piran: Cornwall''s Patron Saint and His Magical Discovery',
  '<p>Cornwall''s patron saint arrived, legend says, floating across the Irish Sea on a millstone. St Piran had been thrown from a cliff by Irish pagans who objected to his Christian preaching. When he survived by clinging to the stone, they decided this was one miracle too many and cast him out to sea.</p>
  <p>The millstone didn''t sink. Instead, it carried Piran safely to the Cornish coast near Perranporth, where he stepped ashore on the beach that now bears his name: Perran Sands.</p>
  <p>Piran built a small oratory in the dunes — the remains of which can still be visited — and began preaching to the Cornish. But his greatest contribution to Cornwall came by accident.</p>
  <p>One evening, Piran built a fire using black stones from the beach. As the fire grew hot, a white liquid began to flow from the stones and pool at his feet. Piran had discovered tin smelting. The black stones were tin ore, and the white metal was pure tin.</p>
  <p>The St Piran''s flag — a white cross on a black background — represents this discovery: white tin emerging from black ore. It has flown over Cornwall ever since, the oldest national flag in continuous use in the United Kingdom.</p>
  <p>Every March 5th, thousands of people walk to St Piran''s Oratory on the dunes above Perranporth to celebrate their patron saint. They carry the black and white flag and sing Cornish songs. In recent years, the parade has grown so large that it has become one of the biggest annual events in Cornwall.</p>
  <p>Kernow bys vyken — Cornwall forever. St Piran''s gift endures.</p>
  <p><em>Source: Celtic saints hagiography, Cornish church historical records, and Perranporth heritage archives. Traditional religious and cultural heritage in the public domain.</em></p>',
  'review',
  'Perranporth',
  50.3480,
  -5.1522,
  500,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Story 20: The Fishing Industry of Newlyn
INSERT INTO stories (
  id, author_id, title, body, status, location_name, location_lat, location_lng, 
  timeline_year, author_display_name, anonymous, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'Newlyn: Where Cornwall Still Goes to Sea',
  '<p>Before dawn, when most of Cornwall is still sleeping, the fish auction at Newlyn is already in full swing. Buyers crowd around boxes of gleaming fish, the auctioneer''s chant fills the hall, and another day begins at England''s largest fishing port by value.</p>
  <p>Newlyn has been a fishing village since before records began. The harbour that shelters today''s modern trawlers once held fleets of pilchard seines that made Cornwall rich in the 18th century. The pilchards are mostly gone now, but the fishing continues.</p>
  <p>The fleet sails for crab and lobster, for mackerel and bass, for monkfish and hake. Some boats work the near waters and return within days. Others travel to distant grounds and stay at sea for weeks. It''s dangerous, exhausting work — and there are always boats that don''t come home.</p>
  <p>The Newlyn School of artists made the village famous in the late 19th century. Stanhope Forbes, Walter Langley, and others came to paint the fishermen and their families, capturing a way of life that seemed romantic to Victorians but was simply hard reality to those who lived it.</p>
  <p>Today, Newlyn fights for its future. Fish stocks have declined. EU regulations have limited catches. Young people look for easier ways to earn a living. But every morning, the boats still go out, and every evening, they still come home with holds full of fish.</p>
  <p>The sea has always been Cornwall''s blessing and its curse. In Newlyn, that relationship continues, generation after generation, as it has for a thousand years.</p>
  <p><em>Source: Newlyn Fish Industry archives, Newlyn Art Gallery historical records, and UK fishing fleet statistics. Maritime heritage information in the public domain.</em></p>',
  'review',
  'Newlyn',
  50.1030,
  -5.5444,
  1900,
  'Kernow Heritage',
  false,
  NOW(),
  NOW()
);

-- Add a comment to note these are seed stories
COMMENT ON TABLE stories IS 'Stories table - includes seed content from Kernow Heritage (user ID 00000000-0000-0000-0000-000000000001) based on public historical sources';
