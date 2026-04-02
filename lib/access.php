<?php
declare(strict_types=1);

function sb_user_access_code(): string
{
    return 'U' . (int)$GLOBALS['USER']->GetID();
}

function sb_get_role(int $siteId, string $accessCode): ?string
{
    $access = sb_read_access();

    foreach ($access as $r) {
        if ((int)($r['siteId'] ?? 0) === $siteId && (string)($r['accessCode'] ?? '') === $accessCode) {
            $role = strtoupper((string)($r['role'] ?? ''));
            return $role !== '' ? $role : null;
        }
    }

    return null;
}

function sb_role_rank(?string $role): int
{
    $role = strtoupper((string)$role);

    return match ($role) {
        'OWNER'  => 4,
        'ADMIN'  => 3,
        'EDITOR' => 2,
        'VIEWER' => 1,
        default  => 0,
    };
}

function sb_require_site_role(int $siteId, int $minRank): void
{
    $role = sb_get_role($siteId, sb_user_access_code());

    if (sb_role_rank($role) < $minRank) {
        sb_error(403, 'FORBIDDEN', [
            'siteId' => $siteId,
            'role' => $role,
        ]);
    }
}

function sb_require_owner(int $siteId): void { sb_require_site_role($siteId, 4); }
function sb_require_admin(int $siteId): void { sb_require_site_role($siteId, 3); }
function sb_require_editor(int $siteId): void { sb_require_site_role($siteId, 2); }
function sb_require_viewer(int $siteId): void { sb_require_site_role($siteId, 1); }

function sb_site_exists(int $siteId): bool
{
    foreach (sb_read_sites() as $s) {
        if ((int)($s['id'] ?? 0) === $siteId) {
            return true;
        }
    }
    return false;
}

function sb_find_site(int $siteId): ?array
{
    foreach (sb_read_sites() as $s) {
        if ((int)($s['id'] ?? 0) === $siteId) {
            return $s;
        }
    }
    return null;
}

function sb_find_page(int $pageId): ?array
{
    foreach (sb_read_pages() as $p) {
        if ((int)($p['id'] ?? 0) === $pageId) {
            return $p;
        }
    }
    return null;
}

function sb_find_block(int $blockId): ?array
{
    foreach (sb_read_blocks() as $b) {
        if ((int)($b['id'] ?? 0) === $blockId) {
            return $b;
        }
    }
    return null;
}