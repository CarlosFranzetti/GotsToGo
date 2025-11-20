import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RefugeRestroom {
  id: number;
  name: string;
  street: string;
  city: string;
  state: string;
  country: string;
  accessible: boolean;
  unisex: boolean;
  changing_table: boolean;
  latitude: number;
  longitude: number;
  directions?: string;
  comment?: string;
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

    console.log('Fetching Refuge Restrooms data...');
    
    // Refuge Restrooms API - free, no key required
    // Using per_page=100 to get substantial data
    const refugeApiUrl = 'https://www.refugerestrooms.org/api/v1/restrooms?per_page=100';
    const response = await fetch(refugeApiUrl, {
      headers: {
        'User-Agent': 'AccessibleBathroomFinder/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Refuge API error: ${response.statusText}`);
    }

    const refugeData: RefugeRestroom[] = await response.json();
    console.log(`Fetched ${refugeData.length} records from Refuge Restrooms`);

    let imported = 0;
    let merged = 0;
    let skipped = 0;

    for (const item of refugeData) {
      try {
        if (!item.latitude || !item.longitude) {
          skipped++;
          continue;
        }

        const lat = item.latitude;
        const lon = item.longitude;

        if (isNaN(lat) || isNaN(lon)) {
          skipped++;
          continue;
        }

        // Check for existing location within 50 meters (~0.0005 degrees)
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

        const address = [item.street, item.city, item.state, item.country]
          .filter(Boolean)
          .join(', ') || 'Address not available';

        const description = [item.directions, item.comment]
          .filter(Boolean)
          .join(' | ') || null;

        const bathroomData = {
          name: item.name || `Restroom in ${item.city || 'Unknown'}`,
          address: address,
          latitude: lat,
          longitude: lon,
          wheelchair_accessible: item.accessible || false,
          changing_table: item.changing_table || false,
          gender_neutral: item.unisex || false,
          description: description,
          verified: false, // Refuge data is crowd-sourced
        };

        if (existing) {
          // Merge data - update if new info is available
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
        total: refugeData.length,
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
