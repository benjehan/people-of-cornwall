/**
 * Backfill location_lat / location_lng for events that are missing coordinates.
 *
 * Uses OpenStreetMap Nominatim (free, no API key) with Cornwall bounding box.
 * Respects Nominatim's 1-request-per-second rate limit.
 *
 * Usage:  npx tsx scripts/geocode-events.ts
 *         npx tsx scripts/geocode-events.ts --dry-run   (preview only)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually (no dotenv dependency needed)
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  process.env[key] = val;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DRY_RUN = process.argv.includes("--dry-run");

// Known Cornish town coordinates as a first-pass fallback
const TOWN_COORDINATES: Record<string, [number, number]> = {
  "Bodmin": [50.4692, -4.7165],
  "Bude": [50.8296, -4.5454],
  "Camborne": [50.2132, -5.2975],
  "Falmouth": [50.1537, -5.0714],
  "Hayle": [50.1892, -5.4241],
  "Helston": [50.1024, -5.2724],
  "Launceston": [50.6373, -4.3591],
  "Liskeard": [50.4560, -4.4653],
  "Looe": [50.3567, -4.4544],
  "Lostwithiel": [50.4070, -4.6730],
  "Marazion": [50.1258, -5.4688],
  "Mevagissey": [50.2700, -4.7904],
  "Mousehole": [50.0829, -5.5381],
  "Newlyn": [50.1026, -5.5429],
  "Newquay": [50.4125, -5.0757],
  "Padstow": [50.5425, -4.9357],
  "Penryn": [50.1681, -5.1044],
  "Penzance": [50.1180, -5.5375],
  "Perranporth": [50.3456, -5.1519],
  "Port Isaac": [50.5927, -4.8314],
  "Porthleven": [50.0847, -5.3153],
  "Redruth": [50.2327, -5.2268],
  "St Agnes": [50.3119, -5.2038],
  "St Austell": [50.3398, -4.7875],
  "St Ives": [50.2114, -5.4803],
  "St Just": [50.1235, -5.6833],
  "Tintagel": [50.6636, -4.7530],
  "Truro": [50.2632, -5.0510],
  "Wadebridge": [50.5176, -4.8353],
  "Fowey": [50.3361, -4.6395],
  "Saltash": [50.4087, -4.2107],
  "Torpoint": [50.3769, -4.1973],
  "Callington": [50.5034, -4.3164],
  "Par": [50.3530, -4.7035],
  "St Columb Major": [50.4323, -4.9493],
  "St Blazey": [50.3589, -4.7206],
  "Camelford": [50.6213, -4.6823],
  "Gorran Haven": [50.2528, -4.7837],
  "Charlestown": [50.3350, -4.7590],
  "Polperro": [50.3327, -4.5154],
  "Rock": [50.5506, -4.9205],
  "Carbis Bay": [50.1987, -5.4677],
  "Coverack": [50.0274, -5.0926],
  "Mullion": [50.0229, -5.2512],
  "Lizard": [49.9581, -5.2019],
  "Sennen": [50.0705, -5.6947],
  "St Mawes": [50.1585, -5.0161],
  "Roseland": [50.1800, -4.9500],
  "Indian Queens": [50.3839, -4.9340],
  "Pool": [50.2218, -5.2638],
  "Stithians": [50.1845, -5.1765],
  "Mylor Bridge": [50.1801, -5.0673],
  "Constantine": [50.1242, -5.1571],
  "Praze-an-Beeble": [50.1607, -5.3093],
  "Leedstown": [50.1640, -5.3850],
  "Gweek": [50.0898, -5.2026],
  "Manaccan": [50.0644, -5.1065],
  "Mawgan Porth": [50.4616, -5.0360],
  "Portreath": [50.2633, -5.2876],
  "Illogan": [50.2368, -5.2672],
  "Lanner": [50.2112, -5.2115],
  "Sticker": [50.3186, -4.8332],
  "Grampound": [50.2946, -4.8861],
  "Tregony": [50.2627, -4.9211],
  "Veryan": [50.2329, -4.9338],
  "St Mawgan": [50.4547, -5.0042],
  "Crantock": [50.4074, -5.0999],
  "Cubert": [50.3749, -5.1019],
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function geocodeLocation(query: string): Promise<[number, number] | null> {
  const params = new URLSearchParams({
    q: `${query}, Cornwall, UK`,
    format: "json",
    addressdetails: "1",
    limit: "3",
    viewbox: "-5.8,49.9,-4.2,50.8",
    bounded: "1",
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { "User-Agent": "PeopleOfCornwall/1.0 (geocode-backfill)" },
  });

  if (!res.ok) {
    console.warn(`  Nominatim error ${res.status} for "${query}"`);
    return null;
  }

  const results = await res.json();
  if (results.length === 0) return null;

  return [parseFloat(results[0].lat), parseFloat(results[0].lon)];
}

function matchTown(locationName: string): [number, number] | null {
  const lower = locationName.toLowerCase();
  for (const [town, coords] of Object.entries(TOWN_COORDINATES)) {
    if (lower.includes(town.toLowerCase())) {
      return coords;
    }
  }
  return null;
}

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN (no DB updates) ===" : "=== Geocoding events ===");

  // Fetch events missing coordinates
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, location_name, location_address, location_lat, location_lng")
    .or("location_lat.is.null,location_lng.is.null");

  if (error) {
    console.error("Error fetching events:", error);
    process.exit(1);
  }

  console.log(`Found ${events.length} events missing coordinates\n`);

  if (events.length === 0) {
    console.log("Nothing to do!");
    return;
  }

  // Group by unique location_name to minimise Nominatim calls
  const locationGroups = new Map<string, typeof events>();
  for (const event of events) {
    const key = event.location_name.trim().toLowerCase();
    if (!locationGroups.has(key)) locationGroups.set(key, []);
    locationGroups.get(key)!.push(event);
  }

  console.log(`${locationGroups.size} unique location names to resolve\n`);

  let resolved = 0;
  let townMatched = 0;
  let nominatimResolved = 0;
  let failed = 0;
  const failedLocations: string[] = [];

  for (const [_key, groupEvents] of locationGroups) {
    const locationName = groupEvents[0].location_name;
    const locationAddress = groupEvents[0].location_address;

    // Step 1: Try known town coordinates
    let coords = matchTown(locationName);
    let source = "town-lookup";

    // Step 2: Try Nominatim with address first, then name
    if (!coords && locationAddress) {
      coords = await geocodeLocation(locationAddress);
      source = "nominatim-address";
      await sleep(1100); // Rate limit
    }

    if (!coords) {
      coords = await geocodeLocation(locationName);
      source = "nominatim-name";
      await sleep(1100);
    }

    if (coords) {
      const [lat, lng] = coords;
      const ids = groupEvents.map((e) => e.id);

      if (source.startsWith("town")) townMatched += ids.length;
      else nominatimResolved += ids.length;
      resolved += ids.length;

      console.log(`  [${source}] "${locationName}" -> ${lat.toFixed(4)}, ${lng.toFixed(4)} (${ids.length} events)`);

      if (!DRY_RUN) {
        const { error: updateError } = await supabase
          .from("events")
          .update({ location_lat: lat, location_lng: lng })
          .in("id", ids);

        if (updateError) {
          console.error(`  ERROR updating: ${updateError.message}`);
        }
      }
    } else {
      failed += groupEvents.length;
      failedLocations.push(locationName);
      console.log(`  [FAILED] "${locationName}" (${groupEvents.length} events) — no coordinates found`);
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Total events missing coords: ${events.length}`);
  console.log(`Resolved via town lookup:    ${townMatched}`);
  console.log(`Resolved via Nominatim:      ${nominatimResolved}`);
  console.log(`Total resolved:              ${resolved}`);
  console.log(`Failed:                      ${failed}`);

  if (failedLocations.length > 0) {
    console.log(`\nFailed locations (${failedLocations.length}):`);
    failedLocations.forEach((loc) => console.log(`  - ${loc}`));
  }

  if (DRY_RUN) {
    console.log("\n(Dry run — no changes made. Remove --dry-run to update the database.)");
  }
}

main().catch(console.error);
