
const fs = require("fs");
const path = require("path");

function searchDir(dir, patterns) {
    let counts = {};
    for(const key of Object.keys(patterns)) counts[key] = 0;

    function walk(dir) {
        const files = fs.readdirSync(dir);
        for(const file of files) {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                if (file !== "node_modules" && file !== ".git") {
                    walk(filePath);
                }
            } else if (file.endsWith(".html")) {
                const content = fs.readFileSync(filePath, "utf-8");
                for (const [key, regex] of Object.entries(patterns)) {
                    const matches = content.match(regex);
                    if (matches) {
                        counts[key] += matches.length;
                    }
                }
            }
        }
    }
    walk(dir);
    return counts;
}

const patterns = {
    Toolbars: /<p-toolbar|class="[^"]*toolbar[^"]*"/g,
    PageHeaders: /class="[^"]*(page-header|header-section)[^"]*"/g,
    SearchBars: /placeholder="[^"]*Search[^"]*"|class="[^"]*search-(box|container)[^"]*"/gi,
    FilterPanels: /class="[^"]*(filter-panel|filters-section|filter-container)[^"]*"/gi,
    Cards: /<p-card|class="[^"]*(card|p-card)[^"]*"/g,
    Forms: /<form/g,
    Dialogs: /<p-dialog/g,
    TableToolbars: /<ng-template pTemplate="caption">/g,
    ActionGroups: /class="[^"]*(action-group|actions-container|button-group)[^"]*"/g,
    EmptyStates: /No records found|No data found|class="[^"]*empty-state[^"]*"/gi,
    LoadingSkeletons: /<p-skeleton/g,
    StatusBadges: /<p-tag|<p-badge|class="[^"]*badge[^"]*"/g,
    Chips: /<p-chip/g,
    StatCards: /class="[^"]*stat(istic)?-card[^"]*"/gi,
    InfoCards: /class="[^"]*info-card[^"]*"/gi
};

const results = searchDir("d:\\\\Apex\\\\apex\\\\src\\\\app", patterns);
console.log(JSON.stringify(results, null, 2));

