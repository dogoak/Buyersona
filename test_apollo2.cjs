const fetch = require('node-fetch');

async function test() {
    const res = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'NckTGdWYYIfh3B_AVEKiwg' },
        body: JSON.stringify({ q_keywords: "ecommerce", per_page: 2 })
    });

    console.log(res.status, await res.text());
}
test();
