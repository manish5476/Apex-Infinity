$patterns = @{
    SearchBars = 'placeholder=".*Search.*"|<span class="p-input-icon-left"|pInputText.*search'
    FilterPanels = '<p-sidebar|<p-overlayPanel|class=".*filter-panel.*"'
    Forms = '<form'
    InfoCards = 'class=".*info-card.*"'
}

$results = @{}
foreach ($key in $patterns.Keys) {
    $count = (Get-ChildItem -Path d:\Apex\apex\src\app -Recurse -Include *.html,*.ts | Select-String -Pattern $patterns[$key] -AllMatches).Matches.Count
    $results[$key] = $count
}

$results | ConvertTo-Json
