import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OSMElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    'addr:street'?: string;
    'addr:city'?: string;
    'addr:state'?: string;
    'addr:postcode'?: string;
    'addr:housenumber'?: string;
    wheelchair?: string;
    'changing_table'?: string;
    'toilets:wheelchair'?: string;
    unisex?: string;
    'opening_hours'?: string;
    description?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('VITE_SUPABASE_URL') ?? '',
      Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Fetching OpenStreetMap data...');
    
    // OpenStreetMap Overpass API query for toilets in the US (focusing on major cities)
    // Limiting to avoid timeout - querying accessible toilets
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="toilets"]["wheelchair"="yes"](40.4,-74.3,40.9,-73.7);
        way["amenity"="toilets"]["wheelchair"="yes"](40.4,-74.3,40.9,-73.7);
      );
      out center;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (!response.ok) {
      throw new Error(`OSM API error: ${response.statusText}`);
    }

    const osmData = await response.json();
    const elements: OSMElement[] = osmData.elements || [];
    console.log(`Fetched ${elements.length} records from OpenStreetMap`);

    let imported = 0;
    let merged = 0;
    let skipped = 0;

    for (const item of elements) {
      try {
        const lat = item.lat || item.center?.lat;
        const lon = item.lon || item.center?.lon;

        if (!lat || !lon) {
          skipped++;
          continue;
        }

        // Check for existing location within 50 meters
        const { data: existing, error: searchError } = await supabaseClient
          .from('bathrooms')
          .select('*')
          .gte('latitude', lat - 0.0005)
          .lte('latitude', lat + 0.0005)
          .gte('longitude', lon - 0.0005)
          .lte('longitude', lon + 0.0005)
          .limit(1)
          .single();

        if (searchError && searchError.code !== 'PGRST116') {
          console.error('Search error:', searchError);
          continue;
        }

        const tags = item.tags || {};
        const streetNumber = tags['addr:housenumber'] || '';
        const street = tags['addr:street'] || '';
        const city = tags['addr:city'] || 'New York';
        const state = tags['addr:state'] || 'NY';
        const postcode = tags['addr:postcode'] || '';

        const addressParts = [streetNumber, street, city, state, postcode].filter(Boolean);
        const address = addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';

        const bathroomData = {
          name: tags.name || `Public Restroom in ${city}`,
          address: address,
          latitude: lat,
          longitude: lon,
          wheelchair_accessible: tags.wheelchair === 'yes' || tags['toilets:wheelchair'] === 'yes',
          changing_table: tags['changing_table'] === 'yes',
          gender_neutral: tags.unisex === 'yes',
          description: tags.description || null,
          verified: false, // OSM is crowd-sourced
        };

        if (existing) {
          // Merge data
          const updateData: any = {};
          if (bathroomData.wheelchair_accessible && !existing.wheelchair_accessible) {
            updateData.wheelchair_accessible = true;
          }
          if (bathroomData.changing_table && !existing.changing_table) {
            updateData.changing_table = true;
          }
          if (bathroomData.gender_neutral && !existing.gender_neutral) {
            updateData.gender_neutral = true;
          }
          if (bathroomData.description && !existing.description) {
            updateData.description = bathroomData.description;
          }

          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabaseClient
              .from('bathrooms')
              .update(updateData)
              .eq('id', existing.id);

            if (updateError) {
              console.error('Update error:', updateError);
              skipped++;
            } else {
              merged++;
            }
          } else {
            skipped++;
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabaseClient
            .from('bathrooms')
            .insert(bathroomData);

          if (insertError) {
            console.error('Insert error:', insertError);
            skipped++;
          } else {
            imported++;
          }
        }
      } catch (itemError) {
        console.error('Item processing error:', itemError);
        skipped++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        merged,
        skipped,
        total: elements.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Import failed';
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
