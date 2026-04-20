async function test() {
    const res = await fetch('https://ieadzvrdvduebbukfqls.supabase.co/functions/v1/apify-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer eyJ...` },
        body: JSON.stringify({ 
            action: 'scrape_google_serp', 
            payload: { queries: ["site:linkedin.com/in/ \"CEO\" \"ecommerce\" \"moda\" \"Argentina\""] }
        })
    });
    console.log(res.status, await res.text());
}
test();
