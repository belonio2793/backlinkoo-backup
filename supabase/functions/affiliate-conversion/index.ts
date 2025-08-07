import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { affiliateId, userId, orderValue, commissionType = 'subscription' } = await req.json()

    if (!affiliateId || !userId || !orderValue) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get affiliate profile
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliate_profiles')
      .select('commission_rate, tier')
      .eq('affiliate_id', affiliateId)
      .single()

    if (affiliateError || !affiliate) {
      return new Response(
        JSON.stringify({ error: 'Affiliate not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate commission
    const commissionAmount = orderValue * affiliate.commission_rate

    // Create commission record
    const { data: commission, error: commissionError } = await supabase
      .from('affiliate_commissions')
      .insert({
        affiliate_id: affiliateId,
        user_id: userId,
        commission_type: commissionType,
        amount: commissionAmount,
        percentage: affiliate.commission_rate,
        order_value: orderValue,
        status: 'pending',
        tier_at_time: affiliate.tier
      })
      .select()
      .single()

    if (commissionError) {
      console.error('Commission creation error:', commissionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create commission' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update affiliate stats
    const { error: updateError } = await supabase
      .from('affiliate_profiles')
      .update({
        total_earnings: supabase.sql`total_earnings + ${commissionAmount}`,
        total_conversions: supabase.sql`total_conversions + 1`,
        updated_at: new Date().toISOString()
      })
      .eq('affiliate_id', affiliateId)

    if (updateError) {
      console.error('Stats update error:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        commission,
        commissionAmount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Affiliate conversion error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
