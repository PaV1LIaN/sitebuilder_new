<?php
declare(strict_types=1);

function sb_menu_get_site_record(array $all, int $siteId): ?array
{
    foreach ($all as $r) {
        if ((int)($r['siteId'] ?? 0) === $siteId) {
            return $r;
        }
    }
    return null;
}

function sb_menu_upsert_site_record(array &$all, int $siteId, array $record): void
{
    $found = false;

    foreach ($all as $i => $r) {
        if ((int)($r['siteId'] ?? 0) === $siteId) {
            $all[$i] = $record;
            $found = true;
            break;
        }
    }

    if (!$found) {
        $all[] = $record;
    }
}

function sb_menu_next_menu_id(array $siteRecord): int
{
    $max = 0;
    foreach (($siteRecord['menus'] ?? []) as $m) {
        $max = max($max, (int)($m['id'] ?? 0));
    }
    return $max + 1;
}

function sb_menu_next_item_id(array $menu): int
{
    $max = 0;
    foreach (($menu['items'] ?? []) as $it) {
        $max = max($max, (int)($it['id'] ?? 0));
    }
    return $max + 1;
}

function sb_menu_next_sort(array $items): int
{
    $max = 0;
    foreach ($items as $it) {
        $max = max($max, (int)($it['sort'] ?? 0));
    }
    return $max + 10;
}

function sb_menu_find_menu(array $siteRecord, int $menuId): ?array
{
    foreach (($siteRecord['menus'] ?? []) as $m) {
        if ((int)($m['id'] ?? 0) === $menuId) {
            return $m;
        }
    }
    return null;
}

function sb_menu_update_menu(array &$siteRecord, int $menuId, callable $fn): bool
{
    $menus = $siteRecord['menus'] ?? [];
    $changed = false;

    foreach ($menus as $i => $m) {
        if ((int)($m['id'] ?? 0) === $menuId) {
            $menus[$i] = $fn($m);
            $changed = true;
            break;
        }
    }

    if ($changed) {
        $siteRecord['menus'] = $menus;
    }

    return $changed;
}