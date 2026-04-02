<?php
declare(strict_types=1);

function sb_slugify(string $name): string
{
    $slug = \CUtil::translit($name, 'ru', [
        'replace_space' => '-',
        'replace_other' => '-',
        'change_case' => 'L',
        'delete_repeat_replace' => true,
        'use_google' => false,
    ]);

    $slug = trim($slug, '-');
    return $slug !== '' ? $slug : 'item';
}
