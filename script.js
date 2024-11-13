// Define the GitHub API endpoint for updating JSON files in the repository
const GITHUB_API_URL = 'https://api.github.com/repos/jaxfellow/ourpotluck/contents/'; // replace with your repo
const REPO_TOKEN = 'YOUR_GITHUB_TOKEN'; // secure this token as it requires repo permissions

// Helper function to send requests to GitHub
async function updateJSONFile(filePath, data, message = 'Update JSON file') {
    const response = await fetch(`${GITHUB_API_URL}${filePath}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${REPO_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            content: btoa(JSON.stringify(data)),
            sha: await getFileSha(filePath), // get the latest file SHA
        })
    });
    return response.json();
}

// Helper to get file SHA (required to update files on GitHub)
async function getFileSha(filePath) {
    const response = await fetch(`${GITHUB_API_URL}${filePath}`, {
        headers: { 'Authorization': `Bearer ${REPO_TOKEN}` }
    });
    const data = await response.json();
    return data.sha;
}

// Event creation
document.getElementById('createEventForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const event = {
        title: document.getElementById('eventTitle').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        place: document.getElementById('eventPlace').value
    };

    await updateJSONFile('events.json', event, 'Add new event');
    alert('Event created successfully!');
});

// Add categories and items
document.getElementById('addItemsForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const category = document.getElementById('categoryName').value;
    const item = document.getElementById('itemName').value;

    const itemsData = await fetchJSONFile('event_items.json');
    if (!itemsData[category]) itemsData[category] = [];
    itemsData[category].push({ name: item, assignedTo: '', status: 'pending' });

    await updateJSONFile('event_items.json', itemsData, 'Add new category/item');
    alert('Item added successfully!');
});

// Assign item
document.querySelectorAll('.assignItemForm').forEach(form => {
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const itemName = e.target.elements.itemName.value;
        const assignedTo = e.target.elements.assignedTo.value;

        const itemsData = await fetchJSONFile('event_items.json');
        for (const category in itemsData) {
            const item = itemsData[category].find(i => i.name === itemName);
            if (item) {
                item.assignedTo = assignedTo;
                break;
            }
        }

        await updateJSONFile('event_items.json', itemsData, 'Assign item to participant');
        alert(`${assignedTo} has been assigned to ${itemName}`);
    });
});

// Mark item/category as done
document.querySelectorAll('.markDoneForm').forEach(form => {
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const itemName = e.target.elements.itemName.value;

        const itemsData = await fetchJSONFile('event_items.json');
        for (const category in itemsData) {
            const item = itemsData[category].find(i => i.name === itemName);
            if (item) {
                item.status = 'brought';
                break;
            }
        }

        await updateJSONFile('event_items.json', itemsData, 'Mark item as brought');
        alert(`${itemName} marked as brought`);
    });
});

// Fetch JSON files
async function fetchJSONFile(filePath) {
    const response = await fetch(`${GITHUB_API_URL}${filePath}`, {
        headers: { 'Authorization': `Bearer ${REPO_TOKEN}` }
    });
    const data = await response.json();
    return JSON.parse(atob(data.content));
}
