<?php
declare(strict_types=1);

function sb_disk_add_subfolder(Folder $parent, array $fields, Storage $storage): Folder
{
    try {
        $folder = $parent->addSubFolder($fields, []);
        if ($folder instanceof Folder) {
            return $folder;
        }
    } catch (\Throwable $e) {
    }

    $ctx = $storage->getSecurityContext($GLOBALS['USER']);
    $folder = $parent->addSubFolder($fields, $ctx);

    if ($folder instanceof Folder) {
        return $folder;
    }

    throw new RuntimeException('CANNOT_CREATE_FOLDER');
}

function sb_disk_upload_file(Folder $folder, array $fileArray, array $fields, Storage $storage): File
{
    try {
        $obj = $folder->uploadFile($fileArray, $fields, []);
        if ($obj instanceof File) {
            return $obj;
        }
    } catch (\Throwable $e) {
    }

    $ctx = $storage->getSecurityContext($GLOBALS['USER']);
    $obj = $folder->uploadFile($fileArray, $fields, $ctx);

    if ($obj instanceof File) {
        return $obj;
    }

    throw new RuntimeException('UPLOAD_FAILED');
}

function sb_disk_get_children(Folder $folder, Storage $storage): array
{
    try {
        $ctx = $storage->getSecurityContext($GLOBALS['USER']);
        return $folder->getChildren($ctx);
    } catch (\Throwable $e) {
    }

    return $folder->getChildren();
}

function sb_disk_common_storage(): Storage
{
    if (!Loader::includeModule('disk')) {
        throw new RuntimeException('DISK_NOT_INSTALLED');
    }

    if (method_exists(\Bitrix\Disk\Storage::class, 'loadByEntity')) {
        $storage = \Bitrix\Disk\Storage::loadByEntity('common', 0);
        if ($storage) {
            return $storage;
        }
    }

    $driver = \Bitrix\Disk\Driver::getInstance();
    if (method_exists($driver, 'getStorageByCommonId')) {
        $storage = $driver->getStorageByCommonId('shared_files_' . SITE_ID);
        if ($storage) {
            return $storage;
        }
    }

    throw new RuntimeException('COMMON_STORAGE_NOT_FOUND');
}

function sb_disk_get_or_create_root(Storage $storage, string $name): Folder
{
    $root = $storage->getRootObject();

    $child = $root->getChild([
        '=NAME' => $name,
        '=TYPE' => \Bitrix\Disk\Internals\ObjectTable::TYPE_FOLDER,
    ]);

    if ($child instanceof Folder) {
        return $child;
    }

    return sb_disk_add_subfolder($root, [
        'NAME' => $name,
        'CREATED_BY' => (int)$GLOBALS['USER']->GetID(),
    ], $storage);
}

function sb_disk_ensure_site_folder(int $siteId): Folder
{
    $sites = sb_read_sites();
    $site = null;
    $siteIndex = null;

    foreach ($sites as $i => $s) {
        if ((int)($s['id'] ?? 0) === $siteId) {
            $site = $s;
            $siteIndex = $i;
            break;
        }
    }

    if (!$site) {
        throw new RuntimeException('SITE_NOT_FOUND');
    }

    $storage = sb_disk_common_storage();

    $diskFolderId = (int)($site['diskFolderId'] ?? 0);
    if ($diskFolderId > 0) {
        $folder = Folder::loadById($diskFolderId);
        if ($folder) {
            return $folder;
        }
    }

    $root = sb_disk_get_or_create_root($storage, 'SiteBuilder');

    $slug = (string)($site['slug'] ?? ('site-' . $siteId));
    $slug = $slug !== '' ? $slug : ('site-' . $siteId);

    $existing = $root->getChild([
        '=NAME' => $slug,
        '=TYPE' => \Bitrix\Disk\Internals\ObjectTable::TYPE_FOLDER,
    ]);

    if ($existing instanceof Folder) {
        $folder = $existing;
    } else {
        $folder = sb_disk_add_subfolder($root, [
            'NAME' => $slug,
            'CREATED_BY' => (int)$GLOBALS['USER']->GetID(),
        ], $storage);
    }

    $sites[$siteIndex]['diskFolderId'] = (int)$folder->getId();
    sb_write_sites($sites);

    return $folder;
}

function sb_disk_sync_folder_rights(int $siteId, Folder $folder): void
{
    $rm = Driver::getInstance()->getRightsManager();

    if (!method_exists($rm, 'setRights')) {
        return;
    }

    $taskRead = (method_exists($rm, 'getTaskIdByName') && defined(get_class($rm) . '::TASK_READ'))
        ? $rm->getTaskIdByName($rm::TASK_READ) : null;
    $taskEdit = (method_exists($rm, 'getTaskIdByName') && defined(get_class($rm) . '::TASK_EDIT'))
        ? $rm->getTaskIdByName($rm::TASK_EDIT) : null;
    $taskFull = (method_exists($rm, 'getTaskIdByName') && defined(get_class($rm) . '::TASK_FULL'))
        ? $rm->getTaskIdByName($rm::TASK_FULL) : null;

    if (!$taskRead || !$taskEdit || !$taskFull) {
        return;
    }

    $acc = sb_read_access();
    $acc = array_values(array_filter($acc, fn($r) => (int)($r['siteId'] ?? 0) === $siteId));

    $rights = [];
    foreach ($acc as $r) {
        $code = (string)($r['accessCode'] ?? '');
        if ($code === '') {
            continue;
        }

        $role = strtoupper((string)($r['role'] ?? 'VIEWER'));
        $taskId = $taskRead;

        if ($role === 'EDITOR') {
            $taskId = $taskEdit;
        }
        if ($role === 'ADMIN' || $role === 'OWNER') {
            $taskId = $taskFull;
        }

        $rights[] = [
            'ACCESS_CODE' => $code,
            'TASK_ID' => $taskId,
        ];
    }

    $rm->setRights($folder, $rights);
}

function sb_disk_file_belongs_to_site(int $siteId, int $fileId): bool
{
    if ($fileId <= 0) {
        return false;
    }

    $folder = sb_disk_ensure_site_folder($siteId);
    $file = \Bitrix\Disk\File::loadById($fileId);

    if (!$file) {
        return false;
    }

    return ((int)$file->getParentId() === (int)$folder->getId());
}