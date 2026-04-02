<?php
declare(strict_types=1);

function sb_data_path(string $file): string
{
    return $_SERVER['DOCUMENT_ROOT'] . '/upload/sitebuilder/' . $file;
}

function sb_read_json_file(string $file): array
{
    $path = sb_data_path($file);
    if (!file_exists($path)) {
        return [];
    }

    $fp = fopen($path, 'rb');
    if (!$fp) {
        return [];
    }

    $raw = '';
    if (flock($fp, LOCK_SH)) {
        $raw = (string)stream_get_contents($fp);
        flock($fp, LOCK_UN);
    } else {
        $raw = (string)stream_get_contents($fp);
    }
    fclose($fp);

    if (strncmp($raw, "\xEF\xBB\xBF", 3) === 0) {
        $raw = substr($raw, 3);
    }

    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function sb_write_json_file(string $file, array $data, string $errMsg): void
{
    $dir = dirname(sb_data_path($file));
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }

    $path = sb_data_path($file);
    $fp = fopen($path, 'c+');
    if (!$fp) {
        throw new RuntimeException($errMsg);
    }

    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        throw new RuntimeException('Cannot lock ' . $file);
    }

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode(array_values($data), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

function sb_read_sites(): array { return sb_read_json_file('sites.json'); }
function sb_write_sites(array $sites): void { sb_write_json_file('sites.json', $sites, 'Cannot open sites.json'); }

function sb_read_pages(): array { return sb_read_json_file('pages.json'); }
function sb_write_pages(array $pages): void { sb_write_json_file('pages.json', $pages, 'Cannot open pages.json'); }

function sb_read_blocks(): array { return sb_read_json_file('blocks.json'); }
function sb_write_blocks(array $blocks): void { sb_write_json_file('blocks.json', $blocks, 'Cannot open blocks.json'); }

function sb_read_access(): array { return sb_read_json_file('access.json'); }
function sb_write_access(array $access): void { sb_write_json_file('access.json', $access, 'Cannot open access.json'); }

function sb_read_menus(): array { return sb_read_json_file('menus.json'); }
function sb_write_menus(array $menus): void { sb_write_json_file('menus.json', $menus, 'Cannot open menus.json'); }

function sb_read_templates(): array { return sb_read_json_file('templates.json'); }
function sb_write_templates(array $templates): void { sb_write_json_file('templates.json', $templates, 'Cannot open templates.json'); }

function sb_read_layouts(): array { return sb_read_json_file('layouts.json'); }
function sb_write_layouts(array $layouts): void { sb_write_json_file('layouts.json', $layouts, 'Cannot open layouts.json'); }