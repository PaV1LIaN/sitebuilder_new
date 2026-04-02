window.SBEditor = window.SBEditor || {};

BX.ready(function () {
  const siteId = parseInt(window.SB_EDITOR_SITE_ID || 0, 10);
  const pageId = parseInt(window.SB_EDITOR_PAGE_ID || 0, 10);

  const blocksBox = document.getElementById('blocksBox');
  const blockSearch = document.getElementById('blockSearch');

  const stPatch = {
    siteId,
    pageId,
    blocksBox,
    blockSearch,
    collapsedBlocks: new Set(),

    btnAddSection: document.getElementById('btnAddSection'),
    btnAddText: document.getElementById('btnAddText'),
    btnAddImage: document.getElementById('btnAddImage'),
    btnAddButton: document.getElementById('btnAddButton'),
    btnAddHeading: document.getElementById('btnAddHeading'),
    btnAddCols2: document.getElementById('btnAddCols2'),
    btnAddGallery: document.getElementById('btnAddGallery'),
    btnAddSpacer: document.getElementById('btnAddSpacer'),
    btnAddCard: document.getElementById('btnAddCard'),
    btnAddCards: document.getElementById('btnAddCards'),

    btnSaveTemplate: document.getElementById('btnSaveTemplate'),
    btnApplyTemplate: document.getElementById('btnApplyTemplate'),
    btnSections: document.getElementById('btnSections')
  };

  window.SBEditor.setState(stPatch);

  window.SBEditor.syncLegacyBridge();

  window.SBEditor.loadBlocks = async function () {
    const st = window.SBEditor.getState();

    if (!st.pageId || !st.blocksBox) return;

    try {
      const res = await window.SBEditor.api('block.list', { pageId: st.pageId });

      if (!res || res.ok !== true) {
        window.SBEditor.notify('Не удалось загрузить блоки');
        return;
      }

      st.allPageBlocks = Array.isArray(res.blocks) ? res.blocks.slice() : [];

      window.SBEditor.syncLegacyBridge();
      window.SBEditor.renderBlocks(st.allPageBlocks);
      window.SBEditor.initBlockDnD();
    } catch (e) {
      console.error(e);
      window.SBEditor.notify('Ошибка загрузки блоков');
    }
  };

  if (blockSearch) {
    blockSearch.addEventListener('input', () => {
      const st = window.SBEditor.getState();
      window.SBEditor.renderBlocks(st.allPageBlocks || []);
      window.SBEditor.initBlockDnD();
    });
  }

  if (stPatch.btnAddSection) {
    stPatch.btnAddSection.addEventListener('click', () => {
      window.SBEditor.addSectionBlock();
    });
  }

  document.addEventListener('click', async function (e) {
    const st = window.SBEditor.getState();

    const toggleBtn = e.target.closest('[data-toggle-block-id]');
    if (toggleBtn) {
      const id = parseInt(toggleBtn.getAttribute('data-toggle-block-id'), 10);
      if (st.collapsedBlocks.has(id)) {
        st.collapsedBlocks.delete(id);
      } else {
        st.collapsedBlocks.add(id);
      }
      window.SBEditor.renderBlocks(st.allPageBlocks || []);
      window.SBEditor.initBlockDnD();
      return;
    }

    const addHeadingAfterSectionBtn = e.target.closest('[data-add-heading-after-section-id]');
    if (addHeadingAfterSectionBtn) {
      window.SBEditor.quickAddHeadingAfterSection(
        parseInt(addHeadingAfterSectionBtn.getAttribute('data-add-heading-after-section-id'), 10)
      );
      return;
    }

    const addTextAfterSectionBtn = e.target.closest('[data-add-text-after-section-id]');
    if (addTextAfterSectionBtn) {
      window.SBEditor.quickAddTextAfterSection(
        parseInt(addTextAfterSectionBtn.getAttribute('data-add-text-after-section-id'), 10)
      );
      return;
    }

    const addButtonAfterSectionBtn = e.target.closest('[data-add-button-after-section-id]');
    if (addButtonAfterSectionBtn) {
      window.SBEditor.quickAddButtonAfterSection(
        parseInt(addButtonAfterSectionBtn.getAttribute('data-add-button-after-section-id'), 10)
      );
      return;
    }

    const addCardsAfterSectionBtn = e.target.closest('[data-add-cards-after-section-id]');
    if (addCardsAfterSectionBtn) {
      window.SBEditor.quickAddCardsAfterSection(
        parseInt(addCardsAfterSectionBtn.getAttribute('data-add-cards-after-section-id'), 10)
      );
      return;
    }

    const editSectionBtn = e.target.closest('[data-edit-section-id]');
    if (editSectionBtn) {
      window.SBEditor.editSectionBlock(
        parseInt(editSectionBtn.getAttribute('data-edit-section-id'), 10)
      );
      return;
    }

    // Остальные кнопки пока остаются на старом inline-коде editor.php
    // или будут перенесены позже в editor.dialogs.js
  });

  window.SBEditor.loadBlocks();
});

Что ещё нужно добавить в editor.php

Чтобы этот файл заработал, в editor.php надо отдать siteId/pageId в глобальные переменные и подключить js-файлы.

1. Перед закрывающим </body> добавь:

<script>
  window.SB_EDITOR_SITE_ID = <?= (int)$siteId ?>;
  window.SB_EDITOR_PAGE_ID = <?= (int)$pageId ?>;
</script>

<script src="/local/sitebuilder/assets/js/editor.core.js?v=1"></script>
<script src="/local/sitebuilder/assets/js/editor.api.js?v=1"></script>
<script src="/local/sitebuilder/assets/js/editor.sections.js?v=1"></script>
<script src="/local/sitebuilder/assets/js/editor.dnd.js?v=1"></script>
<script src="/local/sitebuilder/assets/js/editor.blocks.js?v=1"></script>
<script src="/local/sitebuilder/assets/js/editor.init.js?v=1"></script>