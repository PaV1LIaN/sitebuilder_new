window.SBEditor = window.SBEditor || {};

window.SBEditor.saveTemplateFromPage = async function () {
  const st = window.SBEditor.getState();
  const api = window.SBEditor.api;
  const notify = window.SBEditor.notify;

  const name = prompt('Название шаблона:');
  if (!name) return;

  try {
    const res = await api('template.createFromPage', {
      siteId: st.siteId,
      pageId: st.pageId,
      name: name.trim()
    });

    if (!res || res.ok !== true) {
      notify('Не удалось сохранить шаблон');
      return;
    }

    notify('Шаблон сохранён');
  } catch (e) {
    console.error(e);
    notify('Ошибка template.createFromPage');
  }
};

window.SBEditor.applyTemplateToPage = async function () {
  const st = window.SBEditor.getState();
  const api = window.SBEditor.api;
  const notify = window.SBEditor.notify;

  try {
    const listRes = await api('template.list', {});
    if (!listRes || listRes.ok !== true) {
      notify('Не удалось загрузить шаблоны');
      return;
    }

    const templates = Array.isArray(listRes.templates) ? listRes.templates : [];
    if (!templates.length) {
      notify('Шаблонов пока нет');
      return;
    }

    const options = templates.map(t => {
      return `<option value="${parseInt(t.id, 10)}">${BX.util.htmlspecialchars(String(t.name || ('Template #' + t.id)))}</option>`;
    }).join('');

    BX.UI.Dialogs.MessageBox.show({
      title: 'Применить шаблон',
      message: `
        <div>
          <div class="field">
            <label>Шаблон</label>
            <select id="tpl_apply_id" class="input">${options}</select>
          </div>
          <div class="field">
            <label>Режим</label>
            <select id="tpl_apply_mode" class="input">
              <option value="append">Добавить к текущим блокам</option>
              <option value="replace">Заменить все текущие блоки</option>
            </select>
          </div>
        </div>
      `,
      buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
      onOk: async function (mbox) {
        const templateId = parseInt(document.getElementById('tpl_apply_id')?.value || '0', 10);
        const mode = String(document.getElementById('tpl_apply_mode')?.value || 'append');

        if (!templateId) {
          notify('Шаблон не выбран');
          return;
        }

        try {
          const res = await api('template.applyToPage', {
            siteId: st.siteId,
            pageId: st.pageId,
            templateId,
            mode
          });

          if (!res || res.ok !== true) {
            notify('Не удалось применить шаблон');
            return;
          }

          notify('Шаблон применён');
          mbox.close();

          if (typeof window.SBEditor.loadBlocks === 'function') {
            window.SBEditor.loadBlocks();
          }
        } catch (e) {
          console.error(e);
          notify('Ошибка template.applyToPage');
        }
      }
    });
  } catch (e) {
    console.error(e);
    notify('Ошибка template.list');
  }
};

window.SBEditor.openSectionsLibrary = function () {
  const st = window.SBEditor.getState();
  const notify = window.SBEditor.notify;

  const presets = [
    {
      key: 'hero',
      title: 'Hero',
      text: 'Секция с крупным заголовком, текстом и кнопкой',
      create: async function () {
        await window.SBEditor.addSectionBlockWithPreset('hero');

        const listRes = await window.SBEditor.api('block.list', { pageId: st.pageId });
        const blocks = Array.isArray(listRes?.blocks) ? listRes.blocks.slice() : [];
        const sections = blocks.filter(b => String(b.type || '') === 'section').sort((a, b) => parseInt(b.id, 10) - parseInt(a.id, 10));
        const section = sections[0];
        if (!section) return;

        await window.SBEditor.quickAddHeadingAfterSection(section.id);
        await window.SBEditor.quickAddTextAfterSection(section.id);
        await window.SBEditor.quickAddButtonAfterSection(section.id);
      }
    },
    {
      key: 'cards',
      title: 'Cards section',
      text: 'Секция с карточками преимуществ',
      create: async function () {
        await window.SBEditor.addSectionBlockWithPreset('light');

        const listRes = await window.SBEditor.api('block.list', { pageId: st.pageId });
        const blocks = Array.isArray(listRes?.blocks) ? listRes.blocks.slice() : [];
        const sections = blocks.filter(b => String(b.type || '') === 'section').sort((a, b) => parseInt(b.id, 10) - parseInt(a.id, 10));
        const section = sections[0];
        if (!section) return;

        await window.SBEditor.quickAddHeadingAfterSection(section.id);
        await window.SBEditor.quickAddCardsAfterSection(section.id);
      }
    },
    {
      key: 'cta',
      title: 'CTA',
      text: 'Небольшая акцентная секция с кнопкой',
      create: async function () {
        await window.SBEditor.addSectionBlockWithPreset('accent');

        const listRes = await window.SBEditor.api('block.list', { pageId: st.pageId });
        const blocks = Array.isArray(listRes?.blocks) ? listRes.blocks.slice() : [];
        const sections = blocks.filter(b => String(b.type || '') === 'section').sort((a, b) => parseInt(b.id, 10) - parseInt(a.id, 10));
        const section = sections[0];
        if (!section) return;

        await window.SBEditor.quickAddHeadingAfterSection(section.id);
        await window.SBEditor.quickAddButtonAfterSection(section.id);
      }
    }
  ];

  BX.UI.Dialogs.MessageBox.show({
    title: 'Библиотека секций',
    message: `
      <div style="display:grid;gap:12px;">
        ${presets.map(p => `
          <div class="subCard" style="padding:12px;">
            <div style="font-weight:700;font-size:15px;">${BX.util.htmlspecialchars(p.title)}</div>
            <div class="muted" style="margin-top:6px;">${BX.util.htmlspecialchars(p.text)}</div>
            <div style="margin-top:10px;">
              <button class="ui-btn ui-btn-primary ui-btn-xs" data-sections-lib-key="${BX.util.htmlspecialchars(p.key)}">Создать</button>
            </div>
          </div>
        `).join('')}
      </div>
    `,
    buttons: BX.UI.Dialogs.MessageBoxButtons.CANCEL,
    onCancel: function () {}
  });

  setTimeout(() => {
    document.querySelectorAll('[data-sections-lib-key]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const key = btn.getAttribute('data-sections-lib-key');
        const preset = presets.find(x => x.key === key);
        if (!preset) return;

        try {
          await preset.create();
          notify('Секция создана');

          if (typeof window.SBEditor.loadBlocks === 'function') {
            window.SBEditor.loadBlocks();
          }
        } catch (e) {
          console.error(e);
          notify('Ошибка создания секции');
        }
      });
    });
  }, 0);
};

