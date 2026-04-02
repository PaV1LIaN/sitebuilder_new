<?php
declare(strict_types=1);

function sb_layout_empty_record(int $siteId): array
{
    return [
        'siteId' => $siteId,
        'zones' => [
            'header' => [],
            'footer' => [],
            'left'   => [],
            'right'  => [],
        ],
    ];
}

function sb_layout_find_record(array $all, int $siteId): ?array
{
    foreach ($all as $r) {
        if ((int)($r['siteId'] ?? 0) === $siteId) {
            return $r;
        }
    }
    return null;
}

function sb_layout_upsert_record(array &$all, int $siteId, array $record): void
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

function sb_layout_ensure_record(int $siteId): array
{
    $all = sb_read_layouts();
    $rec = sb_layout_find_record($all, $siteId);

    if ($rec) {
        return $rec;
    }

    $rec = sb_layout_empty_record($siteId);
    $all[] = $rec;
    sb_write_layouts($all);

    return $rec;
}

function sb_layout_valid_zone(string $zone): bool
{
    return in_array($zone, ['header', 'footer', 'left', 'right'], true);
}

function sb_layout_zone_blocks(array $record, string $zone): array
{
    $zones = $record['zones'] ?? [];
    $blocks = $zones[$zone] ?? [];
    return is_array($blocks) ? $blocks : [];
}

function sb_layout_zone_set(array &$record, string $zone, array $blocks): void
{
    if (!isset($record['zones']) || !is_array($record['zones'])) {
        $record['zones'] = [];
    }

    $record['zones'][$zone] = array_values($blocks);
}

function sb_layout_next_block_id(array $record): int
{
    $max = 0;
    $zones = is_array($record['zones'] ?? null) ? $record['zones'] : [];

    foreach ($zones as $zoneBlocks) {
        if (!is_array($zoneBlocks)) {
            continue;
        }

        foreach ($zoneBlocks as $b) {
            $max = max($max, (int)($b['id'] ?? 0));
        }
    }

    return $max + 1;
}

function sb_layout_next_sort(array $blocks): int
{
    $max = 0;
    foreach ($blocks as $b) {
        $max = max($max, (int)($b['sort'] ?? 0));
    }
    return $max + 10;
}

function sb_layout_find_block(array $record, string $zone, int $blockId): ?array
{
    $blocks = sb_layout_zone_blocks($record, $zone);

    foreach ($blocks as $b) {
        if ((int)($b['id'] ?? 0) === $blockId) {
            return $b;
        }
    }

    return null;
}