// fetch built in

async function test() {
    const filters = {
        "person_titles": ["CEO", "Director Comercial", "Fundador", "Gerente General"],
        "person_locations": ["Argentina"],
        "q_keywords": "ecommerce moda"
    };

    const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'NckTGdWYYIfh3B_AVEKiwg' },
        body: JSON.stringify({ ...filters, per_page: 5 })
    });

    if (!res.ok) {
        console.error("API ERROR:", res.status, await res.text());
        return;
    }

    const data = await res.json();
    console.log("PEOPLE FOUND:", data.people ? data.people.length : 0);
    if (data.people && data.people.length > 0) {
        console.log("FIRST:", data.people[0].name, data.people[0].title);
    } else {
        console.log("NO PEOPLE", data);
    }
}
test();