window.SBEditor.openCardsBuilderDialog = function (opts = {}) {
  const title = String(opts.title || 'Карточки');
  const initialItems = Array.isArray(opts.items) ? opts.items.slice() : [];
  const initialColumns = parseInt(opts.columns || 3, 10);
  const onSubmit = typeof opts.onSubmit === 'function' ? opts.onSubmit : null;

  const rowsHtml = (initialItems.length ? initialItems : [
    { title: '', text: '', imageFileId: 0, buttonText: '', buttonUrl: '' }
  ]).map((item, idx) => {
    const clean = window.SBEditor.cardsNormalizeItem(item);

    return `
      <div class="cardsBuilderRow" data-cards-row="${idx}" style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin-top:10px;">
        <div class="field">
          <label>Заголовок</label>
          <input class="input" data-role="title" value="${BX.util.htmlspecialchars(clean.title)}">
        </div>

        <div class="field">
          <label>Текст</label>
          <textarea class="input" rows="4" data-role="text">${BX.util.htmlspecialchars(clean.text)}</textarea>
        </div>

        <div class="field">
          <label>Image fileId</label>
          <input class="input" data-role="imageFileId" type="number" min="0" value="${clean.imageFileId}">
        </div>

        <div class="field">
          <label>Текст кнопки</label>
          <input class="input" data-role="buttonText" value="${BX.util.htmlspecialchars(clean.buttonText)}">
        </div>

        <div class="field">
          <label>URL кнопки</label>
          <input class="input" data-role="buttonUrl" value="${BX.util.htmlspecialchars(clean.buttonUrl)}">
        </div>

        <div style="margin-top:8px;">
          <button type="button" class="ui-btn ui-btn-light ui-btn-xs" data-remove-cards-row="${idx}">Удалить карточку</button>
        </div>
      </div>
    `;
  }).join('');

  BX.UI.Dialogs.MessageBox.show({
    title,
    message: `
      <div>
        <div class="field">
          <label>Колонки</label>
          <select id="cards_builder_columns" class="input">
            <option value="2" ${initialColumns === 2 ? 'selected' : ''}>2</option>
            <option value="3" ${initialColumns === 3 ? 'selected' : ''}>3</option>
            <option value="4" ${initialColumns === 4 ? 'selected' : ''}>4</option>
          </select>
        </div>

        <div id="cardsBuilderRows">${rowsHtml}</div>

        <div style="margin-top:12px;">
          <button type="button" class="ui-btn ui-btn-light" id="cards_builder_add_row">+ Добавить карточку</button>
        </div>
      </div>
    `,
    buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
    onOk: function (mbox) {
      const columns = parseInt(document.getElementById('cards_builder_columns')?.value || '3', 10);
      const rows = Array.from(document.querySelectorAll('#cardsBuilderRows [data-cards-row]'));
      const items = rows.map(row => ({
        title: String(row.querySelector('[data-role="title"]')?.value || '').trim(),
        text: String(row.querySelector('[data-role="text"]')?.value || ''),
        imageFileId: parseInt(row.querySelector('[data-role="imageFileId"]')?.value || '0', 10) || 0,
        buttonText: String(row.querySelector('[data-role="buttonText"]')?.value || '').trim(),
        buttonUrl: String(row.querySelector('[data-role="buttonUrl"]')?.value || '').trim()
      })).filter(item => item.title !== '');
<div class="cell"><pre>${BX.util.htmlspecialchars(left)}</pre></div>
              <div class="cell"><pre>${BX.util.htmlspecialchars(right)}</pre></div>
            </div>
          `,
          `
            ${commonBtns}
            <button class="ui-btn ui-btn-light ui-btn-xs" data-edit-columns2-id="${id}">Редактировать</button>
            <button class="ui-btn ui-btn-danger ui-btn-xs" data-del-block-id="${id}">Удалить</button>
          `,
          `<span>ratio: ${BX.util.htmlspecialchars(ratio)}</span>`,
          '',
          wrap.extraClass,
          wrap.sectionMarkHtml
        );
      }

      if (type === 'gallery') {
        const columns = b.content && b.content.columns ? parseInt(b.content.columns, 10) : 3;
        const images = Array.isArray(b.content && b.content.images) ? b.content.images : [];
        const tpl = galleryTemplate(columns);

        const items = images.map(it => {
          const fid = parseInt(it.fileId || 0, 10);
          const alt = typeof it.alt === 'string' ? it.alt : '';
          return fid
            ? `<div class="imgPrev"><img src="${fileDownloadUrl(fid)}" alt="${BX.util.htmlspecialchars(alt)}"></div>`
            : '';
        }).join('');

        const wrap = wrapBlockMeta();
        return buildBlockShell(
          id, type, sort,
          `
            <div class="galleryPreview" style="grid-template-columns:${tpl};">
              ${items || '<div class="muted">Нет изображений</div>'}
            </div>
          `,
          `
            ${commonBtns}
            <button class="ui-btn ui-btn-light ui-btn-xs" data-edit-gallery-id="${id}">Редактировать</button>
            <button class="ui-btn ui-btn-danger ui-btn-xs" data-del-block-id="${id}">Удалить</button>
          `,
          `<span>columns: ${columns}</span><span>items: ${images.length}</span>`,
          '',
          wrap.extraClass,
          wrap.sectionMarkHtml
        );
      }

      if (type === 'spacer') {
        const height = b.content && b.content.height ? parseInt(b.content.height, 10) : 40;
        const line = !!(b.content && b.content.line);

        const wrap = wrapBlockMeta();
        return buildBlockShell(
          id, type, sort,
          `
            <div class="spacerPreview" style="height:${height}px;">
              ${line ? '<div class="spacerLine"></div>' : ''}
            </div>
          `,
          `
            ${commonBtns}
            <button class="ui-btn ui-btn-light ui-btn-xs" data-edit-spacer-id="${id}">Редактировать</button>
            <button class="ui-btn ui-btn-danger ui-btn-xs" data-del-block-id="${id}">Удалить</button>
          `,
          `<span>height: ${height}</span><span>line: ${line ? 'yes' : 'no'}</span>`,
          '',
          wrap.extraClass,
          wrap.sectionMarkHtml
        );
      }

      if (type === 'card') {
        const title = (b.content && typeof b.content.title === 'string') ? b.content.title : '';
        const text = (b.content && typeof b.content.text === 'string') ? b.content.text : '';
        const imageFileId = b.content && b.content.imageFileId ? parseInt(b.content.imageFileId, 10) : 0;
        const buttonText = (b.content && typeof b.content.buttonText === 'string') ? b.content.buttonText : '';
        const buttonUrl = (b.content && typeof b.content.buttonUrl === 'string') ? b.content.buttonUrl : '';

        const imageHtml = imageFileId
          ? `<div class="imgPrev"><img src="${fileDownloadUrl(imageFileId)}" alt=""></div>`
          : '';

        const wrap = wrapBlockMeta();
        return buildBlockShell(
          id, type, sort,
          `
            <div class="cardPreview">
              <div class="cardTitle">${BX.util.htmlspecialchars(title)}</div>
              ${text ? `<pre>${BX.util.htmlspecialchars(text)}</pre>` : ''}
              ${imageHtml}
              ${buttonUrl ? `<div class="muted">button: ${BX.util.htmlspecialchars(buttonText || 'Открыть')} → ${BX.util.htmlspecialchars(buttonUrl)}</div>` : ''}
            </div>
          `,
          `
            ${commonBtns}
            <button class="ui-btn ui-btn-light ui-btn-xs" data-edit-card-id="${id}">Редактировать</button>
            <button class="ui-btn ui-btn-danger ui-btn-xs" data-del-block-id="${id}">Удалить</button>
          `,
          `<span>image: ${imageFileId || '-'}</span>`,
          '',
          wrap.extraClass,
          wrap.sectionMarkHtml
        );
      }

      if (type === 'cards') {
        const columns = b.content && b.content.columns ? parseInt(b.content.columns, 10) : 3;
        const items = Array.isArray(b.content && b.content.items) ? b.content.items.map(cardsNormalizeItem) : [];
        const tpl = galleryTemplate(columns);

        const cardsHtml = items.map(it => {
          const imageHtml = it.imageFileId
            ? `<div class="imgPrev"><img src="${fileDownloadUrl(it.imageFileId)}" alt=""></div>`
            : '';

          return `
            <div class="cardPreview">
              <div class="cardTitle">${BX.util.htmlspecialchars(it.title)}</div>
              ${it.text ? `<pre>${BX.util.htmlspecialchars(it.text)}</pre>` : ''}
              ${imageHtml}
              ${it.buttonUrl ? `<div class="muted">button: ${BX.util.htmlspecialchars(it.buttonText || 'Открыть')} → ${BX.util.htmlspecialchars(it.buttonUrl)}</div>` : ''}
            </div>
          `;
        }).join('');

        const wrap = wrapBlockMeta();
        return buildBlockShell(
          id, type, sort,
          `
            <div class="galleryPreview" style="grid-template-columns:${tpl};">
              ${cardsHtml || '<div class="muted">Нет карточек</div>'}
            </div>
          `,
          `
            ${commonBtns}
            <button class="ui-btn ui-btn-light ui-btn-xs" data-edit-cards-id="${id}">Редактировать</button>
            <button class="ui-btn ui-btn-danger ui-btn-xs" data-del-block-id="${id}">Удалить</button>
          `,
          `<span>columns: ${columns}</span><span>items: ${items.length}</span>`,
          '',
          wrap.extraClass,
          wrap.sectionMarkHtml
        );
      }

      const wrap = wrapBlockMeta();
      return buildBlockShell(
        id, type, sort,
        `<div class="muted">Тип блока пока не поддержан в редакторе предпросмотра.</div>`,
        `
          ${commonBtns}
          <button class="ui-btn ui-btn-danger ui-btn-xs" data-del-block-id="${id}">Удалить</button>
        `,
        '',
        wrap.extraClass,
        wrap.sectionMarkHtml
      );
    }).join('');

    initBlockDnD();
  }

  function saveBlockOrder(orderedIdsFromDom = null) {
    let ids = Array.isArray(orderedIdsFromDom)
      ? orderedIdsFromDom.slice()
      : Array.from(blocksBox.querySelectorAll('[data-block-id]'))
          .map(el => parseInt(el.getAttribute('data-block-id'), 10))
          .filter(Boolean);

    const knownIds = new Set(ids);

    for (const b of allPageBlocks) {
      const bid = parseInt(b.id, 10);
      if (bid > 0 && !knownIds.has(bid)) {
        ids.push(bid);
        knownIds.add(bid);
      }
    }

    return api('block.reorder', {
      pageId,
      order: JSON.stringify(ids)
    });
  }

  function initBlockDnD() {
    if (!blocksBox) return;

    const searchValue = (blockSearch?.value || '').trim();
    if (searchValue !== '') return;

    let draggedEl = null;
    let dragAllowed = false;
    let startOrder = '';

    function currentOrderedIds() {
      return Array.from(blocksBox.querySelectorAll('[data-block-id]'))
        .map(el => parseInt(el.getAttribute('data-block-id') || '0', 10))
        .filter(Boolean);
    }

    function currentOrderString() {
      return currentOrderedIds().join(',');
    }

    blocksBox.querySelectorAll('[data-block-id]').forEach(block => {
      block.setAttribute('draggable', 'false');

      const handle = block.querySelector('[data-drag-handle]');
      if (handle) {
        handle.addEventListener('mousedown', () => {
          dragAllowed = true;
          block.setAttribute('draggable', 'true');
        });

        handle.addEventListener('mouseup', () => {
          setTimeout(() => {
            block.setAttribute('draggable', 'false');
            dragAllowed = false;
          }, 0);
        });
      }

      block.addEventListener('dragstart', (e) => {
        if (!dragAllowed) {
          e.preventDefault();
          return;
        }

        draggedEl = block;
        startOrder = currentOrderString();
        block.classList.add('dragging');

        try {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', block.getAttribute('data-block-id') || '');
        } catch (err) {}
      });

      block.addEventListener('dragover', (e) => {
        if (!draggedEl || draggedEl === block) return;
        e.preventDefault();

        const rect = block.getBoundingClientRect();
        const middle = rect.top + rect.height / 2;
        const after = e.clientY > middle;

        if (after) {
          if (block.nextElementSibling !== draggedEl) {
            block.parentNode.insertBefore(draggedEl, block.nextElementSibling);
          }
        } else {
          if (block.previousElementSibling !== draggedEl) {
<button class="ui-btn ui-btn-danger ui-btn-xs" data-tpl-delete="${t.id}">Удалить</button>
            </div>
          </div>
        `;
      }).join('') || '<div class="muted">Ничего не найдено</div>';

      return `
        <div class="secSearchWrap">
          <input class="input" id="secSearchInput" placeholder="Поиск шаблона по названию..." value="${BX.util.htmlspecialchars(query)}">
        </div>
        <div class="secGrid">${cards}</div>
      `;
    };

    const mb = BX.UI.Dialogs.MessageBox.show({
      title: 'Библиотека секций / шаблонов',
      message: `<div id="${containerId}">${render('')}</div>`,
      buttons: BX.UI.Dialogs.MessageBoxButtons.CANCEL,
      popupOptions: { width: 980, closeIcon: true, overlay: true }
    });

    function bindHandlers(root) {
      const search = root.querySelector('#secSearchInput');
      if (search) {
        search.oninput = () => {
          root.innerHTML = render(search.value || '');
          bindHandlers(root);
        };
      }

      root.querySelectorAll('[data-tpl-apply]').forEach(btn => {
        btn.onclick = async () => {
          const templateId = parseInt(btn.getAttribute('data-tpl-apply'), 10);
          const mode = btn.getAttribute('data-mode') || 'append';
          try {
            const r = await api('template.applyToPage', {
              siteId,
              pageId,
              templateId,
              mode
            });
            if (!r || r.ok !== true) { notify('Не удалось применить шаблон'); return; }
            notify(mode === 'replace' ? 'Страница заменена шаблоном' : 'Шаблон вставлен');
            mb.close();
            loadBlocks();
          } catch (e) {
            notify('Ошибка template.applyToPage');
          }
        };
      });

      root.querySelectorAll('[data-tpl-rename]').forEach(btn => {
        btn.onclick = async () => {
          const id = parseInt(btn.getAttribute('data-tpl-rename'), 10);
          const cur = templates.find(x => parseInt(x.id, 10) === id);
          const name = prompt('Новое имя шаблона:', cur?.name || '');
          if (!name) return;

          try {
            const r = await api('template.rename', { id, name });
            if (!r || r.ok !== true) { notify('Не удалось переименовать шаблон'); return; }
            notify('Шаблон переименован');

            const fresh = await api('template.list', {});
            templates = (fresh && fresh.ok === true && Array.isArray(fresh.templates)) ? fresh.templates : templates;
            const rootEl = document.getElementById(containerId);
            if (rootEl) {
              const q = rootEl.querySelector('#secSearchInput')?.value || '';
              rootEl.innerHTML = render(q);
              bindHandlers(rootEl);
            }
          } catch (e) {
            notify('Ошибка template.rename');
          }
        };
      });

      root.querySelectorAll('[data-tpl-delete]').forEach(btn => {
        btn.onclick = async () => {
          const id = parseInt(btn.getAttribute('data-tpl-delete'), 10);
          if (!confirm('Удалить шаблон #' + id + '?')) return;

          try {
            const r = await api('template.delete', { id });
            if (!r || r.ok !== true) { notify('Не удалось удалить шаблон'); return; }
            notify('Шаблон удалён');

            const fresh = await api('template.list', {});
            templates = (fresh && fresh.ok === true && Array.isArray(fresh.templates)) ? fresh.templates : templates;
            const rootEl = document.getElementById(containerId);
            if (rootEl) {
              const q = rootEl.querySelector('#secSearchInput')?.value || '';
              rootEl.innerHTML = render(q);
              bindHandlers(rootEl);
            }
          } catch (e) {
            notify('Ошибка template.delete');
          }
        };
      });
    }

    setTimeout(() => {
      const root = document.getElementById(containerId);
      if (root) bindHandlers(root);
    }, 0);
  }

  function addTextBlock() {
    BX.UI.Dialogs.MessageBox.show({
      title: 'Новый Text',
      message: `
        <div class="field">
          <label>Текст</label>
          <textarea id="new_text_value" class="input" rows="10" placeholder="Введите текст блока"></textarea>
        </div>
      `,
      buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
      onOk: function (mb) {
        const text = document.getElementById('new_text_value')?.value || '';
        api('block.create', { pageId, type: 'text', text })
          .then(r => {
            if (!r || r.ok !== true) { notify('Не удалось создать text'); return; }
            notify('Text блок создан');
            mb.close();
            loadBlocks();
          })
          .catch(() => notify('Ошибка block.create'));
      }
    });
  }

  async function addImageBlock() {
    let files = [];
    try { files = await getFilesForSite(); }
    catch (e) { notify('Не удалось загрузить файлы сайта'); return; }

    const opts = ['<option value="0">— выбрать файл —</option>']
      .concat(files.map(f => `<option value="${f.id}">${BX.util.htmlspecialchars(f.name)} (#${f.id})</option>`))
      .join('');

    BX.UI.Dialogs.MessageBox.show({
      title: 'Новый Image',
      message: `
        <div class="field">
          <label>Файл</label>
          <select id="new_image_file" class="input">${opts}</select>
        </div>
        <div class="field">
          <label>Alt</label>
          <input id="new_image_alt" class="input" placeholder="Описание изображения" />
        </div>
        <div id="new_image_preview_wrap" style="margin-top:10px;"></div>
      `,
      buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
      onOk: function (mb) {
        const fileId = parseInt(document.getElementById('new_image_file')?.value || '0', 10);
        const alt = document.getElementById('new_image_alt')?.value || '';

        if (!fileId) { notify('Выбери файл'); return; }

        api('block.create', { pageId, type: 'image', fileId, alt })
          .then(r => {
            if (!r || r.ok !== true) { notify('Не удалось создать image'); return; }
            notify('Image блок создан');
            mb.close();
            loadBlocks();
          })
          .catch(() => notify('Ошибка block.create'));
      }
    });

    setTimeout(() => {
      const sel = document.getElementById('new_image_file');
      const wrap = document.getElementById('new_image_preview_wrap');
      if (!sel || !wrap) return;

      const renderPrev = () => {
        const fid = parseInt(sel.value || '0', 10);
        wrap.innerHTML = fid
          ? `<div class="imgPrev"><img src="${fileDownloadUrl(fid)}" alt=""></div>`
          : '';
      };

      sel.addEventListener('change', renderPrev);
      renderPrev();
    }, 0);
  }

  function addButtonBlock() {
    BX.UI.Dialogs.MessageBox.show({
      title: 'Новый Button',
      message: `
        <div class="field">
          <label>Текст кнопки</label>
          <input id="new_btn_text" class="input" value="Кнопка" />
        </div>
        <div class="field">
          <label>URL</label>
          <input id="new_btn_url" class="input" value="/" />
        </div>
        <div class="field">
          <label>Вариант</label>
          <select id="new_btn_variant" class="input">
            <option value="primary">primary</option>
            <option value="secondary">secondary</option>
          </select>
        </div>
      `,
      buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
      onOk: function (mb) {
        const text = document.getElementById('new_btn_text')?.value || '';
        const url = document.getElementById('new_btn_url')?.value || '';
        const variant = document.getElementById('new_btn_variant')?.value || 'primary';

        api('block.create', { pageId, type: 'button', text, url, variant })
          .then(r => {
            if (!r || r.ok !== true) { notify('Не удалось создать button'); return; }
            notify('Button блок создан');
            mb.close();
            loadBlocks();
          })
          .catch(() => notify('Ошибка block.create'));
      }
    });
  }

  function addHeadingBlock() {
    BX.UI.Dialogs.MessageBox.show({
      title: 'Новый Heading',
      message: `
        <div class="field">
          <label>Текст</label>
          <input id="new_heading_text" class="input" value="Новый заголовок" />
        </div>
        <div class="field">
          <label>Уровень</label>
          <select id="new_heading_level" class="input">
            <option value="h1">h1</option>
            <option value="h2" selected>h2</option>
            <option value="h3">h3</option>
          </select>
        </div>
        <div class="field">
          <label>Выравнивание</label>
          <select id="new_heading_align" class="input">
            <option value="left" selected>left</option>
            <option value="center">center</option>
            <option value="right">right</option>
          </select>
        </div>
      `,
      buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
      onOk: function (mb) {
        const text = document.getElementById('new_heading_text')?.value || '';
        const level = document.getElementById('new_heading_level')?.value || 'h2';
        const align = document.getElementById('new_heading_align')?.value || 'left';
const align = document.getElementById('new_heading_align')?.value || 'left';

        api('block.create', { pageId, type: 'heading', text, level, align })
          .then(r => {
            if (!r || r.ok !== true) { notify('Не удалось создать heading'); return; }
            notify('Heading блок создан');
            mb.close();
            loadBlocks();
          })
          .catch(() => notify('Ошибка block.create'));
      }
    });
  }

  function addCols2Block() {
    BX.UI.Dialogs.MessageBox.show({
      title: 'Новый Columns2',
      message: `
        <div class="field">
          <label>Левая колонка</label>
          <textarea id="new_cols2_left" class="input" rows="6"></textarea>
        </div>
        <div class="field">
          <label>Правая колонка</label>
          <textarea id="new_cols2_right" class="input" rows="6"></textarea>
        </div>
        <div class="field">
          <label>Соотношение</label>
          <select id="new_cols2_ratio" class="input">
            <option value="50-50" selected>50-50</option>
            <option value="33-67">33-67</option>
            <option value="67-33">67-33</option>
          </select>
        </div>
      `,
      buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
      onOk: function (mb) {
        const left = document.getElementById('new_cols2_left')?.value || '';
        const right = document.getElementById('new_cols2_right')?.value || '';
        const ratio = document.getElementById('new_cols2_ratio')?.value || '50-50';

        api('block.create', { pageId, type: 'columns2', left, right, ratio })
          .then(r => {
            if (!r || r.ok !== true) { notify('Не удалось создать columns2'); return; }
            notify('Columns2 блок создан');
            mb.close();
            loadBlocks();
          })
          .catch(() => notify('Ошибка block.create'));
      }
    });
  }

  async function addGalleryBlock() {
    let files = [];
    try { files = await getFilesForSite(); }
    catch (e) { notify('Не удалось загрузить файлы сайта'); return; }

    const options = files.map(f =>
      `<option value="${f.id}">${BX.util.htmlspecialchars(f.name)} (#${f.id})</option>`
    ).join('');

    BX.UI.Dialogs.MessageBox.show({
      title: 'Новая Gallery',
      message: `
        <div class="field">
          <label>Колонки</label>
          <select id="new_gallery_cols" class="input">
            <option value="2">2</option>
            <option value="3" selected>3</option>
            <option value="4">4</option>
          </select>
        </div>

        <div id="new_gallery_rows">
          <div class="field">
            <label>Изображение 1</label>
            <select class="input galleryFileSelect">${options}</select>
            <input class="input galleryAltInput" placeholder="Alt" style="margin-top:8px;" />
          </div>
        </div>

        <div style="margin-top:12px;">
          <button type="button" class="ui-btn ui-btn-light" id="gallery_add_row">+ Добавить изображение</button>
        </div>
      `,
      buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
      onOk: function (mb) {
        const columns = parseInt(document.getElementById('new_gallery_cols')?.value || '3', 10);
        const rows = Array.from(document.querySelectorAll('#new_gallery_rows .field'));

        const images = rows.map(row => ({
          fileId: parseInt(row.querySelector('.galleryFileSelect')?.value || '0', 10),
          alt: row.querySelector('.galleryAltInput')?.value || ''
        })).filter(x => x.fileId > 0);

        if (!images.length) { notify('Нужно выбрать хотя бы одно изображение'); return; }

        api('block.create', {
          pageId,
          type: 'gallery',
          columns,
          images: JSON.stringify(images)
        })
          .then(r => {
            if (!r || r.ok !== true) { notify('Не удалось создать gallery'); return; }
            notify('Gallery блок создан');
            mb.close();
            loadBlocks();
          })
          .catch(() => notify('Ошибка block.create'));
      }
    });

    setTimeout(() => {
      const wrap = document.getElementById('new_gallery_rows');
      const addBtn = document.getElementById('gallery_add_row');
      if (!wrap || !addBtn) return;

      addBtn.onclick = () => {
        const div = document.createElement('div');
        div.className = 'field';
        div.innerHTML = `
          <label>Изображение</label>
          <select class="input galleryFileSelect">${options}</select>
          <input class="input galleryAltInput" placeholder="Alt" style="margin-top:8px;" />
        `;
        wrap.appendChild(div);
      };
    }, 0);
  }

  function addSpacerBlock() {
    BX.UI.Dialogs.MessageBox.show({
      title: 'Новый Spacer',
      message: `
        <div class="field">
          <label>Высота</label>
          <input id="new_spacer_height" class="input" type="number" min="10" max="200" value="40" />
        </div>
        <div class="field">
          <label><input id="new_spacer_line" type="checkbox"> Показать линию</label>
        </div>
      `,
      buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
      onOk: function (mb) {
        const height = parseInt(document.getElementById('new_spacer_height')?.value || '40', 10);
        const line = document.getElementById('new_spacer_line')?.checked ? '1' : '0';

        api('block.create', { pageId, type: 'spacer', height, line })
          .then(r => {
            if (!r || r.ok !== true) { notify('Не удалось создать spacer'); return; }
            notify('Spacer блок создан');
            mb.close();
            loadBlocks();
          })
          .catch(() => notify('Ошибка block.create'));
      }
    });
  }

  async function addCardBlock() {
    let files = [];
    try { files = await getFilesForSite(); }
    catch (e) { notify('Не удалось загрузить файлы сайта'); return; }

    const opts = ['<option value="0">— без изображения —</option>']
      .concat(files.map(f => `<option value="${f.id}">${BX.util.htmlspecialchars(f.name)} (#${f.id})</option>`))
      .join('');

    BX.UI.Dialogs.MessageBox.show({
      title: 'Новый Card',
      message: `
        <div class="field">
          <label>Заголовок</label>
          <input id="new_card_title" class="input" />
        </div>
        <div class="field">
          <label>Текст</label>
          <textarea id="new_card_text" class="input" rows="6"></textarea>
        </div>
        <div class="field">
          <label>Изображение</label>
          <select id="new_card_image" class="input">${opts}</select>
        </div>
        <div class="field">
          <label>Текст кнопки</label>
          <input id="new_card_btn_text" class="input" />
        </div>
        <div class="field">
          <label>URL кнопки</label>
          <input id="new_card_btn_url" class="input" placeholder="/" />
        </div>
        <div id="new_card_preview" style="margin-top:10px;"></div>
      `,
      buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
      onOk: function (mb) {
        const title = document.getElementById('new_card_title')?.value || '';
        const text = document.getElementById('new_card_text')?.value || '';
        const imageFileId = parseInt(document.getElementById('new_card_image')?.value || '0', 10);
        const buttonText = document.getElementById('new_card_btn_text')?.value || '';
        const buttonUrl = document.getElementById('new_card_btn_url')?.value || '';

        api('block.create', {
          pageId,
          type: 'card',
          title,
          text,
          imageFileId,
          buttonText,
          buttonUrl
        })
          .then(r => {
            if (!r || r.ok !== true) { notify('Не удалось создать card'); return; }
            notify('Card блок создан');
            mb.close();
            loadBlocks();
          })
          .catch(() => notify('Ошибка block.create'));
      }
    });

    setTimeout(() => {
      const sel = document.getElementById('new_card_image');
      const wrap = document.getElementById('new_card_preview');
      if (!sel || !wrap) return;

      const renderPrev = () => {
        const fid = parseInt(sel.value || '0', 10);
        wrap.innerHTML = fid ? `<div class="imgPrev"><img src="${fileDownloadUrl(fid)}" alt=""></div>` : '';
      };

      sel.addEventListener('change', renderPrev);
      renderPrev();
    }, 0);
  }

  function addCardsBlock() {
    openCardsBuilderDialog({
      title: 'Новый Cards',
      columns: 3,
      items: [],
      onSubmit: async function ({ columns, items }) {
        const r = await api('block.create', {
          pageId,
          type: 'cards',
          columns,
          items: JSON.stringify(items)
        });
const items = (b.content && Array.isArray(b.content.items)) ? b.content.items : [];
        const tpl = galleryTemplate(columns);

        const cardsHtml = items.map(raw => {
          const it = cardsNormalizeItem(raw || {});
          const img = it.imageFileId ? `<div class="imgPrev"><img src="${fileDownloadUrl(it.imageFileId)}" alt=""></div>` : '';

          return `
            <div class="miniCard">
              <div style="font-weight:700;">${BX.util.htmlspecialchars(it.title)}</div>
              <div class="muted" style="margin-top:6px; white-space:pre-wrap;">${BX.util.htmlspecialchars(it.text)}</div>
              ${img}
              ${it.buttonUrl ? `<div class="muted" style="margin-top:6px;">${BX.util.htmlspecialchars(it.buttonText || 'Открыть')} → ${BX.util.htmlspecialchars(it.buttonUrl)}</div>` : ''}
            </div>
          `;
        }).join('');

        const wrap = wrapBlockMeta();
        return buildBlockShell(
          id, type, sort,
          `<div class="cardsPrev" style="grid-template-columns:${tpl};">${cardsHtml}</div>`,
          `
            ${commonBtns}
            <button class="ui-btn ui-btn-light ui-btn-xs" data-edit-cards-id="${id}">Редактировать</button>
            <button class="ui-btn ui-btn-danger ui-btn-xs" data-del-block-id="${id}">Удалить</button>
          `,
          `<span>cols: ${columns}</span><span>items: ${items.length}</span>`,
          '',
          wrap.extraClass,
          wrap.sectionMarkHtml
        );
      }

      const wrap = wrapBlockMeta();
      return buildBlockShell(
        id, type, sort,
        `<div class="muted">Тип блока не поддержан: ${BX.util.htmlspecialchars(type)}</div>`,
        `
          ${commonBtns}
          <button class="ui-btn ui-btn-danger ui-btn-xs" data-del-block-id="${id}">Удалить</button>
        `,
        '',
        '',
        wrap.extraClass,
        wrap.sectionMarkHtml
      );
    }).join('');

    initBlockDnD();
  }

  function saveBlockOrder(orderedIdsFromDom = null) {
    let ids = Array.isArray(orderedIdsFromDom)
      ? orderedIdsFromDom.slice()
      : Array.from(blocksBox.querySelectorAll('[data-block-id]'))
          .map(el => parseInt(el.getAttribute('data-block-id'), 10))
          .filter(Boolean);

    const knownIds = new Set(ids);

    for (const b of allPageBlocks) {
      const bid = parseInt(b.id, 10);
      if (bid > 0 && !knownIds.has(bid)) {
        ids.push(bid);
        knownIds.add(bid);
      }
    }

    return api('block.reorder', {
      pageId,
      order: JSON.stringify(ids)
    });
  }

  function initBlockDnD() {
    if (!blocksBox) return;

    const searchValue = (blockSearch?.value || '').trim();
    if (searchValue !== '') return;

    let draggedEl = null;
    let dragAllowed = false;
    let startOrder = '';

    function currentOrderedIds() {
      return Array.from(blocksBox.querySelectorAll('[data-block-id]'))
        .map(el => parseInt(el.getAttribute('data-block-id') || '0', 10))
        .filter(Boolean);
    }

    function currentOrderString() {
      return currentOrderedIds().join(',');
    }

    blocksBox.querySelectorAll('[data-block-id]').forEach(block => {
      block.setAttribute('draggable', 'false');

      const handle = block.querySelector('[data-drag-handle]');
      if (handle) {
        handle.addEventListener('mousedown', () => {
          dragAllowed = true;
          block.setAttribute('draggable', 'true');
        });

        handle.addEventListener('mouseup', () => {
          setTimeout(() => {
            block.setAttribute('draggable', 'false');
            dragAllowed = false;
          }, 0);
        });
      }

      block.addEventListener('dragstart', (e) => {
        if (!dragAllowed) {
          e.preventDefault();
          return;
        }

        draggedEl = block;
        startOrder = currentOrderString();
        block.classList.add('dragging');

        try {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', block.getAttribute('data-block-id') || '');
        } catch (err) {}
      });

      block.addEventListener('dragover', (e) => {
        if (!draggedEl || draggedEl === block) return;
        e.preventDefault();

        const rect = block.getBoundingClientRect();
        const middle = rect.top + rect.height / 2;
        const after = e.clientY > middle;

        if (after) {
          if (block.nextElementSibling !== draggedEl) {
            block.parentNode.insertBefore(draggedEl, block.nextElementSibling);
          }
        } else {
          if (block.previousElementSibling !== draggedEl) {
            block.parentNode.insertBefore(draggedEl, block);
          }
        }
      });

      block.addEventListener('drop', (e) => {
        e.preventDefault();
      });

      block.addEventListener('dragend', async () => {
        const changed = startOrder && startOrder !== currentOrderString();

        if (draggedEl) draggedEl.classList.remove('dragging');

        draggedEl = null;
        dragAllowed = false;
        block.setAttribute('draggable', 'false');

        if (!changed) return;

        try {
          const r = await saveBlockOrder(currentOrderedIds());
          if (!r || r.ok !== true) {
            notify('Не удалось сохранить порядок блоков');
            console.error('block.reorder failed', r);
            loadBlocks();
            return;
          }

          notify('Порядок сохранён');
          loadBlocks();
        } catch (err) {
          notify('Ошибка block.reorder');
          console.error(err);
          loadBlocks();
        }
      });
    });
  }

  const SECTION_PRESETS = {
    default: {
      boxed: true,
      background: '#FFFFFF',
      paddingTop: 32,
      paddingBottom: 32,
      border: false,
      radius: 0
    },
    hero: {
      boxed: true,
      background: '#F8FAFC',
      paddingTop: 72,
      paddingBottom: 72,
      border: false,
      radius: 0
    },
    light: {
      boxed: true,
      background: '#F9FAFB',
      paddingTop: 40,
      paddingBottom: 40,
      border: false,
      radius: 0
    },
    accent: {
      boxed: false,
      background: '#EEF2FF',
      paddingTop: 56,
      paddingBottom: 56,
      border: false,
      radius: 0
    },
    card: {
      boxed: true,
      background: '#FFFFFF',
      paddingTop: 32,
      paddingBottom: 32,
      border: true,
      radius: 16
    }
  };

})
            .catch(() => notify('Ошибка block.update (heading)'));
        }
      });

      setTimeout(() => {
        const t = document.getElementById('edit_h_text');
        const l = document.getElementById('edit_h_level');
        const a = document.getElementById('edit_h_align');
        const wrap = document.getElementById('edit_h_preview_wrap');
        if (!t || !l || !a || !wrap) return;

        const update = () => {
          const txt = t.value || 'Заголовок';
          const tag = headingTag(l.value);
          const al = headingAlign(a.value);
          wrap.style.textAlign = al;
          wrap.innerHTML = `<${tag} id="edit_h_preview">${BX.util.htmlspecialchars(txt)}</${tag}>`;
        };

        t.addEventListener('input', update);
        l.addEventListener('change', update);
        a.addEventListener('change', update);
        update();
      }, 0);
    });
  }

  function editCols2Block(id) {
    api('block.list', { pageId }).then(res => {
      if (!res || res.ok !== true) return;
      const blk = (res.blocks || []).find(x => parseInt(x.id,10) === id);

      const curRatio = blk && blk.content ? (blk.content.ratio || '50-50') : '50-50';
      const curLeft = blk && blk.content ? (blk.content.left || '') : '';
      const curRight = blk && blk.content ? (blk.content.right || '') : '';

      BX.UI.Dialogs.MessageBox.show({
        title: 'Редактировать Columns2 #' + id,
        message: `
          <div>
            <div class="field">
              <label>Соотношение</label>
              <select id="ec_ratio" class="input">
                <option value="50-50" ${curRatio==='50-50'?'selected':''}>50 / 50</option>
                <option value="33-67" ${curRatio==='33-67'?'selected':''}>33 / 67</option>
                <option value="67-33" ${curRatio==='67-33'?'selected':''}>67 / 33</option>
              </select>
            </div>
            <div class="field">
              <label>Левая колонка (текст)</label>
              <textarea id="ec_left" class="input" style="height:120px;">${BX.util.htmlspecialchars(curLeft)}</textarea>
            </div>
            <div class="field">
              <label>Правая колонка (текст)</label>
              <textarea id="ec_right" class="input" style="height:120px;">${BX.util.htmlspecialchars(curRight)}</textarea>
            </div>
          </div>
        `,
        buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
        onOk: function (mb) {
          const ratio = (document.getElementById('ec_ratio')?.value || '50-50');
          const left = (document.getElementById('ec_left')?.value || '');
          const right = (document.getElementById('ec_right')?.value || '');

          api('block.update', { id, ratio, left, right })
            .then(r => {
              if (!r || r.ok !== true) { notify('Не удалось сохранить columns2'); return; }
              notify('Сохранено');
              mb.close();
              loadBlocks();
            })
            .catch(() => notify('Ошибка block.update (columns2)'));
        }
      });
    });
  }

  function editSpacerBlock(id) {
    api('block.list', { pageId }).then(res => {
      if (!res || res.ok !== true) return;
      const blk = (res.blocks || []).find(x => parseInt(x.id,10) === id);
      const curH = blk && blk.content ? parseInt(blk.content.height || 40, 10) : 40;
      const curLine = blk && blk.content ? (blk.content.line === true || blk.content.line === 'true') : false;

      BX.UI.Dialogs.MessageBox.show({
        title: 'Редактировать Spacer #' + id,
        message: `
          <div>
            <div class="field">
              <label>Высота (10..200 px)</label>
              <input id="esp_h" class="input" type="number" min="10" max="200" value="${curH}" />
            </div>
            <div class="field">
              <label><input id="esp_line" type="checkbox" ${curLine ? 'checked':''} /> Рисовать линию</label>
            </div>
          </div>
        `,
        buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
        onOk: function(mb){
          const height = parseInt(document.getElementById('esp_h')?.value || String(curH), 10);
          const line = document.getElementById('esp_line')?.checked ? '1' : '0';

          api('block.update', { id, height, line })
            .then(r => {
              if (!r || r.ok !== true) { notify('Не удалось сохранить spacer'); return; }
              notify('Сохранено');
              mb.close();
              loadBlocks();
            })
            .catch(() => notify('Ошибка block.update (spacer)'));
        }
      });
    });
  }

  function editGalleryBlock(id) {
    api('block.list', { pageId }).then(res => {
      if (!res || res.ok !== true) return;
      const blk = (res.blocks || []).find(x => parseInt(x.id,10) === id);
      openGalleryDialog('edit', id, blk?.content || null);
    });
  }

  function editCardBlock(id) {
    api('block.list', { pageId }).then(res => {
      if (!res || res.ok !== true) return;
      const blk = (res.blocks || []).find(x => parseInt(x.id,10) === id);
      openCardDialog('edit', id, blk?.content || null);
    });
  }

  function addCardsBlock() {
window.SBEditor = window.SBEditor || {};

window.SBEditor.editTextBlock = function (id) {
  const st = window.SBEditor.getState();
  const api = window.SBEditor.api;
  const notify = window.SBEditor.notify;

  api('block.list', { pageId: st.pageId }).then(res => {
    if (!res || res.ok !== true) return;
    const blk = (res.blocks || []).find(x => parseInt(x.id,10) === id);

    BX.UI.Dialogs.MessageBox.show({
      title: 'Редактировать Text #' + id,
      message: `
        <div class="field">
          <label>Текст</label>
          <textarea id="edit_text_value" class="input" rows="12">${BX.util.htmlspecialchars(blk?.content?.text || '')}</textarea>
        </div>
      `,
      buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
      onOk: function (mb) {
        const text = document.getElementById('edit_text_value')?.value || '';

        api('block.update', { id, text })
          .then(r => {
            if (!r || r.ok !== true) { notify('Не удалось сохранить text'); return; }
            notify('Сохранено');
            mb.close();
            if (typeof window.SBEditor.loadBlocks === 'function') {
              window.SBEditor.loadBlocks();
            }
          })
          .catch(() => notify('Ошибка block.update (text)'));
      }
    });
  });
};

window.SBEditor.editImageBlock = async function (id) {
  const st = window.SBEditor.getState();
  const api = window.SBEditor.api;
  const notify = window.SBEditor.notify;

  let files = [];
  try { files = await window.SBEditor.getFilesForSite(); }
  catch (e) { notify('Не удалось загрузить файлы сайта'); return; }

  const res = await api('block.list', { pageId: st.pageId });
  if (!res || res.ok !== true) return;
  const blk = (res.blocks || []).find(x => parseInt(x.id,10) === id);

  const curFile = parseInt(blk?.content?.fileId || 0, 10);
  const curAlt = blk?.content?.alt || '';

  const opts = ['<option value="0">— выбрать файл —</option>']
    .concat(files.map(f => `<option value="${f.id}" ${parseInt(f.id,10)===curFile?'selected':''}>${BX.util.htmlspecialchars(f.name)} (#${f.id})</option>`))
    .join('');

  BX.UI.Dialogs.MessageBox.show({
    title: 'Редактировать Image #' + id,
    message: `
      <div class="field">
        <label>Файл</label>
        <select id="edit_image_file" class="input">${opts}</select>
      </div>
      <div class="field">
        <label>Alt</label>
        <input id="edit_image_alt" class="input" value="${BX.util.htmlspecialchars(curAlt)}" />
      </div>
      <div id="edit_image_preview_wrap" style="margin-top:10px;"></div>
    `,
    buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
    onOk: function (mb) {
      const fileId = parseInt(document.getElementById('edit_image_file')?.value || '0', 10);
      const alt = document.getElementById('edit_image_alt')?.value || '';

      if (!fileId) { notify('Выбери файл'); return; }

      api('block.update', { id, fileId, alt })
        .then(r => {
          if (!r || r.ok !== true) { notify('Не удалось сохранить image'); return; }
          notify('Сохранено');
          mb.close();
          if (typeof window.SBEditor.loadBlocks === 'function') {
            window.SBEditor.loadBlocks();
          }
        })
        .catch(() => notify('Ошибка block.update (image)'));
    }
  });

  setTimeout(() => {
    const sel = document.getElementById('edit_image_file');
    const wrap = document.getElementById('edit_image_preview_wrap');
    if (!sel || !wrap) return;

    const renderPrev = () => {
      const fid = parseInt(sel.value || '0', 10);
      wrap.innerHTML = fid ? `<div class="imgPrev"><img src="${window.SBEditor.fileDownloadUrl(st.siteId, fid)}" alt=""></div>` : '';
    };

    sel.addEventListener('change', renderPrev);
    renderPrev();
  }, 0);
};

window.SBEditor.editButtonBlock = function (id) {
  const st = window.SBEditor.getState();
  const api = window.SBEditor.api;
  const notify = window.SBEditor.notify;

  api('block.list', { pageId: st.pageId }).then(res => {
    if (!res || res.ok !== true) return;
    const blk = (res.blocks || []).find(x => parseInt(x.id,10) === id);

    BX.UI.Dialogs.MessageBox.show({
      title: 'Редактировать Button #' + id,
      message: `
        <div class="field">
          <label>Текст кнопки</label>
          <input id="edit_btn_text" class="input" value="${BX.util.htmlspecialchars(blk?.content?.text || '')}" />
        </div>
        <div class="field">
          <label>URL</label>
          <input id="edit_btn_url" class="input" value="${BX.util.htmlspecialchars(blk?.content?.url || '/')}" />
        </div>
        <div class="field">
          <label>Вариант</label>
          <select id="edit_btn_variant" class="input">
            <option value="primary" ${(blk?.content?.variant || 'primary')==='primary'?'selected':''}>primary</option>
            <option value="secondary" ${(blk?.content?.variant || '')==='secondary'?'selected':''}>secondary</option>
          </select>
        </div>
      `,
      buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
      onOk: function (mb) {
        const text = document.getElementById('edit_btn_text')?.value || '';
        const url = document.getElementById('edit_btn_url')?.value || '';
        const variant = document.getElementById('edit_btn_variant')?.value || 'primary';

        api('block.update', { id, text, url, variant })
          .then(r => {
            if (!r || r.ok !== true) { notify('Не удалось сохранить button'); return; }
            notify('Сохранено');
            mb.close();
            if (typeof window.SBEditor.loadBlocks === 'function') {
              window.SBEditor.loadBlocks();
            }
          })
          .catch(() => notify('Ошибка block.update (button)'));
      }
    });
  });
};

window.SBEditor.editHeadingBlock = function (id) {
  const st = window.SBEditor.getState();
  const api = window.SBEditor.api;
  const notify = window.SBEditor.notify;

  api('block.list', { pageId: st.pageId }).then(res => {
    if (!res || res.ok !== true) return;
    const blk = (res.blocks || []).find(x => parseInt(x.id,10) === id);

    BX.UI.Dialogs.MessageBox.show({
      title: 'Редактировать Heading #' + id,
      message: `
        <div class="field">
          <label>Текст</label>
          <input id="edit_h_text" class="input" value="${BX.util.htmlspecialchars(blk?.content?.text || '')}" />
        </div>
        <div class="field">
          <label>Уровень</label>
          <select id="edit_h_level" class="input">
            <option value="h1" ${(blk?.content?.level || '')==='h1'?'selected':''}>h1</option>
            <option value="h2" ${(blk?.content?.level || 'h2')==='h2'?'selected':''}>h2</option>
            <option value="h3" ${(blk?.content?.level || '')==='h3'?'selected':''}>h3</option>
          </select>
        </div>
        <div class="field">
          <label>Выравнивание</label>
          <select id="edit_h_align" class="input">
            <option value="left" ${(blk?.content?.align || 'left')==='left'?'selected':''}>left</option>
            <option value="center" ${(blk?.content?.align || '')==='center'?'selected':''}>center</option>
            <option value="right" ${(blk?.content?.align || '')==='right'?'selected':''}>right</option>
          </select>
        </div>
        <div id="edit_h_preview_wrap" style="margin-top:10px;border:1px dashed #d1d5db;border-radius:10px;padding:12px;background:#fff;"></div>
      `,
      buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
      onOk: function (mb) {
        const text = document.getElementById('edit_h_text')?.value || '';
        const level = document.getElementById('edit_h_level')?.value || 'h2';
        const align = document.getElementById('edit_h_align')?.value || 'left';

        api('block.update', { id, text, level, align })
          .then(r => {
            if (!r || r.ok !== true) { notify('Не удалось сохранить heading'); return; }
            notify('Сохранено');
            mb.close();
            if (typeof window.SBEditor.loadBlocks === 'function') {
              window.SBEditor.loadBlocks();
            }
          })
          .catch(() => notify('Ошибка block.update (heading)'));
      }
    });
setTimeout(() => {
        const txt = document.getElementById('edit_btn_text');
        const url = document.getElementById('edit_btn_url');
        const variant = document.getElementById('edit_btn_variant');
        const prev = document.getElementById('edit_btn_preview');

        if (!txt || !url || !variant || !prev) return;

        const sync = () => {
          prev.textContent = txt.value || 'Кнопка';
          prev.setAttribute('href', url.value || '#');
          prev.className = btnClass(variant.value || 'primary');
        };

        txt.addEventListener('input', sync);
        url.addEventListener('input', sync);
        variant.addEventListener('change', sync);
        sync();
      }, 0);
    });
  }

  // ---- expose legacy names so current editor.php can still call them ----
  window.saveTemplateFromPage = window.SBEditor.saveTemplateFromPage;
  window.applyTemplateToPage = window.SBEditor.applyTemplateToPage;
  window.openSectionsLibrary = window.SBEditor.openSectionsLibrary;
  window.openCardsBuilderDialog = window.SBEditor.openCardsBuilderDialog;

  window.addTextBlock = window.SBEditor.addTextBlock;
  window.addImageBlock = window.SBEditor.addImageBlock;
  window.addButtonBlock = window.SBEditor.addButtonBlock;
  window.addHeadingBlock = window.SBEditor.addHeadingBlock;
  window.addCols2Block = window.SBEditor.addCols2Block;
  window.addGalleryBlock = window.SBEditor.addGalleryBlock;
  window.addSpacerBlock = window.SBEditor.addSpacerBlock;
  window.addCardBlock = window.SBEditor.addCardBlock;
  window.addCardsBlock = window.SBEditor.addCardsBlock;

  window.editTextBlock = window.SBEditor.editTextBlock;
  window.editImageBlock = window.SBEditor.editImageBlock;
  window.editButtonBlock = window.SBEditor.editButtonBlock;
  window.editHeadingBlock = window.SBEditor.editHeadingBlock;
  window.editCols2Block = window.SBEditor.editCols2Block;
  window.editGalleryBlock = window.SBEditor.editGalleryBlock;
  window.editSpacerBlock = window.SBEditor.editSpacerBlock;
  window.editCardBlock = window.SBEditor.editCardBlock;
  window.editCardsBlock = window.SBEditor.editCardsBlock;
})();