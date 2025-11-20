import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NYCDataRow {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  wheelchair_accessible?: string;
  changing_table?: string;
  gender_neutral?: string;
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

    console.log('Fetching NYC Open Data...');
    
    // NYC Open Data API endpoint for accessible bathrooms
    const nycApiUrl = 'https://data.cityofnewyork.us/resource/h87e-jfi2.json?$limit=1000';
    const response = await fetch(nycApiUrl);
    
    if (!response.ok) {
      throw new Error(`NYC API error: ${response.statusText}`);
    }

    const nycData: NYCDataRow[] = await response.json();
    console.log(`Fetched ${nycData.length} records from NYC Open Data`);

    let imported = 0;
    let merged = 0;
    let skipped = 0;

    for (const item of nycData) {
      try {
        if (!item.latitude || !item.longitude || !item.name) {
          skipped++;
          continue;
        }

        const lat = parseFloat(item.latitude);
        const lon = parseFloat(item.longitude);

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

        const bathroomData = {
          name: item.name,
          address: item.address || 'NYC',
          latitude: lat,
          longitude: lon,
          wheelchair_accessible: item.wheelchair_accessible === 'Yes' || item.wheelchair_accessible === 'true',
          changing_table: item.changing_table === 'Yes' || item.changing_table === 'true',
          gender_neutral: item.gender_neutral === 'Yes' || item.gender_neutral === 'true',
          verified: true,
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
        total: nycData.length,
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
