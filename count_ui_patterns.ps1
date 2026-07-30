$patterns = @{
    Toolbars = "<p-toolbar"
    PageHeaders = 'class=".*header.*"|class="flex justify-between items-center.*"'
    SearchBars = 'placeholder="Search"|<span class="p-input-icon-left"'
    FilterPanels = '<p-sidebar|<p-accordion'
    Cards = '<p-card|class="card"|class="p-card"'
    Forms = '<form'
    Dialogs = '<p-dialog'
    TableToolbars = '<ng-template pTemplate="caption">'
    ActionGroups = 'class=".*flex gap-.*justify-end.*"|class=".*actions.*"'
    EmptyStates = 'No records found|No data found|class=".*empty-state.*"'
    LoadingSkeletons = '<p-skeleton'
    StatusBadges = '<p-tag|<p-badge|class=".*badge.*"'
    Chips = '<p-chip'
    StatCards = 'class=".*stat-card.*"|<div class=".*card.*".*<i class="pi.*"'
}

$results = @{}
foreach ($key in $patterns.Keys) {
    $count = (Get-ChildItem -Path d:\Apex\apex\src\app -Recurse -Include *.html,*.ts | Select-String -Pattern $patterns[$key] -AllMatches).Matches.Count
    $results[$key] = $count
}

$results | ConvertTo-Json
